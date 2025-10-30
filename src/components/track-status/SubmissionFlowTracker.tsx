
import React from 'react';
import { Check, Clock, AlertCircle, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { 
  suggestedPapersNormalFlow, 
  suggestedPapersRejectedFlow, 
  submittedDataNormalFlow, 
  submittedDataRejectedFlow,
  stepDescriptions,
  getMappedStatus
} from './flowDefinitions';

interface SubmissionFlowTrackerProps {
  currentStatus: string;
  trackType?: 'suggested-papers' | 'submitted-data';
}

export const SubmissionFlowTracker = ({ currentStatus, trackType = 'suggested-papers' }: SubmissionFlowTrackerProps) => {
  // Determine which flow to use
  const isNotCuratable = currentStatus === 'Not Curatable' || currentStatus === 'Not Curarable';
  
  let flowSteps: string[];
  if (trackType === 'suggested-papers') {
    flowSteps = isNotCuratable ? suggestedPapersRejectedFlow : suggestedPapersNormalFlow;
  } else {
    flowSteps = isNotCuratable ? submittedDataRejectedFlow : submittedDataNormalFlow;
  }
  
  const mappedStatus = isNotCuratable ? 'Rejected' : getMappedStatus(currentStatus, trackType);
  const currentStepIndex = flowSteps.indexOf(mappedStatus);
  
  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'pending';
  };

  const getStepIcon = (stepIndex: number, status: string, step: string) => {
    if (status === 'completed') {
      return <Check className="h-4 w-4 text-white" />;
    }
    if (status === 'current') {
      if (step === 'Rejected') {
        return <X className="h-4 w-4 text-white" />;
      }
      // Show green check mark for Released status instead of blue timer
      if (step === 'Released') {
        return <Check className="h-4 w-4 text-white" />;
      }
      return <Clock className="h-4 w-4 text-white" />;
    }
    // Return empty div for pending steps instead of step number
    return <div className="w-4 h-4" />;
  };

  const getStepColor = (status: string, step: string) => {
    if (status === 'completed') return 'bg-green-500';
    if (status === 'current') {
      if (step === 'Rejected') return 'bg-red-500';
      // Show green background for Released status
      if (step === 'Released') return 'bg-green-500';
      return 'bg-blue-500';
    }
    return 'bg-gray-300';
  };

  const getTooltipProps = (index: number, totalSteps: number) => {
    if (index === 0) return { side: 'top' as const, align: 'start' as const };
    if (index === totalSteps - 1) return { side: 'top' as const, align: 'end' as const };
    return { side: 'top' as const, align: 'center' as const };
  };

  // Function to split text into lines if too long and include step number in the text
  const formatStepLabel = (step: string, stepIndex: number) => {
    const stepNumber = stepIndex + 1;
    const labelText = `${stepNumber}. ${step}`;
    const words = labelText.split(' ');
    
    if (words.length > 3) {
      const midPoint = Math.ceil(words.length / 2);
      const firstLine = words.slice(0, midPoint).join(' ');
      const secondLine = words.slice(midPoint).join(' ');
      return (
        <>
          <div>{firstLine}</div>
          <div>{secondLine}</div>
        </>
      );
    }
    return <div>{labelText}</div>;
  };

  return (
    <TooltipProvider>
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Submission Progress</h3>
        
        <div className="relative">
          {/* Progress line */}
          <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200">
            <div 
              className={`h-full transition-all duration-500 ${
                isNotCuratable && currentStepIndex >= 0 ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ 
                width: currentStepIndex >= 0 ? `${(currentStepIndex / (flowSteps.length - 1)) * 100}%` : '0%' 
              }}
            />
          </div>

          {/* Steps */}
          <div className="relative flex justify-between">
            {flowSteps.map((step, index) => {
              const status = getStepStatus(index);
              const tooltipProps = getTooltipProps(index, flowSteps.length);
              
              return (
                <div key={step} className="flex flex-col items-center">
                  {/* Step circle with tooltip */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className={`
                          relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shadow-md transition-all duration-300 cursor-help
                          ${getStepColor(status, step)}
                        `}
                      >
                        {getStepIcon(index, status, step)}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent 
                      side={tooltipProps.side}
                      align={tooltipProps.align}
                      className="max-w-[280px] text-center z-50"
                    >
                      <div className="whitespace-normal break-words leading-relaxed">
                        {stepDescriptions[step]}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                  
                  {/* Step label - centered and responsive with line breaks and step numbers included in text */}
                  <div className="mt-3 text-center max-w-[120px] px-1">
                    <div className={`text-sm font-medium leading-tight text-center ${
                      status === 'current' ? (
                        step === 'Rejected' ? 'text-red-600' : 
                        step === 'Released' ? 'text-green-600' : 'text-blue-600'
                      ) : 
                      status === 'completed' ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {formatStepLabel(step, index)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
