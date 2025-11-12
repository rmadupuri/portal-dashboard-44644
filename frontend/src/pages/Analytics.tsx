import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import SharedLayout from "@/components/SharedLayout";
import { 
  fetchCancerStudies, 
  fetchCancerTypes,
  fetchSamples,
  fetchSampleLists
} from "@/services/cbioportalApi";
import { 
  parseIssuesData, 
  parsePullRequestsData, 
  parseSampleCountData,
  parseSamplesByDataType 
} from "@/utils/dataParser";
import {
  processCumulativeGrowthData,
  processTrackerStatusData,
  processSampleCountsByDataType
} from "@/utils/analyticsDataProcessors";
import { getAvailableYears } from "@/utils/yearExtractor";
import { logger } from "@/utils/logger";

// Import components
import StatisticsCards from "@/components/analytics/StatisticsCards";
import CumulativeGrowthChart from "@/components/analytics/CumulativeGrowthChart";
import TrackerStatusChart from "@/components/analytics/TrackerStatusChart";
import SamplesByCancerTypeChart from "@/components/analytics/SamplesByCancerTypeChart";
import SampleCountsByDataTypeChart from "@/components/analytics/SampleCountsByDataTypeChart";
import NewDataReleaseChart from "@/components/analytics/NewDataReleaseChart";

// Import tracker data
import issuesData from "@/data/issues.txt?raw";
import pullRequestsData from "@/data/pull_requests.txt?raw";
import sampleCountCancerTypeData from "@/data/Sample_count_cancer_type.csv?raw";
import sampleCountByDataTypeData from "@/data/Sample_count_by_Data_Type.csv?raw";

/**
 * Format the current date and time for display
 */
const formatLastUpdated = (): string => {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  return `${formattedDate} at ${formattedTime}`;
};

const Analytics = () => {
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [dataError, setDataError] = useState<boolean>(false);

  // Set last updated time when component mounts
  useEffect(() => {
    setLastUpdated(formatLastUpdated());
  }, []);

  // Parse CSV data for samples by cancer type
  const samplesByCancerType = useMemo(() => {
    try {
      return parseSampleCountData(sampleCountCancerTypeData);
    } catch (error) {
      logger.error("Error parsing sample count cancer type data:", error);
      toast.error("Failed to load cancer type data");
      return [];
    }
  }, []);

  // Parse tracker data with error handling
  const { trackerPapers, trackerData } = useMemo(() => {
    let papers: any[] = [];
    let data: any[] = [];

    try {
      papers = parseIssuesData(issuesData);
      data = parsePullRequestsData(pullRequestsData);
    } catch (error) {
      logger.error("Error parsing tracker data:", error);
      toast.error("Failed to load submission tracker data");
      setDataError(true);
    }

    return { trackerPapers: papers, trackerData: data };
  }, []);

  // Fetch cBioPortal data with error handling
  const { data: studies, isLoading: studiesLoading, error: studiesError } = useQuery({
    queryKey: ['cancer-studies'],
    queryFn: fetchCancerStudies,
  });

  const { data: cancerTypes, isLoading: typesLoading } = useQuery({
    queryKey: ['cancer-types'],
    queryFn: fetchCancerTypes,
  });

  const { data: samples, isLoading: samplesLoading } = useQuery({
    queryKey: ['samples'],
    queryFn: fetchSamples,
  });

  const { data: sampleLists, isLoading: sampleListsLoading } = useQuery({
    queryKey: ['sample-lists'],
    queryFn: fetchSampleLists,
  });

  // Show error toast if studies fail to load
  useEffect(() => {
    if (studiesError) {
      logger.error("Error fetching studies:", studiesError);
      toast.error("Failed to load study data from cBioPortal");
    }
  }, [studiesError]);

  // Calculate unique cancer types from studies (excluding mixed type)
  const uniqueCancerTypesFromStudies = useMemo(() => {
    if (!studies) return 0;
    
    const uniqueCancerTypeIds = new Set(
      studies
        .filter((study: any) => study.cancerTypeId && study.cancerTypeId !== 'mixed')
        .map((study: any) => study.cancerTypeId)
    );
    
    return uniqueCancerTypeIds.size;
  }, [studies]);

  // Calculate totals
  const totalSamples = samples || 0;

  // Process data for charts
  const trackerStatusData = useMemo(() => {
    return processTrackerStatusData(trackerPapers, trackerData);
  }, [trackerPapers, trackerData]);

  const { data: cumulativeGrowthData, unknownYearCount } = useMemo(() => {
    return processCumulativeGrowthData(studies || []);
  }, [studies]);

  // Process sample counts by data type for the selected year
  const sampleCountsByDataType = useMemo(() => {
    return processSampleCountsByDataType(sampleLists || [], studies || [], selectedYear);
  }, [sampleLists, studies, selectedYear]);

  // Get available years from studies using utility
  const availableYears = useMemo(() => {
    if (!studies) return [2024];
    return getAvailableYears(studies);
  }, [studies]);

  const isLoading = studiesLoading || typesLoading || samplesLoading || sampleListsLoading;

  // Show error state if critical data failed to load
  if (dataError && !studies) {
    return (
      <SharedLayout>
        <div className="container mx-auto px-6 py-8 bg-gray-50 min-h-screen">
          <div className="max-w-6xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h2 className="text-2xl font-bold text-red-800 mb-2">Unable to Load Analytics Data</h2>
              <p className="text-red-600 mb-4">
                There was an error loading the analytics data. Please try refreshing the page.
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
      <div className="container mx-auto px-6 py-8 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 text-gray-900">cBioPortal Studies Analytics Dashboard</h1>
            <p className="text-gray-600 text-lg mb-4">
              A snapshot of current and upcoming cancer genomics studies in cBioPortal
            </p>
          </div>

          <StatisticsCards
            studies={studies}
            totalSamples={totalSamples}
            totalCancerTypes={uniqueCancerTypesFromStudies}
            lastUpdated={lastUpdated}
            isLoading={isLoading}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <CumulativeGrowthChart 
              data={cumulativeGrowthData} 
              unknownYearCount={unknownYearCount} 
            />
            <NewDataReleaseChart />
          </div>

          {/* Samples by Cancer Type Chart */}
          <div className="mb-8">
            <SamplesByCancerTypeChart 
              data={samplesByCancerType}
              isLoading={false}
            />
          </div>

          {/* Sample Counts by Data Type and Tracker Status Charts in same row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <SampleCountsByDataTypeChart 
              data={sampleCountsByDataType}
              selectedYear={selectedYear}
              availableYears={availableYears}
              onYearChange={setSelectedYear}
              isLoading={isLoading}
            />
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading cBioPortal data...</p>
              </div>
            ) : (
              <TrackerStatusChart data={trackerStatusData} />
            )}
          </div>
        </div>
      </div>
    </SharedLayout>
  );
};

export default Analytics;