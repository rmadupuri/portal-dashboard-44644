
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import SharedLayout from "@/components/SharedLayout";
import { 
  fetchCancerStudies, 
  fetchCancerTypes, 
  fetchCancerTypesCount,
  fetchPatients,
  fetchSamples,
  fetchSamplesByType,
  fetchSampleLists
} from "@/services/cbioportalApi";
import { parseIssuesData, parsePullRequestsData, parseSampleCountData } from "@/utils/dataParser";
import {
  processCumulativeGrowthData,
  processTrackerStatusData,
  processSubmissionTimeline,
  processStudiesData,
  processCancerTypesData,
  processCompletionRates,
  processSampleCountsByDataType
} from "@/utils/analyticsDataProcessors";

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

const Analytics = () => {
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(2024);

  // Set last updated time when component mounts
  useEffect(() => {
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
    setLastUpdated(`${formattedDate} at ${formattedTime}`);
  }, []);

  // Parse CSV data for samples by cancer type
  const samplesByCancerType = parseSampleCountData(sampleCountCancerTypeData);

  // Parse CSV data for samples by data type
  const parseSamplesByDataTypeData = (csvData: string) => {
    const lines = csvData.trim().split('\n');
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.replace(/"/g, ''));
      return {
        name: values[0],
        count: parseInt(values[1])
      };
    }).filter(item => item.count > 0);
  };

  const samplesByDataType = parseSamplesByDataTypeData(sampleCountByDataTypeData);

  // Parse tracker data
  let trackerPapers: any[] = [];
  let trackerData: any[] = [];

  try {
    trackerPapers = parseIssuesData(issuesData);
    trackerData = parsePullRequestsData(pullRequestsData);
  } catch (error) {
    console.error("Error parsing tracker data:", error);
  }

  // Fetch cBioPortal data
  const { data: studies, isLoading: studiesLoading } = useQuery({
    queryKey: ['cancer-studies'],
    queryFn: fetchCancerStudies,
  });

  const { data: cancerTypes, isLoading: typesLoading } = useQuery({
    queryKey: ['cancer-types'],
    queryFn: fetchCancerTypes,
  });

  const { data: cancerTypesCount, isLoading: typesCountLoading } = useQuery({
    queryKey: ['cancer-types-count'],
    queryFn: fetchCancerTypesCount,
  });

  const { data: patients, isLoading: patientsLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: fetchPatients,
  });

  const { data: samples, isLoading: samplesLoading } = useQuery({
    queryKey: ['samples'],
    queryFn: fetchSamples,
  });

  const { data: samplesByType, isLoading: samplesByTypeLoading } = useQuery({
    queryKey: ['samples-by-type'],
    queryFn: fetchSamplesByType,
  });

  const { data: sampleLists, isLoading: sampleListsLoading } = useQuery({
    queryKey: ['sample-lists'],
    queryFn: fetchSampleLists,
  });

  // Calculate unique cancer types from studies (excluding mixed type)
  const uniqueCancerTypesFromStudies = React.useMemo(() => {
    if (!studies) return 0;
    
    const uniqueCancerTypeIds = new Set(
      studies
        .filter(study => study.cancerTypeId && study.cancerTypeId !== 'mixed')
        .map(study => study.cancerTypeId)
    );
    
    return uniqueCancerTypeIds.size;
  }, [studies]);

  // Calculate totals
  const totalSamples = samples || 0;

  // Process data for charts
  const studiesChartData = processStudiesData(studies || []);
  const cancerTypesChartData = processCancerTypesData(cancerTypes || []);
  const trackerStatusData = processTrackerStatusData(trackerPapers, trackerData);
  const submissionTimelineData = processSubmissionTimeline(trackerPapers, trackerData);
  const completionRateData = processCompletionRates(trackerPapers, trackerData);
  const { data: cumulativeGrowthData, unknownYearCount } = processCumulativeGrowthData(studies || []);

  // Process sample counts by data type for the selected year
  const sampleCountsByDataType = processSampleCountsByDataType(sampleLists || [], studies || [], selectedYear);

  // Get available years from studies
  const availableYears = React.useMemo(() => {
    if (!studies) return [2024];
    
    const years = new Set<number>();
    studies.forEach((study: any) => {
      let year: number | null = null;
      
      // Try to extract year from citation first
      if (study.citation) {
        const yearMatch = study.citation.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
          year = parseInt(yearMatch[0]);
        }
      }
      
      // If no year from citation, try from name
      if (!year && study.name) {
        const yearMatch = study.name.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
          year = parseInt(yearMatch[0]);
        }
      }
      
      // If no year from name, try from studyId
      if (!year && study.studyId) {
        const yearMatch = study.studyId.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
          year = parseInt(yearMatch[0]);
        }
      }
      
      if (year && year >= 2011) {
        years.add(year);
      }
    });
    
    return Array.from(years).sort((a, b) => b - a);
  }, [studies]);

  const isLoading = studiesLoading || typesLoading || samplesLoading || typesCountLoading || samplesByTypeLoading || sampleListsLoading;

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
