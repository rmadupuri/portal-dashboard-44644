import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

export interface Submission {
  submissionId?: string;
  issueNumber?: string;
  status: string;
  title?: string;
  author?: string;
  createdAt?: string;
  url?: string;
  isExpansionRow?: boolean;
  // Legacy fields for backward compatibility
  id?: string;
  submissionDate?: string;
  submitterName?: string;
  email?: string;
  paper?: string;
  journal?: string;
  notes?: string;
  attachedFiles?: string;
  filePath?: string;
  studyName?: string;
  studyDescription?: string;
  curatedDataLink?: string;
}

// Define status colors with the updated color palette
const statusColors: Record<string, string> = {
  "Submission": "bg-gray-400",
  "Submitted": "bg-gray-400",
  "Awaiting Review": "bg-gray-400",
  "Initial Review": "bg-sky-400",
  "Approved for Portal Curation": "bg-green-600",
  "Curation in Progress": "bg-yellow-500",
  "Clarification Needed": "bg-yellow-500",
  "Changes Requested": "bg-yellow-500",
  "Awaiting Submitter's Response": "bg-yellow-500",
  "Final Review": "bg-orange-500",
  "In Review": "bg-orange-500",
  "Under Review": "bg-orange-500",
  "Preparing for Release": "bg-teal-600",
  "Import in Progress": "bg-teal-600",
  "Released": "bg-green-800",
  "Not Curatable": "bg-red-600",
  "Not Curarable": "bg-red-600",
  "Approved for Portal": "bg-green-600",
  "In Progress": "bg-yellow-500",
  "Received": "bg-gray-400",
  "In Portal": "bg-green-800",
  "Missing Data": "bg-red-600",
  "Pending Review": "bg-sky-400",
};

const statusDescriptions: Record<string, string> = {
  "Submission": "You've suggested the data.",
  "Awaiting Review": "We quickly check if the paper has enough data to move forward.",
  "In Review": "We are working to prepare and organize your data for the portal.",
  "Clarification Needed": "We are working to prepare and organize your data for the portal.",
  "Approved for Portal": "Your data is approved for curation into cBioPortal.",
  "Preparing for Release": "We are getting ready to make your data public.",
  "Import in Progress": "We are getting ready to make your data public.",
  "Released": "Your data is now live on the portal!",
  "Not Curatable": "We reviewed your submission, but unfortunately it doesn't have enough data to move forward at this time.",
  "Not Curarable": "We reviewed your submission, but unfortunately it doesn't have enough data to move forward at this time.",
};

// Helper function to get step number for status
const getStepNumber = (status: string, trackType: 'suggested-papers' | 'submitted-data' = 'suggested-papers') => {
  const suggestedPapersNormalFlow = [
    'Submitted', 'Initial Review', 'Approved for Portal Curation', 'Curation in Progress', 
    'Final Review', 'Preparing for Release', 'Released'
  ];
  
  const submittedDataNormalFlow = [
    'Submitted', 'In Review', 'Approved for Portal', 'Preparing for Release', 'Released'
  ];

  const suggestedPapersRejectedFlow = ['Submitted', 'Initial Review', 'Not Curatable'];
  const submittedDataRejectedFlow = ['Submitted', 'In Review', 'Not Curatable'];

  // Map certain statuses to appropriate progress steps
  const getMappedStatus = (status: string): string => {
    if (status === 'Awaiting Review') return 'Submitted';
    if (['Clarification Needed', 'Changes Requested', 'Awaiting Submitters Response', 'Curation in Progress'].includes(status)) {
      return 'Curation in Progress';
    }
    if (status === 'Import in Progress') return 'Preparing for Release';
    if (status === 'Submission') return 'Submitted';
    if (status === 'Under Review') return trackType === 'suggested-papers' ? 'Final Review' : 'In Review';
    if (status === 'Approved for Portal') {
      return trackType === 'suggested-papers' ? 'Approved for Portal Curation' : 'Approved for Portal';
    }
    return status;
  };

  const isRejected = status === 'Not Curatable' || status === 'Not Curarable';
  
  // Determine which flow to use and get the appropriate total steps
  let flowSteps: string[];
  if (isRejected) {
    flowSteps = trackType === 'suggested-papers' ? suggestedPapersRejectedFlow : submittedDataRejectedFlow;
    const stepIndex = flowSteps.indexOf('Not Curatable');
    return stepIndex >= 0 ? `${stepIndex + 1}/${flowSteps.length}` : '';
  } else {
    flowSteps = trackType === 'suggested-papers' ? suggestedPapersNormalFlow : submittedDataNormalFlow;
    const mappedStatus = getMappedStatus(status);
    const stepIndex = flowSteps.indexOf(mappedStatus);
    return stepIndex >= 0 ? `${stepIndex + 1}/${flowSteps.length}` : '';
  }
};

export const getStatusCellRenderer = (params: any) => {
  const colorClass = statusColors[params.value] || "bg-gray-500";
  const description = statusDescriptions[params.value];
  // Ensure we're getting the trackType from the correct source
  const trackType = params.context?.trackType || params.data?.trackType || 'suggested-papers';
  const stepNumber = getStepNumber(params.value, trackType);
  
  const statusPill = React.createElement('div', {
    className: 'w-full flex justify-start items-center h-full pl-3'
  }, React.createElement('div', {
    className: `text-center rounded-full px-[15px] py-2.5 text-sm font-semibold text-white inline-block cursor-help ${colorClass} flex items-center gap-2 whitespace-nowrap`
  }, [
    stepNumber && React.createElement('span', {
      key: 'step',
      className: 'text-xs bg-white bg-opacity-20 rounded-full px-2 py-0.5 font-bold'
    }, stepNumber),
    React.createElement('span', {
      key: 'status'
    }, params.value)
  ]));

  if (description) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {statusPill}
          </TooltipTrigger>
          <TooltipContent>
            <p>{description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return statusPill;
};
