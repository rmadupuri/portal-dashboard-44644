/**
 * Data Filtering Utilities
 * 
 * Filter submission data based on user role
 */

/**
 * Public fields that all users can see
 */
const PUBLIC_FIELDS = [
  'id',
  'studyId',
  'cancerType',
  'status',
  'submissionDate',
  'createdAt',
  'updatedAt'
];

/**
 * Restricted fields that only super users can see
 */
const RESTRICTED_FIELDS = [
  'userId',
  'contactName',
  'contactEmail',
  'institutionName',
  'dataType',
  'sampleCount',
  'validationNotes',
  'fileUrl'
];

/**
 * Filter submission data based on user role
 * @param {Object} submission - Submission object
 * @param {string} userRole - User role ('user' or 'super')
 * @returns {Object} Filtered submission
 */
export function filterSubmissionByRole(submission, userRole) {
  if (userRole === 'super') {
    // Super users see everything
    return submission;
  }
  
  // Common users only see public fields
  const filtered = {};
  PUBLIC_FIELDS.forEach(field => {
    if (submission[field] !== undefined) {
      filtered[field] = submission[field];
    }
  });
  
  return filtered;
}

/**
 * Filter array of submissions based on user role
 * @param {Array} submissions - Array of submissions
 * @param {string} userRole - User role ('user' or 'super')
 * @returns {Array} Filtered submissions
 */
export function filterSubmissionsByRole(submissions, userRole) {
  return submissions.map(submission => 
    filterSubmissionByRole(submission, userRole)
  );
}

/**
 * Check if user can access specific fields
 * @param {string} userRole - User role
 * @param {Array} fields - Fields to check
 * @returns {boolean} True if user can access all fields
 */
export function canAccessFields(userRole, fields) {
  if (userRole === 'super') {
    return true;
  }
  
  // Check if any requested fields are restricted
  const hasRestrictedFields = fields.some(field => 
    RESTRICTED_FIELDS.includes(field)
  );
  
  return !hasRestrictedFields;
}

/**
 * Get list of fields user can access
 * @param {string} userRole - User role
 * @returns {Array} Array of accessible field names
 */
export function getAccessibleFields(userRole) {
  if (userRole === 'super') {
    return [...PUBLIC_FIELDS, ...RESTRICTED_FIELDS];
  }
  return PUBLIC_FIELDS;
}

export default {
  filterSubmissionByRole,
  filterSubmissionsByRole,
  canAccessFields,
  getAccessibleFields,
  PUBLIC_FIELDS,
  RESTRICTED_FIELDS
};
