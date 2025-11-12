/**
 * Submission Database Operations
 * 
 * CRUD operations for data submissions with LevelDB
 */

import { submissionsDb } from './index.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new submission
 * @param {Object} submissionData - Submission data
 * @returns {Promise<Object>} Created submission
 */
export async function createSubmission(submissionData) {
  const submissionId = `submission_${uuidv4()}`;
  
  const submission = {
    id: submissionId,
    userId: submissionData.userId,
    
    // Public fields (visible to all users)
    studyId: submissionData.studyId,
    cancerType: submissionData.cancerType,
    status: submissionData.status || 'pending',
    submissionDate: submissionData.submissionDate || new Date().toISOString(),
    
    // Restricted fields (visible only to super users)
    contactName: submissionData.contactName || '',
    contactEmail: submissionData.contactEmail || '',
    institutionName: submissionData.institutionName || '',
    dataType: submissionData.dataType || '',
    sampleCount: submissionData.sampleCount || 0,
    validationNotes: submissionData.validationNotes || '',
    fileUrl: submissionData.fileUrl || '',
    
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await submissionsDb.put(submissionId, submission);
  return submission;
}

/**
 * Find submission by ID
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Object|null>} Submission object or null
 */
export async function findSubmissionById(submissionId) {
  try {
    const submission = await submissionsDb.get(submissionId);
    return { ...submission, id: submissionId };
  } catch (error) {
    if (error.code === 'LEVEL_NOT_FOUND') {
      return null;
    }
    throw error;
  }
}

/**
 * Get all submissions
 * @param {Object} options - Query options (filters, pagination)
 * @returns {Promise<Array>} Array of submissions
 */
export async function getAllSubmissions(options = {}) {
  const submissions = [];
  
  for await (const [key, submission] of submissionsDb.iterator()) {
    let include = true;
    
    // Filter by userId if provided
    if (options.userId && submission.userId !== options.userId) {
      include = false;
    }
    
    // Filter by status if provided
    if (options.status && submission.status !== options.status) {
      include = false;
    }
    
    // Filter by cancerType if provided
    if (options.cancerType && submission.cancerType !== options.cancerType) {
      include = false;
    }
    
    if (include) {
      submissions.push({ ...submission, id: key });
    }
  }
  
  // Sort by submission date (newest first)
  submissions.sort((a, b) => 
    new Date(b.submissionDate) - new Date(a.submissionDate)
  );
  
  // Apply pagination if provided
  if (options.limit) {
    const start = options.offset || 0;
    return submissions.slice(start, start + options.limit);
  }
  
  return submissions;
}

/**
 * Get submissions by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of user's submissions
 */
export async function getSubmissionsByUserId(userId) {
  return getAllSubmissions({ userId });
}

/**
 * Update submission
 * @param {string} submissionId - Submission ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated submission
 */
export async function updateSubmission(submissionId, updates) {
  const submission = await findSubmissionById(submissionId);
  if (!submission) {
    throw new Error('Submission not found');
  }

  const updatedSubmission = {
    ...submission,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  // Don't allow updating certain fields
  delete updatedSubmission.id;
  delete updatedSubmission.createdAt;

  await submissionsDb.put(submissionId, updatedSubmission);
  return updatedSubmission;
}

/**
 * Delete submission
 * @param {string} submissionId - Submission ID
 */
export async function deleteSubmission(submissionId) {
  await submissionsDb.del(submissionId);
}

/**
 * Update submission status
 * @param {string} submissionId - Submission ID
 * @param {string} status - New status
 */
export async function updateSubmissionStatus(submissionId, status) {
  const validStatuses = ['pending', 'approved', 'rejected', 'in-review'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }
  return updateSubmission(submissionId, { status });
}

/**
 * Get submission statistics
 * @returns {Promise<Object>} Statistics object
 */
export async function getSubmissionStats() {
  const submissions = await getAllSubmissions();
  
  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
    inReview: submissions.filter(s => s.status === 'in-review').length,
    byCancerType: {}
  };
  
  // Count by cancer type
  submissions.forEach(sub => {
    if (sub.cancerType) {
      stats.byCancerType[sub.cancerType] = 
        (stats.byCancerType[sub.cancerType] || 0) + 1;
    }
  });
  
  return stats;
}

export default {
  createSubmission,
  findSubmissionById,
  getAllSubmissions,
  getSubmissionsByUserId,
  updateSubmission,
  deleteSubmission,
  updateSubmissionStatus,
  getSubmissionStats
};
