import { submissionsDb } from './index.js';
import { v4 as uuidv4 } from 'uuid';

export async function createSubmission(submissionData) {
  const submissionId = `submission_${uuidv4()}`;
  const submission = {
    id: submissionId,
    userId: submissionData.userId,
    studyId: submissionData.studyId,
    cancerType: submissionData.cancerType,
    status: submissionData.status || 'pending',
    submissionDate: submissionData.submissionDate || new Date().toISOString(),
    contactName: submissionData.contactName || '',
    contactEmail: submissionData.contactEmail || '',
    institutionName: submissionData.institutionName || '',
    dataType: submissionData.dataType || '',
    sampleCount: submissionData.sampleCount || 0,
    validationNotes: submissionData.validationNotes || '',
    fileUrl: submissionData.fileUrl || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await submissionsDb.put(submissionId, submission);
  return submission;
}

export async function findSubmissionById(submissionId) {
  try {
    const submission = await submissionsDb.get(submissionId);
    return { ...submission, id: submissionId };
  } catch (error) {
    if (error.code === 'LEVEL_NOT_FOUND') return null;
    throw error;
  }
}

export async function getAllSubmissions(options = {}) {
  const submissions = [];
  for await (const [key, submission] of submissionsDb.iterator()) {
    let include = true;
    if (options.userId && submission.userId !== options.userId) include = false;
    if (options.status && submission.status !== options.status) include = false;
    if (options.cancerType && submission.cancerType !== options.cancerType) include = false;
    if (include) submissions.push({ ...submission, id: key });
  }
  submissions.sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate));
  if (options.limit) {
    const start = options.offset || 0;
    return submissions.slice(start, start + options.limit);
  }
  return submissions;
}

export async function getSubmissionsByUserId(userId) {
  return getAllSubmissions({ userId });
}

export async function updateSubmission(submissionId, updates) {
  const submission = await findSubmissionById(submissionId);
  if (!submission) throw new Error('Submission not found');
  const updatedSubmission = {
    ...submission,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  delete updatedSubmission.id;
  delete updatedSubmission.createdAt;
  await submissionsDb.put(submissionId, updatedSubmission);
  return updatedSubmission;
}

export async function deleteSubmission(submissionId) {
  await submissionsDb.del(submissionId);
}

export default {
  createSubmission,
  findSubmissionById,
  getAllSubmissions,
  getSubmissionsByUserId,
  updateSubmission,
  deleteSubmission,
};
