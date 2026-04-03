/**
 * Submission Routes
 * 
 * Handles content submissions from the /submit form
 * - Stores form data in LevelDB
 * - Saves file attachments to data-submissions folder
 * - Auto-registers users on submission
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { submissionsDb } from '../db/index.js';
import { createUser, findUserByEmail } from '../db/users.js';
import { isSuperUserEmail } from '../config/superUsers.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ─── PMID / URL normalizer ────────────────────────────────────────────────────
// Returns bare PubMed digits when possible, otherwise lowercased trimmed URL.
// e.g. all of these → '12345678':
//   '12345678', 'PMID: 12345678', 'pubmed.ncbi.nlm.nih.gov/12345678',
//   'https://pubmed.ncbi.nlm.nih.gov/12345678/', 'https://www.ncbi.nlm.nih.gov/pubmed/12345678'
function normalizePmid(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!s) return null;

  // Strip known PubMed URL patterns
  const urlPatterns = [
    /(?:https?:\/\/)?(?:www\.)?(?:pubmed\.ncbi\.nlm\.nih\.gov|ncbi\.nlm\.nih\.gov\/pubmed)[\/?]*(\d+)\/?/i,
    /(?:https?:\/\/)?(?:www\.)?doi\.org\/(.+)/i,
  ];
  for (const re of urlPatterns) {
    const m = s.match(re);
    if (m) return m[1].toLowerCase().replace(/\/$/, '');
  }

  // Strip 'PMID:' prefix and whitespace
  const pmidPrefix = s.replace(/^pmid[:\s]*/i, '').trim();
  if (/^\d+$/.test(pmidPrefix)) return pmidPrefix;

  // Fall back to lowercased, trailing-slash-stripped raw value
  return s.toLowerCase().replace(/\/$/, '');
}

// Build the set of normalised identifiers for a submission to compare against
function getSubmissionIdentifiers(sub) {
  const ids = new Set();
  // Only check published submissions — pre-publication ones rarely have PMIDs
  if (sub.publicationType !== 'published') return ids;
  for (const field of [sub.pmid, sub.associatedPaper, sub.linkToData]) {
    const n = normalizePmid(field);
    if (n) ids.add(n);
  }
  return ids;
}

// ─── Duplicate detection ──────────────────────────────────────────────────────
// Scans all existing published submissions for PMID/URL overlap.
// Returns null if no conflict, or an object describing the conflict.
async function findConflict(newType, incomingIds) {
  if (!incomingIds.size) return null;

  let bestConflict = null; // data submission conflict takes priority over suggestion conflict

  for await (const [key, sub] of submissionsDb.iterator()) {
    if (sub.publicationType !== 'published') continue;

    const existingIds = getSubmissionIdentifiers(sub);
    const overlap = [...incomingIds].some(id => existingIds.has(id));
    if (!overlap) continue;

    const conflict = {
      existingId: key,
      existingType: sub.submissionType,
      existingTitle: sub.paperTitle || sub.studyName || '',
      existingStatus: sub.displayStatus || sub.status || '',
    };

    // Data submission conflicts always win — return immediately
    if (sub.submissionType === 'submit-data') {
      return conflict;
    }
    // Suggestion conflict — keep looking in case there's a data sub too
    bestConflict = conflict;
  }

  return bestConflict;
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const submissionId = req.params.id || req.body.submissionId || `submission_${uuidv4()}`;
    if (!req.body.submissionId) req.body.submissionId = submissionId;

    // If originalname contains path separators (from webkitRelativePath),
    // create the full nested directory so multer can write the file there.
    // Directory is only created when there is an actual file to write.
    const relativePath = file.originalname.replace(/\\/g, '/');
    const subdir = relativePath.includes('/')
      ? path.dirname(relativePath)
      : '';

    const baseDir = path.join(__dirname, '../../data-submissions', submissionId);
    const uploadDir = subdir ? path.join(baseDir, subdir) : baseDir;

    try {
      // mkdir is called here — this is fine because multer only invokes
      // destination() when it has a real file to store, so the folder
      // is never created for submissions with no attachments.
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: function (req, file, cb) {
    // Strip any leading path components — destination() already created the
    // correct subdirectory, so here we only need the bare filename
    const bare = path.basename(file.originalname.replace(/\\/g, '/'));
    cb(null, bare);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept all file types
    cb(null, true);
  }
});

/**
 * GET /api/submit/public
 * Get public submissions for non-authenticated users:
 * - All published submissions (study suggestions + data submissions)
 * - Pre-publication data submissions with sharingPreference === 'public'
 */
router.get('/public', async (req, res) => {
  try {
    const submissions = [];

    for await (const [key, submission] of submissionsDb.iterator()) {
      // Always include published submissions
      if (submission.publicationType === 'published') {
        submissions.push({ ...submission, id: key });
        continue;
      }
      // Include pre-publication only if sharing preference is public
      if (submission.publicationType === 'preprint' && submission.sharingPreference === 'public') {
        submissions.push({ ...submission, id: key });
      }
    }

    submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    res.json({
      status: 'success',
      data: { submissions, count: submissions.length }
    });
  } catch (error) {
    console.error('Get public submissions error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch submissions' });
  }
});

/**
 * POST /api/submit/bulk-import
 * Bulk import study suggestions (e.g. from GitHub issues).
 * Super users only.
 * Body: { submissions: [...], clearExisting: boolean }
 *   clearExisting: if true, deletes all existing suggest-paper / github-import entries first.
 */
router.post('/bulk-import',
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== 'super') {
        return res.status(403).json({ status: 'error', message: 'Super users only' });
      }

      const { submissions = [], clearExisting = false } = req.body;

      if (!Array.isArray(submissions) || submissions.length === 0) {
        return res.status(400).json({ status: 'error', message: 'No submissions provided' });
      }

      let deleted = 0;

      // Optionally wipe existing study-suggestion / github-import entries
      if (clearExisting) {
        const toDelete = [];
        for await (const [key, val] of submissionsDb.iterator()) {
          if (
            key.startsWith('github_') ||
            val.submissionType === 'suggest-paper' ||
            val.source === 'github-import'
          ) {
            toDelete.push(key);
          }
        }
        for (const key of toDelete) {
          await submissionsDb.del(key);
        }
        deleted = toDelete.length;
        console.log(`🗑️  Bulk import: deleted ${deleted} existing study-suggestion entries`);
      }

      // Insert each submission
      let imported = 0;
      const seenKeys = new Set();

      for (const sub of submissions) {
        if (!sub.id) continue;

        // Ensure unique key (handle duplicate PMIDs)
        let key = sub.id;
        let suffix = 1;
        while (seenKeys.has(key)) {
          key = `${sub.id}_${suffix++}`;
        }
        seenKeys.add(key);

        await submissionsDb.put(key, { ...sub, id: key });
        imported++;
      }

      console.log(`✅ Bulk import complete: ${imported} inserted, ${deleted} deleted`);

      res.status(201).json({
        status: 'success',
        message: 'Bulk import complete',
        data: { deleted, imported }
      });

    } catch (error) {
      console.error('Bulk import error:', error);
      res.status(500).json({ status: 'error', message: 'Bulk import failed', error: error.message });
    }
  }
);

/**
 * POST /api/submit
 * Submit new content (paper suggestion or data submission)
 * Requires authentication
 */
router.post('/',
  authenticateToken,
  upload.fields([
    { name: 'files', maxCount: 500 },
    { name: 'data', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      console.log('📥 Received submission from:', req.user.email);
      
      // Parse the form data
      const formData = JSON.parse(req.body.data || '{}');
      
      let userId = req.user.id;
      
      // If user is temporary (guest), create them in DB now
      // But only if they're NOT a super user
      if (req.user.isTemporary && req.user.role !== 'super') {
        // Double-check they're not a super user
        if (isSuperUserEmail(req.user.email)) {
          return res.status(403).json({
            status: 'error',
            message: 'Super users should already be registered. Please contact admin.'
          });
        }
        
        // Check if user already exists by email
        let existingUser = await findUserByEmail(req.user.email);
        
        if (!existingUser) {
          const newUser = await createUser({
            email: req.user.email,
            name: req.user.name || formData.name,
            provider: req.user.provider,
            providerId: req.user.providerId,
            role: 'user'
          });
          
          userId = newUser.id;
          console.log(`✅ User auto-registered on submission: ${newUser.email}`);
        } else {
          userId = existingUser.id;
        }
      }
      
      // Generate submission ID
      const submissionId = req.body.submissionId || `submission_${uuidv4()}`;
      
      // Process uploaded files
      // With upload.fields(), files are in req.files as an object with field names as keys
      const uploadedFiles = (req.files?.files || []).map(file => ({
        originalName: file.originalname,
        relativePath: file.originalname, // bare filename; webkitRelativePath already encoded in path
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path
      }));
      
      // Create submission object
      const submission = {
        id: submissionId,
        userId,
        
        // Submission metadata
        submissionType: formData.actionType, // 'suggest-paper' or 'submit-data'
        publicationType: formData.publicationType, // 'published' or 'preprint'
        status: 'pending',
        submittedAt: new Date().toISOString(),
        
        // Contact information
        submitterName: formData.name || req.user.name,
        submitterEmail: formData.email || req.user.email,
        canContactEmail: formData.canContactEmail,
        alternativeEmail: formData.alternativeEmail,
        
        // Paper-specific fields
        paperTitle: formData.paperTitle,
        pmid: formData.pmid,
        journal: formData.journal,
        isLeadAuthor: formData.isLeadAuthor,
        wantsToHelpCurate: formData.wantsToHelpCurate,
        
        // Data submission fields
        studyName: formData.studyName,
        description: formData.description,
        associatedPaper: formData.associatedPaper,
        linkToData: formData.linkToData,
        isDataTransformed: formData.isDataTransformed,
        referenceGenome: formData.referenceGenome,
        
        // Common fields
        dataTypes: formData.dataTypes || [],
        otherDataType: formData.otherDataType,
        notes: formData.notes,
        
        // Pre-print specific
        sharingPreference: formData.sharingPreference, // 'public' or 'private'
        privateAccessEmails: formData.privateAccessEmails,
        
        // File attachments
        attachments: uploadedFiles,
        hasAttachments: uploadedFiles.length > 0,
        attachmentCount: uploadedFiles.length,
        
        // Timestamps
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // ─── Duplicate / conflict detection (published only, skip for super users) ───
      const isSuperBypass = req.user.role === 'super';
      const isPublished = formData.publicationType === 'published';

      if (isPublished && !isSuperBypass) {
        const incomingIds = new Set();
        for (const field of [formData.pmid, formData.associatedPaper, formData.linkToData]) {
          const n = normalizePmid(field);
          if (n) incomingIds.add(n);
        }

        const conflict = await findConflict(formData.actionType, incomingIds);

        if (conflict) {
          const newIsData = formData.actionType === 'submit-data';
          const existingIsData = conflict.existingType === 'submit-data';

          if (existingIsData) {
            // Hard block: a data submission already exists — suggestion or new data sub both blocked
            return res.status(409).json({
              status: 'conflict',
              conflictType: 'data-submission-exists',
              message: existingIsData && !newIsData
                ? 'A data submission for this study is already in progress.'
                : 'A data submission for this study already exists.',
              existingSubmissionId: conflict.existingId,
              existingSubmissionType: conflict.existingType,
              existingTitle: conflict.existingTitle,
              existingStatus: conflict.existingStatus,
            });
          }

          if (!newIsData && !existingIsData) {
            // Soft block: suggestion already exists
            return res.status(409).json({
              status: 'conflict',
              conflictType: 'suggestion-exists',
              message: 'This study has already been suggested for curation.',
              existingSubmissionId: conflict.existingId,
              existingSubmissionType: conflict.existingType,
              existingTitle: conflict.existingTitle,
              existingStatus: conflict.existingStatus,
            });
          }

          // New data submission supersedes an existing suggestion:
          // allow it, but tag the existing suggestion as superseded
          if (newIsData && !existingIsData) {
            try {
              const existingSub = await submissionsDb.get(conflict.existingId);
              existingSub.supersededBy = submissionId;
              existingSub.supersededAt = new Date().toISOString();
              existingSub.updatedAt = new Date().toISOString();
              await submissionsDb.put(conflict.existingId, existingSub);
              console.log(`⚠️  Suggestion ${conflict.existingId} superseded by new data submission ${submissionId}`);
            } catch (e) {
              console.warn('⚠️  Could not tag superseded suggestion:', e.message);
            }
          }
        }
      }

      // Save to LevelDB
      await submissionsDb.put(submissionId, submission);
      
      console.log(`✅ Submission created: ${submissionId}`);
      console.log(`   Type: ${submission.submissionType}`);
      console.log(`   User: ${req.user.email}`);
      console.log(`   Files: ${uploadedFiles.length}`);
      
      res.status(201).json({
        status: 'success',
        message: 'Submission created successfully',
        data: {
          submissionId,
          submissionType: submission.submissionType,
          status: submission.status,
          attachmentCount: uploadedFiles.length
        }
      });
      
    } catch (error) {
      console.error('❌ Create submission error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create submission',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/submit/:id
 * Get a specific submission by ID
 * Owner or super user only
 */
router.get('/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const submission = await submissionsDb.get(req.params.id);
      
      // Check permissions
      if (submission.userId !== req.user.id && req.user.role !== 'super') {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. You can only view your own submissions.'
        });
      }
      
      res.json({
        status: 'success',
        data: { submission: { ...submission, id: req.params.id } }
      });
      
    } catch (error) {
      if (error.code === 'LEVEL_NOT_FOUND') {
        return res.status(404).json({
          status: 'error',
          message: 'Submission not found'
        });
      }
      
      console.error('Get submission error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch submission'
      });
    }
  }
);

/**
 * GET /api/submit
 * Get all submissions (paginated)
 * Super users see all, regular users see only theirs
 */
router.get('/',
  authenticateToken,
  async (req, res) => {
    try {
      const submissions = [];
      
      for await (const [key, submission] of submissionsDb.iterator()) {
        // Super users see all submissions
        if (req.user.role === 'super') {
          submissions.push({ ...submission, id: key });
        } 
        // Regular users only see their own
        else if (submission.userId === req.user.id) {
          submissions.push({ ...submission, id: key });
        }
      }
      
      // Sort by submission date (newest first)
      submissions.sort((a, b) => 
        new Date(b.submittedAt) - new Date(a.submittedAt)
      );
      
      res.json({
        status: 'success',
        data: {
          submissions,
          count: submissions.length
        }
      });
      
    } catch (error) {
      console.error('Get submissions error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch submissions'
      });
    }
  }
);

/**
 * PATCH /api/submit/:id/status
 * Update submission status
 * Super users only
 */
router.patch('/:id/status',
  authenticateToken,
  body('status').isIn([
    'pending', 
    'received', 
    'in-progress', 
    'in-review',
    'missing-data',
    'not-curatable',
    'in-portal',
    'approved', 
    'rejected'
  ]).withMessage('Invalid status'),
  async (req, res) => {
    try {
      // Only super users can update status
      if (req.user.role !== 'super') {
        return res.status(403).json({
          status: 'error',
          message: 'Only super users can update submission status'
        });
      }
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const submission = await submissionsDb.get(req.params.id);
      
      submission.status = req.body.status;
      submission.displayStatus = req.body.displayStatus || null;
      submission.updatedAt = new Date().toISOString();
      submission.statusUpdatedBy = req.user.id;
      submission.statusUpdatedAt = new Date().toISOString();
      
      await submissionsDb.put(req.params.id, submission);
      
      console.log(`✅ Status updated: ${req.params.id} → ${req.body.status}`);
      
      res.json({
        status: 'success',
        message: 'Status updated successfully',
        data: {
          submission: { ...submission, id: req.params.id }
        }
      });
      
    } catch (error) {
      if (error.code === 'LEVEL_NOT_FOUND') {
        return res.status(404).json({
          status: 'error',
          message: 'Submission not found'
        });
      }
      
      console.error('Update status error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update status'
      });
    }
  }
);

/**
 * PATCH /api/submit/:id/curation-notes
 * Update curation team notes
 * Super users only
 */
router.patch('/:id/curation-notes',
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== 'super') {
        return res.status(403).json({ status: 'error', message: 'Only super users can update curation notes' });
      }
      const submission = await submissionsDb.get(req.params.id);
      const { curationNotes, action, noteIndex } = req.body;

      // action='append'  → add a new note
      // action='edit'    → replace note at noteIndex
      // action='delete'  → remove note at noteIndex
      // (legacy: no action) → treat as append for backwards compat

      // Migrate legacy single-string curationNotes to array
      let notes = submission.curationNotesArray || [];
      if (!notes.length && submission.curationNotes) {
        notes = [{
          text: submission.curationNotes,
          addedAt: submission.curationNotesUpdatedAt || submission.updatedAt || new Date().toISOString(),
          addedBy: submission.curationNotesUpdatedBy || 'curation team',
        }];
      }

      if (action === 'edit' && noteIndex >= 0 && noteIndex < notes.length) {
        notes[noteIndex] = { ...notes[noteIndex], text: curationNotes, editedAt: new Date().toISOString() };
      } else if (action === 'delete' && noteIndex >= 0 && noteIndex < notes.length) {
        notes.splice(noteIndex, 1);
      } else {
        // append (default)
        notes.push({
          text: curationNotes ?? '',
          addedAt: new Date().toISOString(),
          addedBy: req.user.email,
        });
      }

      submission.curationNotesArray = notes;
      // Keep legacy field in sync with latest note for any old readers
      submission.curationNotes = notes.length ? notes[notes.length - 1].text : '';
      submission.curationNotesUpdatedAt = new Date().toISOString();
      submission.curationNotesUpdatedBy = req.user.email;
      submission.updatedAt = new Date().toISOString();

      await submissionsDb.put(req.params.id, submission);
      console.log(`✅ Curation notes updated: ${req.params.id} (${notes.length} note(s))`);
      res.json({ status: 'success', message: 'Curation notes updated', data: { curationNotesArray: notes, curationNotes: submission.curationNotes } });
    } catch (error) {
      if (error.code === 'LEVEL_NOT_FOUND') {
        return res.status(404).json({ status: 'error', message: 'Submission not found' });
      }
      console.error('Update curation notes error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update curation notes' });
    }
  }
);

/**
 * POST /api/submit/:id/add-files
 * Submitter adds new files to an existing submission.
 * Files go into a subfolder named update_YYYY-MM-DD inside the submission directory.
 * Owner only.
 */
router.post('/:id/add-files',
  authenticateToken,
  upload.fields([{ name: 'files', maxCount: 500 }]),
  async (req, res) => {
    try {
      let submission;
      try {
        submission = await submissionsDb.get(req.params.id);
      } catch (e) {
        return res.status(404).json({ status: 'error', message: 'Submission not found' });
      }

      const ownerById = submission.userId === req.user.id;
      const ownerByEmail = submission.submitterEmail &&
        req.user.email &&
        submission.submitterEmail.toLowerCase().trim() === req.user.email.toLowerCase().trim();

      if (!ownerById && !ownerByEmail && req.user.role !== 'super') {
        return res.status(403).json({ status: 'error', message: 'Access denied' });
      }

      const uploadedFiles = req.files?.files || [];
      if (uploadedFiles.length === 0) {
        return res.status(400).json({ status: 'error', message: 'No files provided' });
      }

      // Create dated subfolder: update_YYYY-MM-DD
      const dateStr = new Date().toISOString().slice(0, 10);
      const subfolderName = `update_${dateStr}`;
      const subfolderPath = path.join(__dirname, '../../data-submissions', req.params.id, subfolderName);
      await fs.mkdir(subfolderPath, { recursive: true });

      // Move uploaded files from multer temp location into the dated subfolder
      const newAttachments = [];
      for (const file of uploadedFiles) {
        const destPath = path.join(subfolderPath, file.originalname);
        await fs.rename(file.path, destPath);
        newAttachments.push({
          originalName: file.originalname,
          filename: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          path: destPath,
          subfolder: subfolderName,
          addedAt: new Date().toISOString(),
          addedBy: req.user.email,
        });
      }

      // Append to existing attachments
      submission.attachments = [...(submission.attachments || []), ...newAttachments];
      submission.hasAttachments = true;
      submission.attachmentCount = submission.attachments.length;
      submission.updatedAt = new Date().toISOString();
      submission.lastFileAddedAt = new Date().toISOString();

      await submissionsDb.put(req.params.id, submission);

      console.log(`✅ ${uploadedFiles.length} file(s) added to submission ${req.params.id} in ${subfolderName}`);

      res.json({
        status: 'success',
        message: `${uploadedFiles.length} file(s) added successfully`,
        data: { subfolder: subfolderName, files: newAttachments },
      });
    } catch (error) {
      console.error('Add files error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to add files' });
    }
  }
);

/**
 * PATCH /api/submit/:id/add-note
 * Submitter appends a note to their submission.
 * Notes are stored in submitterNotes[] with timestamp — separate from curation team notes.
 * Owner only.
 */
router.patch('/:id/add-note',
  authenticateToken,
  async (req, res) => {
    try {
      let submission;
      try {
        submission = await submissionsDb.get(req.params.id);
      } catch (e) {
        return res.status(404).json({ status: 'error', message: 'Submission not found' });
      }

      const ownerById = submission.userId === req.user.id;
      const ownerByEmail = submission.submitterEmail &&
        req.user.email &&
        submission.submitterEmail.toLowerCase().trim() === req.user.email.toLowerCase().trim();

      if (!ownerById && !ownerByEmail && req.user.role !== 'super') {
        return res.status(403).json({ status: 'error', message: 'Access denied' });
      }

      const { note } = req.body;
      if (!note?.trim()) {
        return res.status(400).json({ status: 'error', message: 'Note cannot be empty' });
      }

      const newNote = {
        text: note.trim(),
        addedAt: new Date().toISOString(),
        addedBy: req.user.email,
      };

      submission.submitterNotes = [...(submission.submitterNotes || []), newNote];
      submission.updatedAt = new Date().toISOString();

      await submissionsDb.put(req.params.id, submission);

      console.log(`✅ Note added to submission ${req.params.id} by ${req.user.email}`);

      res.json({
        status: 'success',
        message: 'Note added successfully',
        data: { note: newNote, totalNotes: submission.submitterNotes.length },
      });
    } catch (error) {
      console.error('Add note error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to add note' });
    }
  }
);

/**
 * DELETE /api/submit/:id
 * Delete a submission
 * Owner or super user only
 */
router.delete('/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const submission = await submissionsDb.get(req.params.id);
      
      // Check permissions
      if (submission.userId !== req.user.id && req.user.role !== 'super') {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. You can only delete your own submissions.'
        });
      }
      
      // Delete from database
      await submissionsDb.del(req.params.id);
      
      // Delete associated files
      if (submission.hasAttachments) {
        const submissionDir = path.join(__dirname, '../../data-submissions', req.params.id);
        try {
          await fs.rm(submissionDir, { recursive: true, force: true });
          console.log(`🗑️  Deleted files for submission: ${req.params.id}`);
        } catch (error) {
          console.error(`⚠️  Failed to delete files for ${req.params.id}:`, error);
        }
      }
      
      console.log(`✅ Submission deleted: ${req.params.id}`);
      
      res.json({
        status: 'success',
        message: 'Submission deleted successfully'
      });
      
    } catch (error) {
      if (error.code === 'LEVEL_NOT_FOUND') {
        return res.status(404).json({
          status: 'error',
          message: 'Submission not found'
        });
      }
      
      console.error('Delete submission error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete submission'
      });
    }
  }
);

// Multer error handler — must have 4 params to be recognised by Express
// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ status: 'error', message: 'File too large. Maximum size is 100MB per file.' });
  }
  if (err?.code === 'LIMIT_FILE_COUNT' || err?.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ status: 'error', message: 'Too many files. Maximum is 500 files per upload.' });
  }
  next(err);
});

export default router;
