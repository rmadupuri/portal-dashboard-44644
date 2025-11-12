/**
 * Tracker Routes
 * 
 * Handles submission tracking with role-based access control
 * - Common users see limited columns
 * - Super users see all columns
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
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
 * Requires authentication
 */
router.post('/',
  authenticateToken,
  body('studyId').trim().notEmpty().withMessage('Study ID is required'),
  body('cancerType').trim().notEmpty().withMessage('Cancer type is required'),
  body('contactName').trim().notEmpty().withMessage('Contact name is required'),
  body('contactEmail').isEmail().normalizeEmail().withMessage('Valid contact email is required'),
  body('institutionName').trim().notEmpty().withMessage('Institution name is required'),
  body('dataType').trim().notEmpty().withMessage('Data type is required'),
  body('sampleCount').optional().isInt({ min: 0 }).withMessage('Sample count must be a positive number'),
  
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
      
      const submissionData = {
        ...req.body,
        userId: req.user.id
      };
      
      const submission = await createSubmission(submissionData);
      
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
