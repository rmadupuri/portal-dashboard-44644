import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import SharedLayout from "@/components/SharedLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileText, Upload, Info, ArrowRight, ExternalLink, CheckCircle } from "lucide-react";
import { submitPaperSuggestion, submitCuratedData } from "@/services/api";
import { Submission } from "@/types/submission";

type PublicationType = "published" | "preprint";
type ActionType = "suggest-paper" | "submit-data";
type SharingPreference = "public" | "private";

type CommonFormValues = {
  name: string;
  email: string;
  wantsNotification: string;
  canContactEmail: boolean | null;
  alternativeEmail: string;
  notes: string;
  dataTypes: string[];
  otherDataType: string;
};

type PaperFormValues = CommonFormValues & {
  paperTitle: string;
  pmid: string;
  journal: string;
  isLeadAuthor: boolean | null;
  wantsToHelpCurate: string;
};

type DataFormValues = CommonFormValues & {
  studyName: string;
  description: string;
  associatedPaper: string;
  linkToData: string;
  isDataTransformed: boolean | null;
  referenceGenome: string;
};

type FormValues = PaperFormValues & DataFormValues & {
  publicationType: PublicationType;
  actionType: ActionType;
  sharingPreference: SharingPreference;
  privateAccessEmails?: string;
};

const SubmitContent = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publicationType, setPublicationType] = useState<PublicationType | null>(null);
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  
  const form = useForm<FormValues>({
    defaultValues: {
      publicationType: "published",
      actionType: "suggest-paper",
      sharingPreference: "public",
      name: "",
      email: "",
      wantsNotification: "",
      canContactEmail: null,
      alternativeEmail: "",
      paperTitle: "",
      pmid: "",
      journal: "",
      isLeadAuthor: null,
      wantsToHelpCurate: "",
      studyName: "",
      description: "",
      associatedPaper: "",
      linkToData: "",
      isDataTransformed: null,
      referenceGenome: "",
      notes: "",
      dataTypes: [],
      otherDataType: "",
      privateAccessEmails: "",
    },
  });
  
  const canContactEmail = form.watch("canContactEmail");
  const isDataTransformed = form.watch("isDataTransformed");
  const dataTypes = form.watch("dataTypes");
  const isOtherSelected = dataTypes?.includes("Other (please specify)");
  const isLeadAuthor = form.watch("isLeadAuthor");
  const wantsToHelpCurate = form.watch("wantsToHelpCurate");
  const sharingPreference = form.watch("sharingPreference");
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleDataTypeChange = (dataType: string, checked: boolean) => {
    const currentDataTypes = form.getValues("dataTypes") || [];
    if (checked) {
      form.setValue("dataTypes", [...currentDataTypes, dataType]);
    } else {
      form.setValue("dataTypes", currentDataTypes.filter(type => type !== dataType));
      if (dataType === "Other (please specify)") {
        form.setValue("otherDataType", "");
      }
    }
  };

  const onSubmit = async (data: FormValues) => {
    // Validate alternative email if contact permission is No (for both paper and data forms)
    if (data.canContactEmail === false && !data.alternativeEmail.trim()) {
      toast.error("Please provide an alternative contact email");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Set success message based on action type
      if (data.actionType === "suggest-paper") {
        setSuccessMessage("Your paper suggestion has been submitted successfully!");
      } else {
        setSuccessMessage("Your data has been submitted successfully!");
      }
      
      // Show success modal
      setShowSuccessModal(true);
      
      // Reset form
      form.reset();
      setFiles([]);
      setPublicationType(null);
      setActionType(null);
      
      // Redirect to track status page with appropriate tab after showing modal
      setTimeout(() => {
        setShowSuccessModal(false);
        if (data.actionType === "suggest-paper") {
          navigate("/track-status?tab=suggested-papers");
        } else {
          navigate("/track-status?tab=submitted-data");
        }
      }, 3000);
      
    } catch (error) {
      // Show error message
      toast.error("Failed to submit");
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update the publication type when radio selection changes
  const handlePublicationTypeChange = (value: PublicationType) => {
    setPublicationType(value);
    form.setValue("publicationType", value);
  };

  // Update the action type when radio selection changes
  const handleActionTypeChange = (value: ActionType) => {
    setActionType(value);
    form.setValue("actionType", value);
  };

  // Check if submit should be disabled
  const isSubmitDisabled = isSubmitting || (actionType === "submit-data" && isDataTransformed !== true);

  // Data types for both forms
  const paperDataTypes = [
    "Clinical",
    "Mutation Data (SNVs/Indels)",
    "Copy Number Alterations (Discrete or Segmented)",
    "Gene Expression (mRNA)",
    "Protein Expression (RPPA, Mass Spec)",
    "Fusion / Structural Variants",
    "Methylation Data",
    "Survival / Outcome Data",
    "Immune Profiling (Neoantigens, Immune Cell Infiltration)",
    "Imaging / Pathology Data",
    "Single-cell Data (scRNA-seq, spatial)",
    "Other (please specify)"
  ];

  const dataFormDataTypes = [
    "Clinical",
    "Mutation Data (SNVs/Indels)",
    "Copy Number Alterations (Discrete or Segmented)",
    "Gene Expression (mRNA)",
    "Protein Expression (RPPA, Mass Spec)",
    "Fusion / Structural Variants",
    "Methylation Data",
    "Survival / Outcome Data",
    "Immune Profiling (Neoantigens, Immune Cell Infiltration)",
    "Imaging / Pathology Data",
    "Single-cell Data (scRNA-seq, spatial)",
    "Other (please specify)"
  ];

  return (
    <SharedLayout>
      <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white py-12">
        <div className="mx-auto w-full max-w-4xl px-6">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center p-2 mb-4 bg-blue-100 rounded-full">
              {actionType === "suggest-paper" ? (
                <FileText className="h-8 w-8 text-blue-600" />
              ) : (
                <Upload className="h-8 w-8 text-blue-600" />
              )}
            </div>
            <h1 className="text-3xl font-bold mb-3 text-gray-800">Submit to cBioPortal</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Contribute to cBioPortal by suggesting datasets and submitting data, published or pre-print.
            </p>
          </div>

          {/* Merged Single Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-6 md:p-8">
              {/* Publication Type Selection */}
              <h2 className="text-xl font-semibold mb-6 text-gray-800">What type of study are you submitting?</h2>
              <RadioGroup
                value={publicationType || ""}
                onValueChange={handlePublicationTypeChange}
                className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 mb-8"
              >
                <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  publicationType === "published" 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}>
                  <RadioGroupItem value="published" id="published" className="h-5 w-5" />
                  <Label htmlFor="published" className="font-medium text-lg cursor-pointer text-gray-700 flex-1">
                    Published Paper
                  </Label>
                </div>
                <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  publicationType === "preprint" 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}>
                  <RadioGroupItem value="preprint" id="preprint" className="h-5 w-5" />
                  <Label htmlFor="preprint" className="font-medium text-lg cursor-pointer text-gray-700 flex-1">
                    Pre-publication
                  </Label>
                </div>
              </RadioGroup>
              
              {/* Show form only if publication type is selected */}
              {publicationType && (
                <>
                  {/* Divider */}
                  <div className="border-t border-gray-200 mb-6"></div>

                  {/* Main Form */}
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                     {/* Pre-print specific sharing preference question */}
                      {publicationType === "preprint" && (
                        <FormField
                          control={form.control}
                          name="sharingPreference"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 font-medium">
                                How would you like to share your pre-print data on cBioPortal?
                              </FormLabel>
                              <RadioGroup
                                value={field.value}
                                onValueChange={field.onChange}
                                className="space-y-1 mt-4" // updated spacing
                              >
                                <div className="flex items-start space-x-3">
                                  <RadioGroupItem value="public" id="public" />
                                  <Label htmlFor="public" className="text-gray-600 cursor-pointer font-normal leading-snug">
                                    Make it publicly available
                                  </Label>
                                </div>
                                <div className="flex items-start space-x-3">
                                  <RadioGroupItem value="private" id="private" />
                                  <Label htmlFor="private" className="text-gray-600 cursor-pointer font-normal leading-snug">
                                    Keep it private for now (review in private cBioPortal)
                                  </Label>
                                </div>
                              </RadioGroup>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {sharingPreference === "private" && (
                      <FormField
                        control={form.control}
                        name="privateAccessEmails"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel className="text-gray-600 font-normal">
                              Emails of team members (Google-authenticated) who need access:
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="Enter email addresses separated by commas"
                                className="shadow-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                      {/* Question about recommending paper or submitting data */}
                      {publicationType === "published" && (
                        <>
                          <div>
                            <FormLabel className="text-gray-700 font-medium mb-4 block">
                              Would you like to recommend a paper for inclusion in cBioPortal or submit your data?
                            </FormLabel>
                            <RadioGroup
                              value={actionType || ""}
                              onValueChange={handleActionTypeChange}
                              className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-6"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="suggest-paper" id="suggest-paper" />
                                <Label htmlFor="suggest-paper" className="text-gray-600 cursor-pointer font-normal">
                                  Suggest Paper
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="submit-data" id="submit-data" />
                                <Label htmlFor="submit-data" className="text-gray-600 cursor-pointer font-normal">
                                  Submit Data
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>

                          {/* Show specific form fields based on action type */}
                          {actionType === "suggest-paper" && (
                            <>
                              {/* Paper-specific fields */}
                              {/* PMID or Link to the Paper */}
                              <FormField
                                control={form.control}
                                name="pmid"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-gray-700">
                                      PMID or Link to the Paper <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="PMID or URL"
                                        className="shadow-sm"
                                        required={actionType === "suggest-paper"}
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {/* Paper Title */}
                              <FormField
                                control={form.control}
                                name="paperTitle"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-gray-700">Paper Title</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Enter the full title of the paper"
                                        className="shadow-sm"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {/* Journal */}
                              <FormField
                                control={form.control}
                                name="journal"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-gray-700">Journal</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Journal name"
                                        className="shadow-sm"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {/* Data Types Available for Paper Form */}
                              <div>
                                <div className="flex items-center mb-3">
                                  <FormLabel className="text-gray-700">Available Data Types</FormLabel>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="w-4 h-4 text-gray-500 ml-2 cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-sm">
                                          What data does the submission contain?
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                  {paperDataTypes.map((dataType) => (
                                    <div key={dataType} className="flex items-start space-x-2">
                                      <Checkbox
                                        id={`data-type-${dataType.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                                        checked={dataTypes?.includes(dataType) || false}
                                        onCheckedChange={(checked) => handleDataTypeChange(dataType, checked as boolean)}
                                        className="mt-1"
                                      />
                                      <Label htmlFor={`data-type-${dataType.toLowerCase().replace(/[^a-z0-9]/g, '-')}`} className="text-gray-600 cursor-pointer text-sm font-normal leading-tight">
                                        {dataType}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                                {isOtherSelected && (
                                  <div className="mt-4">
                                    <FormField
                                      control={form.control}
                                      name="otherDataType"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormControl>
                                            <Input
                                              placeholder="Please specify other data type"
                                              className="shadow-sm"
                                              {...field}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                )}
                              </div>

                              {/* File Upload Section for Paper Form */}
                              <div>
                                <div className="flex items-center mb-2">
                                  <FormLabel className="text-gray-700">
                                    Upload any supporting data files
                                  </FormLabel>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="w-4 h-4 text-gray-500 ml-2 cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-sm italic">
                                          Attach any additional data files not included in the publication that may aid in curation.
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6">
                                  <div className="flex flex-col items-center justify-center text-center">
                                    <Upload className="w-8 h-8 mb-2 text-gray-400" />
                                    <input
                                      id="file-upload-paper"
                                      name="file-upload"
                                      type="file"
                                      className="sr-only"
                                      multiple
                                      onChange={handleFileChange}
                                    />
                                    <label
                                      htmlFor="file-upload-paper"
                                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md cursor-pointer hover:bg-blue-50"
                                    >
                                      Select Files
                                    </label>
                                  </div>
                                  {files.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                      {files.map((file, index) => (
                                        <div key={index} className="flex items-center mb-1 last:mb-0">
                                          <FileText className="h-4 w-4 text-blue-600 mr-2" />
                                          <span className="text-sm text-gray-700 font-medium">{file.name}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Researcher question - moved here after file upload */}
                              <FormField
                                control={form.control}
                                name="isLeadAuthor"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-gray-700">
                                      Are you one of the researchers behind this study?
                                    </FormLabel>
                                    <div className="flex space-x-6">
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id="lead-author-yes"
                                          checked={field.value === true}
                                          onCheckedChange={() => field.onChange(true)}
                                        />
                                        <Label htmlFor="lead-author-yes" className="text-gray-600 cursor-pointer text-sm font-normal leading-tight">
                                          Yes
                                        </Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id="lead-author-no"
                                          checked={field.value === false}
                                          onCheckedChange={() => field.onChange(false)}
                                        />
                                        <Label htmlFor="lead-author-no" className="text-gray-600 cursor-pointer text-sm font-normal leading-tight">
                                          No
                                        </Label>
                                      </div>
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {/* Contact Permission Question - only show if user is a researcher */}
                              {isLeadAuthor === true && (
                                <div className="space-y-4">
                                  <FormField
                                    control={form.control}
                                    name="canContactEmail"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-gray-700">
                                          May we contact you at the provided email address for any further inquiries?
                                        </FormLabel>
                                        <div className="flex space-x-6">
                                          <div className="flex items-center space-x-2">
                                            <Checkbox
                                              id="contact-paper-yes"
                                              checked={field.value === true}
                                              onCheckedChange={() => field.onChange(true)}
                                            />
                                            <Label htmlFor="contact-paper-yes" className="text-gray-600 cursor-pointer text-sm font-normal leading-tight">
                                              Yes
                                            </Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <Checkbox
                                              id="contact-paper-no"
                                              checked={field.value === false}
                                              onCheckedChange={() => field.onChange(false)}
                                            />
                                            <Label htmlFor="contact-paper-no" className="text-gray-600 cursor-pointer text-sm font-normal leading-tight">
                                              No
                                            </Label>
                                          </div>
                                        </div>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              )}

                              {/* Would you like to help with curation? */}
                              <FormField
                                control={form.control}
                                name="wantsToHelpCurate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-gray-700">
                                      Would you like to help prepare the data for cBioPortal?
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger className="shadow-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                                          <SelectValue placeholder="Select an option" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="bg-white border border-gray-300">
                                        <SelectItem value="yes">Yes</SelectItem>
                                        <SelectItem value="no">No</SelectItem>
                                        <SelectItem value="maybe">Maybe</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    {(wantsToHelpCurate === "yes" || wantsToHelpCurate === "maybe") && (
                                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
                                        <div className="flex items-start">
                                          <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                                          <div className="text-sm text-blue-800">
                                            <p className="font-medium mb-1">Great! Here's how to get started:</p>
                                            <p>
                                              Review the{" "}
                                              <a 
                                                href="https://docs.cbioportal.org/file-formats/" 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-blue-700 hover:text-blue-900 underline font-medium inline-flex items-center"
                                              >
                                                cBioPortal File Format Guidelines
                                              </a>
                                              {" "}to understand the required data formats and structure.
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </>
                          )}

                          {actionType === "submit-data" && (
                            <>
                              <FormField
                                control={form.control}
                                name="studyName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-gray-700">Study Name</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Dataset name"
                                        className="shadow-sm"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-gray-700">Study Description</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        rows={4}
                                        placeholder="Brief description of the study"
                                        className="shadow-sm resize-none"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                               <FormField
                                control={form.control}
                                name="associatedPaper"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-gray-700">Associated Paper</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="PMID or URL, if the paper is published"
                                        className="shadow-sm"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {/* Data Transformation Question */}
                              <FormField
                                control={form.control}
                                name="isDataTransformed"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-gray-700">
                                      Is the data transformed according to cBioPortal file formats?{" "}
                                      <a 
                                        href="https://docs.cbioportal.org/file-formats/" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                                      >
                                        View file formats
                                        <ExternalLink className="ml-1 h-3 w-3" />
                                      </a>
                                    </FormLabel>
                                    <div className="flex space-x-6">
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id="transformed-yes"
                                          checked={field.value === true}
                                          onCheckedChange={() => field.onChange(true)}
                                        />
                                        <Label htmlFor="transformed-yes" className="text-gray-600 cursor-pointer text-sm font-normal leading-tight">
                                          Yes
                                        </Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id="transformed-no"
                                          checked={field.value === false}
                                          onCheckedChange={() => field.onChange(false)}
                                        />
                                        <Label htmlFor="transformed-no" className="text-gray-600 cursor-pointer text-sm font-normal leading-tight">
                                          No
                                        </Label>
                                      </div>
                                    </div>
                                    {isDataTransformed === false && (
                                      <p className="text-sm text-red-600 mt-2">
                                        Please format your data according to cBioPortal file formats before submitting.
                                      </p>
                                    )}
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              {/* Data Types Available for Data Form */}
                              <div>
                                <div className="flex items-center mb-3">
                                  <FormLabel className="text-gray-700">Available Data Types</FormLabel>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="w-4 h-4 text-gray-500 ml-2 cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-sm">
                                          What data does the submission contain?
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                  {dataFormDataTypes.map((dataType) => (
                                    <div key={dataType} className="flex items-start space-x-2">
                                      <Checkbox
                                        id={`data-type-data-${dataType.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                                        checked={dataTypes?.includes(dataType) || false}
                                        onCheckedChange={(checked) => handleDataTypeChange(dataType, checked as boolean)}
                                        className="mt-1"
                                      />
                                      <Label htmlFor={`data-type-data-${dataType.toLowerCase().replace(/[^a-z0-9]/g, '-')}`} className="text-gray-600 cursor-pointer text-sm font-normal leading-tight">
                                        {dataType}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                                {isOtherSelected && (
                                  <div className="mt-4">
                                    <FormField
                                      control={form.control}
                                      name="otherDataType"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormControl>
                                            <Input
                                              placeholder="Please specify other data type"
                                              className="shadow-sm"
                                              {...field}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Reference Genome Used */}
                              <FormField
                                control={form.control}
                                name="referenceGenome"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-gray-700">Reference Genome Used</FormLabel>
                                    <FormControl>
                                      <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex space-x-6"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="GRCh37" id="grch37" />
                                          <Label htmlFor="grch37" className="text-gray-600 cursor-pointer text-sm font-normal leading-tight">
                                            GRCh37
                                          </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="GRCh38" id="grch38" />
                                          <Label htmlFor="grch38" className="text-gray-600 cursor-pointer text-sm font-normal leading-tight">
                                            GRCh38
                                          </Label>
                                        </div>
                                      </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              {/* Combined Upload Files or Link to Data Section */}
                              <div>
                                <div className="flex items-center mb-2">
                                  <FormLabel className="text-gray-700">
                                    Provide Data Files or Link
                                  </FormLabel>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="w-4 h-4 text-gray-500 ml-2 cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-sm italic">
                                          Either upload your data files or provide a link to external storage where your data is hosted.
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                
                                {/* File Upload Section */}
                                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
                                  <div className="flex flex-col items-center justify-center text-center">
                                    <Upload className="w-8 h-8 mb-2 text-gray-400" />
                                    <p className="mb-2 text-sm text-gray-600">Upload data files</p>
                                    <input
                                      id="file-upload-data"
                                      name="file-upload"
                                      type="file"
                                      className="sr-only"
                                      multiple
                                      onChange={handleFileChange}
                                    />
                                    <label
                                      htmlFor="file-upload-data"
                                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md cursor-pointer hover:bg-blue-50"
                                    >
                                      Select Files
                                    </label>
                                  </div>
                                  {files.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                      {files.map((file, index) => (
                                        <div key={index} className="flex items-center mb-1 last:mb-0">
                                          <FileText className="h-4 w-4 text-blue-600 mr-2" />
                                          <span className="text-sm text-gray-700 font-medium">{file.name}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Or divider */}
                                <div className="flex items-center mb-4">
                                  <div className="flex-1 border-t border-gray-300"></div>
                                  <span className="px-3 text-sm text-gray-500 bg-white">OR</span>
                                  <div className="flex-1 border-t border-gray-300"></div>
                                </div>

                                {/* Link to Data */}
                                <FormField
                                  control={form.control}
                                  name="linkToData"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          placeholder="Provide link to external data storage (e.g., Google Drive, Dropbox, etc.)"
                                          className="shadow-sm"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              {/* Researcher question - copied from paper form */}
                              <FormField
                                control={form.control}
                                name="isLeadAuthor"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-gray-700">
                                      Are you one of the researchers behind this study?
                                    </FormLabel>
                                    <div className="flex space-x-6">
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id="lead-author-data-yes"
                                          checked={field.value === true}
                                          onCheckedChange={() => field.onChange(true)}
                                        />
                                        <Label htmlFor="lead-author-data-yes" className="text-gray-600 cursor-pointer text-sm font-normal leading-tight">
                                          Yes
                                        </Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id="lead-author-data-no"
                                          checked={field.value === false}
                                          onCheckedChange={() => field.onChange(false)}
                                        />
                                        <Label htmlFor="lead-author-data-no" className="text-gray-600 cursor-pointer text-sm font-normal leading-tight">
                                          No
                                        </Label>
                                      </div>
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {/* Contact Permission Question - only show if user is a researcher */}
                              {isLeadAuthor === true && (
                                <div className="space-y-4">
                                  <FormField
                                    control={form.control}
                                    name="canContactEmail"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-gray-700">
                                          May we contact you at the provided email address for any further inquiries?
                                        </FormLabel>
                                        <div className="flex space-x-6">
                                          <div className="flex items-center space-x-2">
                                            <Checkbox
                                              id="contact-data-yes"
                                              checked={field.value === true}
                                              onCheckedChange={() => field.onChange(true)}
                                            />
                                            <Label htmlFor="contact-data-yes" className="text-gray-600 cursor-pointer text-sm font-normal leading-tight">
                                              Yes
                                            </Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <Checkbox
                                              id="contact-data-no"
                                              checked={field.value === false}
                                              onCheckedChange={() => field.onChange(false)}
                                            />
                                            <Label htmlFor="contact-data-no" className="text-gray-600 cursor-pointer text-sm font-normal leading-tight">
                                              No
                                            </Label>
                                          </div>
                                        </div>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  {/* Alternative Email Question - only show if contact permission is No */}
                                  {canContactEmail === false && (
                                    <FormField
                                      control={form.control}
                                      name="alternativeEmail"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-gray-700">
                                            Is there an alternative email address to contact? <span className="text-red-500">*</span>
                                          </FormLabel>
                                          <FormControl>
                                            <Input
                                              type="email"
                                              placeholder="Enter alternative email address"
                                              className="shadow-sm"
                                              required={canContactEmail === false}
                                              {...field}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}

                      {/* For preprint, show the data submission form */}
                      {publicationType === "preprint" && (
                        <>
                          <FormField
                            control={form.control}
                            name="studyName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700">Study Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Dataset name"
                                    className="shadow-sm"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700">Study Description</FormLabel>
                                <FormControl>
                                  <Textarea
                                    rows={4}
                                    placeholder="Brief description of the study"
                                    className="shadow-sm resize-none"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Data Transformation Question */}
                          <FormField
                            control={form.control}
                            name="isDataTransformed"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700">
                                  Is the data transformed according to cBioPortal file formats?{" "}
                                  <a 
                                    href="https://docs.cbioportal.org/file-formats/" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                                  >
                                    View file formats
                                    <ExternalLink className="ml-1 h-3 w-3" />
                                  </a>
                                </FormLabel>
                                <div className="flex space-x-6">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="transformed-yes"
                                      checked={field.value === true}
                                      onCheckedChange={() => field.onChange(true)}
                                    />
                                    <Label htmlFor="transformed-yes" className="text-gray-600 cursor-pointer text-sm font-normal leading-tight">
                                      Yes
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="transformed-no"
                                      checked={field.value === false}
                                      onCheckedChange={() => field.onChange(false)}
                                    />
                                    <Label htmlFor="transformed-no" className="text-gray-600 cursor-pointer text-sm font-normal leading-tight">
                                      No
                                    </Label>
                                  </div>
                                </div>
                                {isDataTransformed === false && (
                                  <p className="text-sm text-red-600 mt-2">
                                    Please format your data according to cBioPortal file formats before submitting.
                                  </p>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Data Types Available for Data Form */}
                          <div>
                            <div className="flex items-center mb-3">
                              <FormLabel className="text-gray-700">Available Data Types</FormLabel>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="w-4 h-4 text-gray-500 ml-2 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-sm">
                                      What data does the submission contain?
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {dataFormDataTypes.map((dataType) => (
                                <div key={dataType} className="flex items-start space-x-2">
                                  <Checkbox
                                    id={`data-type-data-${dataType.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                                    checked={dataTypes?.includes(dataType) || false}
                                    onCheckedChange={(checked) => handleDataTypeChange(dataType, checked as boolean)}
                                    className="mt-1"
                                  />
                                  <Label htmlFor={`data-type-data-${dataType.toLowerCase().replace(/[^a-z0-9]/g, '-')}`} className="text-gray-600 cursor-pointer text-sm font-normal leading-tight">
                                    {dataType}
                                  </Label>
                                </div>
                              ))}
                            </div>
                            {isOtherSelected && (
                              <div className="mt-4">
                                <FormField
                                  control={form.control}
                                  name="otherDataType"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          placeholder="Please specify other data type"
                                          className="shadow-sm"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            )}
                          </div>

                          {/* Reference Genome Used */}
                          <FormField
                            control={form.control}
                            name="referenceGenome"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700">Reference Genome Used</FormLabel>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex space-x-6"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="GRCh37" id="grch37" />
                                      <Label htmlFor="grch37" className="text-gray-600 cursor-pointer text-sm font-normal leading-tight">
                                        GRCh37
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="GRCh38" id="grch38" />
                                      <Label htmlFor="grch38" className="text-gray-600 cursor-pointer text-sm font-normal leading-tight">
                                        GRCh38
                                      </Label>
                                    </div>
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Combined Upload Files or Link to Data Section */}
                          <div>
                            <div className="flex items-center mb-2">
                              <FormLabel className="text-gray-700">
                                Provide Data Files or Link
                              </FormLabel>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="w-4 h-4 text-gray-500 ml-2 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-sm italic">
                                      Either upload your data files or provide a link to external storage where your data is hosted.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            
                            {/* File Upload Section */}
                            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
                              <div className="flex flex-col items-center justify-center text-center">
                                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                                <p className="mb-2 text-sm text-gray-600">Upload data files</p>
                                <input
                                  id="file-upload-data"
                                  name="file-upload"
                                  type="file"
                                  className="sr-only"
                                  multiple
                                  onChange={handleFileChange}
                                />
                                <label
                                  htmlFor="file-upload-data"
                                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md cursor-pointer hover:bg-blue-50"
                                >
                                  Select Files
                                </label>
                              </div>
                              {files.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  {files.map((file, index) => (
                                    <div key={index} className="flex items-center mb-1 last:mb-0">
                                      <FileText className="h-4 w-4 text-blue-600 mr-2" />
                                      <span className="text-sm text-gray-700 font-medium">{file.name}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Or divider */}
                            <div className="flex items-center mb-4">
                              <div className="flex-1 border-t border-gray-300"></div>
                              <span className="px-3 text-sm text-gray-500 bg-white">OR</span>
                              <div className="flex-1 border-t border-gray-300"></div>
                            </div>

                            {/* Link to Data */}
                            <FormField
                              control={form.control}
                              name="linkToData"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      placeholder="Provide link to external data storage (e.g., Google Drive, Dropbox, etc.)"
                                      className="shadow-sm"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Contact Permission Question - only show if user is a researcher */}
                          {isLeadAuthor === true && (
                            <div className="space-y-4">
                              <FormField
                                control={form.control}
                                name="canContactEmail"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-gray-700">
                                      May we contact you at the provided email address for any further inquiries?
                                    </FormLabel>
                                    <div className="flex space-x-6">
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id="contact-data-yes"
                                          checked={field.value === true}
                                          onCheckedChange={() => field.onChange(true)}
                                        />
                                        <Label htmlFor="contact-data-yes" className="text-gray-600 cursor-pointer text-sm font-normal leading-tight">
                                          Yes
                                        </Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id="contact-data-no"
                                          checked={field.value === false}
                                          onCheckedChange={() => field.onChange(false)}
                                        />
                                        <Label htmlFor="contact-data-no" className="text-gray-600 cursor-pointer text-sm font-normal leading-tight">
                                          No
                                        </Label>
                                      </div>
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {/* Alternative Email Question - only show if contact permission is No */}
                              {canContactEmail === false && (
                                <FormField
                                  control={form.control}
                                  name="alternativeEmail"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-gray-700">
                                        Is there an alternative email address to contact? <span className="text-red-500">*</span>
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          type="email"
                                          placeholder="Enter alternative email address"
                                          className="shadow-sm"
                                          required={canContactEmail === false}
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )}
                            </div>
                          )}
                        </>
                      )}

                      {/* Name and Email fields - moved to the end */}
                      {(actionType || publicationType === "preprint") && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-gray-700">Name</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter your name"
                                      className="shadow-sm"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-gray-700">
                                    Email {(actionType === "submit-data" || publicationType === "preprint") && <span className="text-red-500">*</span>}
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="email"
                                      placeholder="Enter your email"
                                      className="shadow-sm"
                                      required={actionType === "submit-data" || publicationType === "preprint"}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Comments field */}
                          <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700">Comments</FormLabel>
                                <FormControl>
                                  <Textarea
                                    rows={4}
                                    placeholder="Any details or instructions that could help the curators review your submission."
                                    className="shadow-sm resize-none"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:items-center sm:justify-between pt-4">
                            <div className="flex items-start">
                              <Info className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                              <p className="text-xs text-gray-600">
                                Fields marked with <span className="text-red-500">*</span> are required
                              </p>
                            </div>
                            
                            <Button 
                              type="submit" 
                              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                              disabled={isSubmitDisabled}
                            >
                              {isSubmitting ? "Submitting..." : actionType === "suggest-paper" ? "Submit Paper" : "Submit Data"}
                              {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                            </Button>
                          </div>
                        </>
                      )}
                    </form>
                  </Form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center">Thank You!</DialogTitle>
            <DialogDescription className="text-center text-base pt-2">
              {successMessage}
              <br />
              <span className="text-sm text-muted-foreground mt-2 block">
                Redirecting you to the tracker page...
              </span>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </SharedLayout>
  );
};

export default SubmitContent;