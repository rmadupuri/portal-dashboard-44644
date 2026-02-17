/**
 * Tracker Routes
 * 
 * Handles submission tracking with role-based access control
 * - Common users see limited columns
 * - Super users see all columns
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import {
  createSubmission,
  findSubmissionById,
  getAllSubmissions,
  getSubmissionsByUserId,
  updateSubmission,
  updateSubmissionStatus,
  deleteSubmission,
  getSubmissionStats
} from '../db/submissions.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireSuper } from '../middleware/roleCheck.js';
import { filterSubmissionByRole, filterSubmissionsByRole } from '../utils/filters.js';

const router = express.Router();

// -- Multer Setup for File Uploads --
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename and append unique suffix
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

/**
 * GET /api/tracker
 * Get all submissions (filtered by user role)
 * Public fields for common users, all fields for super users
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, cancerType } = req.query;

    // Build filters
    const filters = {};
    if (status) filters.status = status;
    if (cancerType) filters.cancerType = cancerType;

    // Get all submissions
    const submissions = await getAllSubmissions(filters);

    // Filter based on user role
    const filteredSubmissions = filterSubmissionsByRole(submissions, req.user.role);

    res.json({
      status: 'success',
      data: {
        submissions: filteredSubmissions,
        count: filteredSubmissions.length
      }
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch submissions'
    });
  }
});

/**
 * GET /api/tracker/my
 * Get current user's submissions
 * Users can see full details of their own submissions
 */
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const submissions = await getSubmissionsByUserId(req.user.id);

    res.json({
      status: 'success',
      data: {
        submissions,
        count: submissions.length
      }
    });
  } catch (error) {
    console.error('Get my submissions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch your submissions'
    });
  }
});

/**
 * GET /api/tracker/stats
 * Get submission statistics
 * Super users only
 */
router.get('/stats', authenticateToken, requireSuper, async (req, res) => {
  try {
    const stats = await getSubmissionStats();

    res.json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch statistics'
    });
  }
});

/**
 * GET /api/tracker/:id
 * Get single submission by ID (filtered by user role)
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const submission = await findSubmissionById(req.params.id);

    if (!submission) {
      return res.status(404).json({
        status: 'error',
        message: 'Submission not found'
      });
    }

    // Users can see full details of their own submissions
    // Otherwise filter by role
    let filteredSubmission;
    if (submission.userId === req.user.id || req.user.role === 'super') {
      filteredSubmission = submission;
    } else {
      filteredSubmission = filterSubmissionByRole(submission, req.user.role);
    }

    res.json({
      status: 'success',
      data: {
        submission: filteredSubmission
      }
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch submission'
    });
  }
});

/**
 * POST /api/tracker
 * Create new submission
 * Supports multipart/form-data for file uploads
 */
router.post('/',
  authenticateToken,
  upload.any(), // Handle 'file' or 'supportingFile' or multiple files
  async (req, res) => {
    try {
      let submissionData = req.body;

      // Handle raw JSON data sent as string in 'data' field (common pattern with FormData)
      if (req.body.data && typeof req.body.data === 'string') {
        try {
          const parsedData = JSON.parse(req.body.data);
          submissionData = { ...submissionData, ...parsedData };
        } catch (e) {
          console.error('Failed to parse JSON data field:', e);
          return res.status(400).json({ status: 'error', message: 'Invalid JSON in data field' });
        }
      }

      // Collect uploaded file URLs
      const fileUrls = [];
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          // In production, upload to S3 here. For now, use local path.
          // Construct URL relative to backend
          const fileUrl = `/uploads/${file.filename}`;
          fileUrls.push(fileUrl);
        });
      }
      submissionData.fileUrls = fileUrls;

      // -- Validation Logic (Manual check since express-validator is tricky with optional parsing) --
      const errors = [];
      const { actionType } = submissionData;

      if (!actionType) {
        errors.push({ msg: 'Action type is required', path: 'actionType' });
      }

      /* 
       * Conditional Validation based on actionType
       * Common fields: contactName, contactEmail, institutionName, dataType 
       * but implementation_plan says we should align with frontend usage.
       * Frontend actually allows minimal fields for "Suggest Paper".
       * Let's enforce basic requirements but stay flexible.
       */

      if (actionType === 'submit-data') {
        if (!submissionData.studyName) errors.push({ msg: 'Study Name is required', path: 'studyName' });
        if (!submissionData.description) errors.push({ msg: 'Description is required', path: 'description' });
      } else if (actionType === 'suggest-paper') {
        if (!submissionData.pmid) errors.push({ msg: 'PMID or URL is required', path: 'pmid' });
      }

      // Ensure required contact info if not provided in JSON (though usually it is)
      // Frontend form sends name/email. Backend schema maps these to contactName/contactEmail if needed?
      // Actually frontend form sends `name`, `email`. Backend expects `contactName`, `contactEmail`?
      // Let's map them if missing.
      if (!submissionData.contactName && submissionData.name) submissionData.contactName = submissionData.name;
      if (!submissionData.contactEmail && submissionData.email) submissionData.contactEmail = submissionData.email;

      // Basic contact validation
      if (!submissionData.contactName) errors.push({ msg: 'Name is required', path: 'name' });
      if (!submissionData.contactEmail) errors.push({ msg: 'Email is required', path: 'email' });


      if (errors.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: errors
        });
      }

      const userId = req.user.id;
      const finalSubmissionData = {
        ...submissionData,
        userId
      };

      const submission = await createSubmission(finalSubmissionData);

      res.status(201).json({
        status: 'success',
        message: 'Submission created successfully',
        data: {
          submission
        }
      });
    } catch (error) {
      console.error('Create submission error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create submission'
      });
    }
  }
);

/**
 * PUT /api/tracker/:id
 * Update submission
 * Owner or super user only
 */
router.put('/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const submission = await findSubmissionById(req.params.id);
      if (!submission) {
        return res.status(404).json({
          status: 'error',
          message: 'Submission not found'
        });
      }

      // Check if user owns the submission or is super user
      if (submission.userId !== req.user.id && req.user.role !== 'super') {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. You can only update your own submissions.'
        });
      }

      // Don't allow changing userId
      const { userId, ...updates } = req.body;

      const updatedSubmission = await updateSubmission(req.params.id, updates);

      res.json({
        status: 'success',
        message: 'Submission updated successfully',
        data: {
          submission: updatedSubmission
        }
      });
    } catch (error) {
      console.error('Update submission error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update submission'
      });
    }
  }
);

/**
 * PATCH /api/tracker/:id/status
 * Update submission status
 * Super users only
 */
router.patch('/:id/status',
  authenticateToken,
  requireSuper,
  body('status').isIn(['pending', 'approved', 'rejected', 'in-review']).withMessage('Invalid status'),

  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { status } = req.body;
      const updatedSubmission = await updateSubmissionStatus(req.params.id, status);

      if (!updatedSubmission) {
        return res.status(404).json({
          status: 'error',
          message: 'Submission not found'
        });
      }

      res.json({
        status: 'success',
        message: 'Status updated successfully',
        data: {
          submission: updatedSubmission
        }
      });
    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update status'
      });
    }
  }
);

/**
 * DELETE /api/tracker/:id
 * Delete submission
 * Owner or super user only
 */
router.delete('/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const submission = await findSubmissionById(req.params.id);
      if (!submission) {
        return res.status(404).json({
          status: 'error',
          message: 'Submission not found'
        });
      }

      // Check if user owns the submission or is super user
      if (submission.userId !== req.user.id && req.user.role !== 'super') {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. You can only delete your own submissions.'
        });
      }

      await deleteSubmission(req.params.id);

      res.json({
        status: 'success',
        message: 'Submission deleted successfully'
      });
    } catch (error) {
      console.error('Delete submission error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete submission'
      });
    }
  }
);

export default router;
