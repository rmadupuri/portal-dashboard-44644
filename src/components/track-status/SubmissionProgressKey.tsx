
import React from 'react';
import { Check, Clock, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { suggestedPapersNormalFlow, submittedDataNormalFlow, stepDescriptions } from './flowDefinitions';

interface SubmissionProgressKeyProps {
  trackType: 'suggested-papers' | 'submitted-data';
}

export const SubmissionProgressKey = ({ trackType }: SubmissionProgressKeyProps) => {
  const flowSteps = trackType === 'suggested-papers' ? suggestedPapersNormalFlow : submittedDataNormalFlow;

  return (
    <TooltipProvider>
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Submission Progress Key</h3>
        
        {/* Flow Steps */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4">
          {flowSteps.map((step, index) => (
            <div key={step} className="flex items-center gap-2 flex-shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-help">
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">{index + 1}</span>
                    </div>
                    <span className="text-sm text-gray-700 whitespace-nowrap">{step}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{stepDescriptions[step]}</p>
                </TooltipContent>
              </Tooltip>
              {index < flowSteps.length - 1 && (
                <div className="w-4 h-0.5 bg-gray-300 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="h-2 w-2 text-white" />
            </div>
            <span className="text-gray-600">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center">
              <Clock className="h-2 w-2 text-white" />
            </div>
            <span className="text-gray-600">Current</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gray-300" />
            <span className="text-gray-600">Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500 flex items-center justify-center">
              <X className="h-2 w-2 text-white" />
            </div>
            <span className="text-gray-600">Rejected</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
