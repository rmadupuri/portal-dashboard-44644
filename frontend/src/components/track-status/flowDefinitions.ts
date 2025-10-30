
export const suggestedPapersNormalFlow = [
  'Submitted',
  'Initial Review',
  'Approved for Portal Curation',
  'Curation in Progress',
  'Final Review',
  'Preparing for Release',
  'Released'
];

export const suggestedPapersRejectedFlow = [
  'Submitted',
  'Initial Review',
  'Rejected'
];

export const submittedDataNormalFlow = [
  'Submitted',
  'In Review',
  'Approved for Portal',
  'Preparing for Release',
  'Released'
];

export const submittedDataRejectedFlow = [
  'Submitted',
  'In Review',
  'Rejected'
];

export const stepDescriptions: Record<string, string> = {
  'Submitted': "You've suggested the data.",
  'Initial Review': 'We quickly check if the paper has enough data to move forward.',
  'In Review': 'We are reviewing your submitted data.',
  'Approved for Portal Curation': 'Your data is approved for curation into cBioPortal.',
  'Approved for Portal': 'Your data is approved for the portal.',
  'Curation in Progress': 'We are working to prepare and organize your data for the portal.',
  'Final Review': 'We do a final check to ensure everything is accurate.',
  'Preparing for Release': 'We are getting ready to make your data public.',
  'Released': 'Your data is now live on the portal!',
  'Rejected': "We reviewed your submission, but unfortunately it doesn't have enough data to move forward at this time."
};

export const getMappedStatus = (status: string, trackType: 'suggested-papers' | 'submitted-data' = 'suggested-papers'): string => {
  // Map "Awaiting Review" to "Submitted"
  if (status === 'Awaiting Review') {
    return 'Submitted';
  }
  
  // Map curation-related statuses to "Curation in Progress"
  const curationStatuses = ['Clarification Needed', 'Changes Requested', 'Awaiting Submitters Response', 'Curation in Progress'];
  if (curationStatuses.includes(status)) {
    return 'Curation in Progress';
  }
  
  const preparingStatuses = ['Import in Progress'];
  if (preparingStatuses.includes(status)) {
    return 'Preparing for Release';
  }
  
  // Map "Submission" to "Submitted" for consistency
  if (status === 'Submission') {
    return 'Submitted';
  }
  
  // Map "Under Review" to appropriate review step
  if (status === 'Under Review') {
    return trackType === 'suggested-papers' ? 'Final Review' : 'In Review';
  }
  
  // Map "Approved for Portal" variations
  if (status === 'Approved for Portal') {
    return trackType === 'suggested-papers' ? 'Approved for Portal Curation' : 'Approved for Portal';
  }
  
  return status;
};
