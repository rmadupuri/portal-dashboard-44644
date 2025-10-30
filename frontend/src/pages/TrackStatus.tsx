import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import SharedLayout from "@/components/SharedLayout";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { SubmissionGrid } from "@/components/track-status/SubmissionGrid";
import { usePaperColumnDefs, useDataColumnDefs } from "@/components/track-status/GridConfig";
import { parseIssuesData, parsePullRequestsData, IssueData, PullRequestData } from "@/utils/dataParser";
import { SubmissionFlowTracker } from "@/components/track-status/SubmissionFlowTracker";
import { SubmissionProgressKey } from "@/components/track-status/SubmissionProgressKey";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

// Import the data files
import issuesData from "@/data/issues.txt?raw";
import pullRequestsData from "@/data/pull_requests.txt?raw";

const TrackStatus = () => {
  console.log("TrackStatus component rendering");
  
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<'suggested-papers' | 'submitted-data'>("suggested-papers");
  const [searchQuery, setSearchQuery] = useState("");
  const paperColumnDefs = usePaperColumnDefs();
  const dataColumnDefs = useDataColumnDefs();

  console.log("Issues data raw:", issuesData);
  console.log("Pull requests data raw:", pullRequestsData);

  // Parse the data
  let issuesSubmissions: IssueData[] = [];
  let pullRequestSubmissions: PullRequestData[] = [];

  try {
    issuesSubmissions = parseIssuesData(issuesData);
    pullRequestSubmissions = parsePullRequestsData(pullRequestsData);
    console.log("Parsed issues submissions:", issuesSubmissions);
    console.log("Parsed pull request submissions:", pullRequestSubmissions);
  } catch (error) {
    console.error("Error parsing data:", error);
  }

  useEffect(() => {
    if (tabParam && (tabParam === "suggested-papers" || tabParam === "submitted-data")) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Filter submissions based on search query
  const filteredPaperSubmissions = issuesSubmissions.filter(submission =>
    submission.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    submission.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    submission.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDataSubmissions = pullRequestSubmissions.filter(submission =>
    submission.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    submission.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    submission.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  console.log("Filtered paper submissions:", filteredPaperSubmissions);
  console.log("Filtered data submissions:", filteredDataSubmissions);
  console.log("Active tab:", activeTab);

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
                
                {/* Search Bar - reduced size */}
                <div className="flex items-center space-x-2 p-2 rounded-lg border-2 border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-all w-full lg:w-1/5">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    className="border-0 bg-transparent p-0 text-sm font-medium text-gray-700 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
