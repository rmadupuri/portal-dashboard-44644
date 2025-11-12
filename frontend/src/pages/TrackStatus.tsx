import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import SharedLayout from "@/components/SharedLayout";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { SubmissionGrid } from "@/components/track-status/SubmissionGrid";
import { usePaperColumnDefs, useDataColumnDefs } from "@/components/track-status/GridConfig";
import { parseIssuesData, parsePullRequestsData, IssueData, PullRequestData } from "@/utils/dataParser";
import { SubmissionProgressKey } from "@/components/track-status/SubmissionProgressKey";
import { logger } from "@/utils/logger";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

// Import the data files
import issuesData from "@/data/issues.txt?raw";
import pullRequestsData from "@/data/pull_requests.txt?raw";

const TrackStatus = () => {
  logger.debug("TrackStatus component rendering");
  
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<'suggested-papers' | 'submitted-data'>("suggested-papers");
  const [searchQuery, setSearchQuery] = useState("");
  const [dataError, setDataError] = useState<boolean>(false);
  
  const paperColumnDefs = usePaperColumnDefs();
  const dataColumnDefs = useDataColumnDefs();

  // Parse the data with error handling and memoization
  const { issuesSubmissions, pullRequestSubmissions } = useMemo(() => {
    let issues: IssueData[] = [];
    let pullRequests: PullRequestData[] = [];

    try {
      logger.debug("Parsing issues data");
      issues = parseIssuesData(issuesData);
      logger.log("Successfully parsed", issues.length, "issues");
      
      logger.debug("Parsing pull requests data");
      pullRequests = parsePullRequestsData(pullRequestsData);
      logger.log("Successfully parsed", pullRequests.length, "pull requests");
    } catch (error) {
      logger.error("Error parsing submission data:", error);
      toast.error("Failed to load submission data. Please refresh the page.");
      setDataError(true);
    }

    return {
      issuesSubmissions: issues,
      pullRequestSubmissions: pullRequests
    };
  }, []);

  // Handle tab parameter from URL
  useEffect(() => {
    if (tabParam && (tabParam === "suggested-papers" || tabParam === "submitted-data")) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Filter submissions based on search query - memoized for performance
  const filteredPaperSubmissions = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return issuesSubmissions.filter(submission =>
      submission.title?.toLowerCase().includes(query) ||
      submission.status?.toLowerCase().includes(query) ||
      submission.author?.toLowerCase().includes(query)
    );
  }, [issuesSubmissions, searchQuery]);

  const filteredDataSubmissions = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return pullRequestSubmissions.filter(submission =>
      submission.title?.toLowerCase().includes(query) ||
      submission.status?.toLowerCase().includes(query) ||
      submission.author?.toLowerCase().includes(query)
    );
  }, [pullRequestSubmissions, searchQuery]);

  logger.debug("Active tab:", activeTab);
  logger.debug("Filtered paper submissions:", filteredPaperSubmissions.length);
  logger.debug("Filtered data submissions:", filteredDataSubmissions.length);

  // Show error state if data failed to load
  if (dataError) {
    return (
      <SharedLayout>
        <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white py-12">
          <div className="w-full px-4 sm:px-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-red-800 mb-2">Unable to Load Submission Data</h2>
              <p className="text-red-600 mb-4">
                There was an error loading the submission tracking data. Please try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </SharedLayout>
    );
  }

  return (
    <SharedLayout>
      <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white py-12">
        <div className="w-full px-4 sm:px-6">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center p-2 mb-4 bg-blue-100 rounded-full">
              <Search className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold mb-3 text-gray-800">Track Submission Status</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Track the status of your submissions in real-time and view papers or datasets in the curation pipeline.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="p-6 md:p-8 w-full">
              {/* Submission Type Selection and Search Bar on same line */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <Tabs
                  value={activeTab}
                  onValueChange={(value) => {
                    setActiveTab(value as 'suggested-papers' | 'submitted-data');
                    logger.debug("Tab changed to:", value);
                  }}
                  className="w-full lg:w-auto"
                >
                  <TabsList className="grid w-full lg:w-auto grid-cols-2 lg:inline-grid">
                    <TabsTrigger value="suggested-papers" className="text-base font-semibold">
                      Published
                    </TabsTrigger>
                    <TabsTrigger value="submitted-data" className="text-base font-semibold">
                      Pre-publication
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                
                {/* Search Bar */}
                <div className="flex items-center space-x-2 p-2 rounded-lg border-2 border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-all w-full lg:w-1/5">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    className="border-0 bg-transparent p-0 text-sm font-medium text-gray-700 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      logger.debug("Search query:", e.target.value);
                    }}
                  />
                </div>
              </div>
              
              {/* Add the Submission Progress Key */}
              <SubmissionProgressKey trackType={activeTab} />
              
              {/* Content based on active tab */}
              {activeTab === "suggested-papers" && (
                <div>
                  <SubmissionGrid 
                    rowData={filteredPaperSubmissions} 
                    columnDefs={paperColumnDefs}
                    trackType="suggested-papers"
                  />
                </div>
              )}
              {activeTab === "submitted-data" && (
                <div>
                  <SubmissionGrid 
                    rowData={filteredDataSubmissions} 
                    columnDefs={dataColumnDefs}
                    trackType="submitted-data"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
};

export default TrackStatus;