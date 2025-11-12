import { extractYearFromStudy, getAvailableYears, YEAR_CONSTANTS } from './yearExtractor';
import { logger } from './logger';

/**
 * Process cumulative growth data from studies
 * @param studies - Array of study objects
 * @returns Object containing cumulative growth data and unknown year count
 */
export const processCumulativeGrowthData = (studies: any[]) => {
  if (!studies || studies.length === 0) {
    return { data: [], unknownYearCount: 0 };
  }
  
  // Extract years and count studies per year
  const yearCounts: { [key: number]: { studies: number; samples: number } } = {};
  
  studies.forEach((study: any) => {
    const year = extractYearFromStudy(study);
    
    if (!yearCounts[year]) {
      yearCounts[year] = { studies: 0, samples: 0 };
    }
    
    yearCounts[year].studies++;
    // Estimate samples per study (this is approximate since we don't have historical sample data)
    yearCounts[year].samples += study.allSampleCount || 100;
  });
  
  // Convert to array and sort by year
  const sortedYears = Object.keys(yearCounts)
    .map(Number)
    .sort((a, b) => a - b);
  
  // Calculate cumulative values
  let cumulativeStudies = 0;
  let cumulativeSamples = 0;
  
  const data = sortedYears
    .map(year => {
      cumulativeStudies += yearCounts[year].studies;
      cumulativeSamples += yearCounts[year].samples;
      
      return {
        year,
        cumulativeStudies,
        cumulativeSamples
      };
    })
    .filter(item => item.year >= YEAR_CONSTANTS.MIN_YEAR); // Start from MIN_YEAR
  
  logger.log("Processed cumulative growth data:", data.length, "data points");
  
  // Always return 0 for unknownYearCount since we assign all studies to years
  return { data, unknownYearCount: 0 };
};

/**
 * Status stage definitions and mappings
 */
const STATUS_STAGES = [
  'Awaiting Review',
  'Initial Review',
  'Approved for Portal Curation',
  'Curation in Progress',
  'Final Review',
  'Preparing for Release',
  'Released'
] as const;

/**
 * Map a status string to a standard stage
 * @param status - Status string to map
 * @returns Standard stage name
 */
const mapStatusToStage = (status: string): string => {
  const lowerStatus = status.toLowerCase();
  
  if (status === 'Submission' || status === 'Awaiting Review') {
    return 'Awaiting Review';
  }
  
  if (status === 'Initial Review') {
    return 'Initial Review';
  }
  
  if (status === 'Approved for Portal Curation' || status === 'Approved for Portal') {
    return 'Approved for Portal Curation';
  }
  
  if (
    status === 'Curation in Progress' ||
    status === 'Clarification Needed' ||
    status === 'Changes Requested' ||
    status === 'Awaiting Submitters Response'
  ) {
    return 'Curation in Progress';
  }
  
  if (status === 'Final Review' || status === 'Under Review' || status === 'In Review') {
    return 'Final Review';
  }
  
  if (status === 'Preparing for Release' || status === 'Import in Progress') {
    return 'Preparing for Release';
  }
  
  if (status === 'Released' || status === 'In Portal') {
    return 'Released';
  }
  
  // For any unmapped statuses, try to categorize them
  if (lowerStatus.includes('released') || lowerStatus.includes('portal')) {
    return 'Released';
  }
  
  if (lowerStatus.includes('review')) {
    return 'Final Review';
  }
  
  if (lowerStatus.includes('progress') || lowerStatus.includes('curation')) {
    return 'Curation in Progress';
  }
  
  // Default to Awaiting Review
  return 'Awaiting Review';
};

/**
 * Process tracker status data from papers and pull requests
 * @param trackerPapers - Array of paper submissions
 * @param trackerData - Array of data submissions
 * @returns Array of status counts
 */
export const processTrackerStatusData = (trackerPapers: any[], trackerData: any[]) => {
  const allSubmissions = [...trackerPapers, ...trackerData];
  const statusCounts: { [key: string]: number } = {};

  // Initialize all stages with 0 count
  STATUS_STAGES.forEach(stage => {
    statusCounts[stage] = 0;
  });

  allSubmissions.forEach((submission: any) => {
    const status = submission.status || '';
    const stage = mapStatusToStage(status);
    statusCounts[stage]++;
  });

  const result = STATUS_STAGES
    .map(stage => ({ name: stage, count: statusCounts[stage] }))
    .filter(item => item.count > 0); // Only show stages that have submissions
  
  logger.log("Processed tracker status data:", result.length, "stages with submissions");
  
  return result;
};

/**
 * Process submission timeline data
 * @param trackerPapers - Array of paper submissions
 * @param trackerData - Array of data submissions
 * @returns Array of monthly submission data
 */
export const processSubmissionTimeline = (trackerPapers: any[], trackerData: any[]) => {
  const allSubmissions = [...trackerPapers, ...trackerData];
  const monthlyData: any = {};

  allSubmissions.forEach((submission: any) => {
    if (submission.createdAt) {
      const date = new Date(submission.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          papers: 0,
          datasets: 0,
          total: 0
        };
      }
      
      if (trackerPapers.includes(submission)) {
        monthlyData[monthKey].papers++;
      } else {
        monthlyData[monthKey].datasets++;
      }
      monthlyData[monthKey].total++;
    }
  });

  const result = Object.values(monthlyData)
    .sort((a: any, b: any) => a.month.localeCompare(b.month))
    .slice(-12); // Last 12 months
  
  logger.log("Processed submission timeline:", result.length, "months");
  
  return result;
};

/**
 * Process studies data for chart visualization
 * @param studies - Array of study objects
 * @returns Array of cancer type counts
 */
export const processStudiesData = (studies: any[]) => {
  if (!studies || studies.length === 0) {
    return [];
  }
  
  const typeGroups = studies.reduce((acc: any, study: any) => {
    const type = study.cancerType?.name || 'Unknown';
    if (!acc[type]) {
      acc[type] = 0;
    }
    acc[type]++;
    return acc;
  }, {});

  const result = Object.entries(typeGroups)
    .map(([name, count]) => ({ name, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  logger.log("Processed studies data:", result.length, "cancer types");
  
  return result;
};

/**
 * Process cancer types data for chart visualization
 * @param cancerTypes - Array of cancer type objects
 * @returns Array of parent type groups
 */
export const processCancerTypesData = (cancerTypes: any[]) => {
  if (!cancerTypes || cancerTypes.length === 0) {
    return [];
  }
  
  const parentGroups = cancerTypes.reduce((acc: any, type: any) => {
    const parent = type.parent || 'Other';
    if (!acc[parent]) {
      acc[parent] = 0;
    }
    acc[parent]++;
    return acc;
  }, {});

  const result = Object.entries(parentGroups)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  
  logger.log("Processed cancer types data:", result.length, "parent groups");
  
  return result;
};

/**
 * Process cancer types by parent for detailed breakdown
 * @param cancerTypes - Array of cancer type objects
 * @returns Array of cancer type counts
 */
export const processCancerTypesByParent = (cancerTypes: any[]) => {
  if (!cancerTypes || cancerTypes.length === 0) {
    return [];
  }
  
  const nameGroups = cancerTypes.reduce((acc: any, type: any) => {
    const name = type.name || 'Other';
    if (!acc[name]) {
      acc[name] = 0;
    }
    acc[name]++;
    return acc;
  }, {});

  const result = Object.entries(nameGroups)
    .map(([name, count]) => ({ name, count: count as number }))
    .sort((a, b) => b.count - a.count);
  
  logger.log("Processed cancer types by parent:", result.length, "types");
  
  return result;
};

/**
 * Process completion rates for submissions
 * @param trackerPapers - Array of paper submissions
 * @param trackerData - Array of data submissions
 * @returns Array of completion rate data
 */
export const processCompletionRates = (trackerPapers: any[], trackerData: any[]) => {
  const statusCounts = {
    total: trackerPapers.length + trackerData.length,
    released: 0,
    inProgress: 0,
    notCuratable: 0
  };

  [...trackerPapers, ...trackerData].forEach((submission: any) => {
    const status = submission.status?.toLowerCase() || '';
    if (status.includes('released') || status.includes('in portal')) {
      statusCounts.released++;
    } else if (status.includes('not cura')) {
      statusCounts.notCuratable++;
    } else {
      statusCounts.inProgress++;
    }
  });

  const releasedRate = statusCounts.total > 0 
    ? ((statusCounts.released / statusCounts.total) * 100).toFixed(1) 
    : '0';
  const inProgressRate = statusCounts.total > 0 
    ? ((statusCounts.inProgress / statusCounts.total) * 100).toFixed(1) 
    : '0';
  const notCuratableRate = statusCounts.total > 0 
    ? ((statusCounts.notCuratable / statusCounts.total) * 100).toFixed(1) 
    : '0';

  const result = [
    { name: 'Released', value: parseFloat(releasedRate), count: statusCounts.released },
    { name: 'In Progress', value: parseFloat(inProgressRate), count: statusCounts.inProgress },
    { name: 'Not Curatable', value: parseFloat(notCuratableRate), count: statusCounts.notCuratable }
  ];
  
  logger.log("Processed completion rates:", result);
  
  return result;
};

/**
 * All possible data types for sample counts
 */
const ALL_DATA_TYPES = [
  'Sequenced',
  'CNA',
  'mRNA (RNA Seq)',
  'mRNA (Microarray)',
  'miRNA',
  'Methylation',
  'RPPA',
  'Other'
] as const;

/**
 * Extract data type from sample list ID
 * @param sampleListId - Sample list identifier
 * @returns Data type name
 */
const extractDataType = (sampleListId: string): string => {
  const id = sampleListId.toLowerCase();
  
  if (id.includes('sequenced')) return 'Sequenced';
  if (id.includes('cna')) return 'CNA';
  if (id.includes('rna_seq_v2') || id.includes('rna_seq')) return 'mRNA (RNA Seq)';
  if (id.includes('mrna')) return 'mRNA (Microarray)';
  if (id.includes('mirna')) return 'miRNA';
  if (id.includes('methylation')) return 'Methylation';
  if (id.includes('rppa')) return 'RPPA';
  
  return 'Other';
};

/**
 * Extract sample count from description field
 * @param description - Sample list description
 * @returns Sample count or 0
 */
const extractSampleCount = (description: string): number => {
  if (!description) return 0;
  
  const sampleCountMatch = description.match(/(\d+)\s+samples?/i);
  return sampleCountMatch ? parseInt(sampleCountMatch[1]) : 0;
};

/**
 * Process sample counts by data type for a specific year
 * @param sampleLists - Array of sample list objects
 * @param studies - Array of study objects
 * @param year - Year to filter by
 * @returns Array of data type counts
 */
export const processSampleCountsByDataType = (
  sampleLists: any[],
  studies: any[],
  year: number
) => {
  if (!sampleLists || !studies) {
    return [];
  }
  
  // Create a map of study years using the year extraction utility
  const studyYearMap: { [key: string]: number } = {};
  
  studies.forEach((study: any) => {
    const studyYear = extractYearFromStudy(study);
    studyYearMap[study.studyId] = studyYear;
  });
  
  // Initialize all data types with 0 count
  const dataTypeCounts: { [key: string]: number } = {};
  ALL_DATA_TYPES.forEach(type => {
    dataTypeCounts[type] = 0;
  });
  
  // Filter sample lists by year and aggregate counts
  sampleLists.forEach((sampleList: any) => {
    const studyId = sampleList.studyId;
    const studyYear = studyYearMap[studyId];
    
    if (studyYear === year) {
      const sampleCount = extractSampleCount(sampleList.description);
      
      // Only process if we found a sample count
      if (sampleCount > 0) {
        const sampleListId = sampleList.sampleListId || '';
        const dataType = extractDataType(sampleListId);
        dataTypeCounts[dataType] += sampleCount;
      }
    }
  });
  
  // Return all data types, sorted by count
  const result = ALL_DATA_TYPES
    .map(dataType => ({ name: dataType, count: dataTypeCounts[dataType] }))
    .sort((a, b) => b.count - a.count);
  
  logger.log("Processed sample counts by data type for year", year, ":", result.length, "types");
  
  return result;
};