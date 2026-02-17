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
  // Set default values immediately
  const [publicationType, setPublicationType] = useState<PublicationType>("published");
  const [actionType, setActionType] = useState<ActionType>("suggest-paper");
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
      // Call actual API
      if (data.actionType === "suggest-paper") {
        await submitPaperSuggestion(data, files);
        setSuccessMessage("Your paper suggestion has been submitted successfully!");
      } else {
        await submitCuratedData(data, files);
        setSuccessMessage("Your data has been submitted successfully!");
      }

      // Show success modal
      setShowSuccessModal(true);

      // Reset form
      form.reset();
      setFiles([]);
      setPublicationType("published");
      setActionType("suggest-paper");

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
    // Reset action type when switching to preprint (preprint doesn't have suggest-paper option)
    if (value === "preprint") {
      setActionType("submit-data");
      form.setValue("actionType", "submit-data");
    }
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
      <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white py-8">
        <div className="mx-auto w-full max-w-5xl px-6">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center p-2 mb-3 bg-blue-100 rounded-full">
              <FileText className="h-7 w-7 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2 text-gray-800">Submit to cBioPortal</h1>
            <p className="text-base text-gray-600 max-w-3xl mx-auto">
              Contribute to cBioPortal by suggesting datasets and submitting data, published or pre-print.
            </p>
          </div>

          {/* Main Form Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-6 md:p-8">

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                  {/* Section 1: Publication Type Selection */}
                  <div>
                    <h2 className="text-lg font-semibold mb-4 text-gray-800">1. What type of study are you submitting?</h2>
                    <RadioGroup
                      value={publicationType}
                      onValueChange={handlePublicationTypeChange}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                      <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${publicationType === "published"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}>
                        <RadioGroupItem value="published" id="published" className="h-5 w-5" />
                        <Label htmlFor="published" className="font-medium text-base cursor-pointer text-gray-700 flex-1">
                          Published Paper
                        </Label>
                      </div>
                      <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${publicationType === "preprint"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}>
                        <RadioGroupItem value="preprint" id="preprint" className="h-5 w-5" />
                        <Label htmlFor="preprint" className="font-medium text-base cursor-pointer text-gray-700 flex-1">
                          Pre-publication
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Section 2: Action Type (Only for Published Papers) */}
                  {publicationType === "published" && (
                    <div>
                      <h2 className="text-lg font-semibold mb-4 text-gray-800">2. Would you like to suggest a paper or submit data?</h2>
                      <RadioGroup
                        value={actionType}
                        onValueChange={handleActionTypeChange}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      >
                        <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${actionType === "suggest-paper"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}>
                          <RadioGroupItem value="suggest-paper" id="suggest-paper" />
                          <Label htmlFor="suggest-paper" className="font-medium cursor-pointer text-gray-700 flex-1">
                            Suggest Paper for Curation
                          </Label>
                        </div>
                        <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${actionType === "submit-data"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}>
                          <RadioGroupItem value="submit-data" id="submit-data" />
                          <Label htmlFor="submit-data" className="font-medium cursor-pointer text-gray-700 flex-1">
                            Submit Formatted Data
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {/* Sharing Preference for Pre-prints */}
                  {publicationType === "preprint" && (
                    <div>
                      <h2 className="text-lg font-semibold mb-4 text-gray-800">2. How would you like to share your pre-print data?</h2>
                      <FormField
                        control={form.control}
                        name="sharingPreference"
                        render={({ field }) => (
                          <FormItem>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="space-y-3"
                            >
                              <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${field.value === "public"
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                                }`}>
                                <RadioGroupItem value="public" id="public" className="mt-1" />
                                <Label htmlFor="public" className="text-gray-700 cursor-pointer font-normal leading-snug flex-1">
                                  Make it publicly available
                                </Label>
                              </div>
                              <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${field.value === "private"
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                                }`}>
                                <RadioGroupItem value="private" id="private" className="mt-1" />
                                <Label htmlFor="private" className="text-gray-700 cursor-pointer font-normal leading-snug flex-1">
                                  Keep it private for now (review in private cBioPortal)
                                </Label>
                              </div>
                            </RadioGroup>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {sharingPreference === "private" && (
                        <div className="mt-4">
                          <FormField
                            control={form.control}
                            name="privateAccessEmails"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700 font-normal">
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
                        </div>
                      )}
                    </div>
                  )}

                  {/* Section 3: Form Fields Based on Selection */}
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-800">
                      3. {actionType === "suggest-paper" ? "Paper Information" : "Study Information"}
                    </h2>

                    {/* Paper Suggestion Form Fields */}
                    {actionType === "suggest-paper" && publicationType === "published" && (
                      <>
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
                                  required
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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
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

                        {/* Researcher question */}
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

                    {/* Data Submission Form Fields */}
                    {(actionType === "submit-data" || publicationType === "preprint") && (
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

                        {publicationType === "published" && (
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
                        )}

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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
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

                        {/* Researcher question for data form */}
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

                    {/* Comments field - Moved here under Question 3 */}
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
                  </div>

                  {/* Section 4: Contact Information */}
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-800">4. Contact Information</h2>

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
                  </div>

                  {/* Submit Button */}
                  <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:items-center sm:justify-between pt-6 border-t border-gray-200">
                    <div className="flex items-start">
                      <Info className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                      <p className="text-xs text-gray-600">
                        Fields marked with <span className="text-red-500">*</span> are required
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-8 rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-base font-medium"
                      disabled={isSubmitDisabled}
                    >
                      {isSubmitting ? "Submitting..." : actionType === "suggest-paper" ? "Submit Paper Suggestion" : "Submit Data"}
                      {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </div>
                </form>
              </Form>
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
