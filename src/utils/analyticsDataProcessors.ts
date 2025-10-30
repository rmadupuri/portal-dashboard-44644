export const processCumulativeGrowthData = (studies: any[]) => {
  if (!studies) return { data: [], unknownYearCount: 0 };
  
  // Extract years from citations and count studies per year
  const yearCounts: { [key: string]: { studies: number; samples: number } } = {};
  const currentYear = new Date().getFullYear().toString();
  
  studies.forEach((study: any) => {
    let year: string | null = null;
    
    // Try to extract year from citation first
    if (study.citation) {
      const yearMatch = study.citation.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) {
        year = yearMatch[0];
      }
    }
    
    // If no year from citation, try from name
    if (!year && study.name) {
      const yearMatch = study.name.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) {
        year = yearMatch[0];
      }
    }
    
    // If no year from name, try from studyId
    if (!year && study.studyId) {
      const yearMatch = study.studyId.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) {
        year = yearMatch[0];
      }
    }
    
    // If still no year found, check for special patterns in study name
    if (!year && study.name) {
      const studyName = study.name.toLowerCase();
      if (studyName.includes('tcga') && studyName.includes('firehose legacy')) {
        year = '2011';
      } else if (studyName.includes('target') && studyName.includes('gdc')) {
        year = '2024';
      } else if (studyName.includes('tcga') && studyName.includes('gdc')) {
        year = '2024';
      } else if (studyName.includes('cptac') && studyName.includes('gdc')) {
        year = '2024';
      }
    }
    
    // If still no year found, assign to current year instead of skipping
    if (!year) {
      year = currentYear;
    }
    
    if (!yearCounts[year]) {
      yearCounts[year] = { studies: 0, samples: 0 };
    }
    
    yearCounts[year].studies++;
    // Estimate samples per study (this is approximate since we don't have historical sample data)
    yearCounts[year].samples += study.allSampleCount || 100;
  });
  
  // Convert to array and sort by year
  const sortedYears = Object.keys(yearCounts).sort((a, b) => {
    return parseInt(a) - parseInt(b);
  });
  
  // Calculate cumulative values
  let cumulativeStudies = 0;
  let cumulativeSamples = 0;
  
  const data = sortedYears.map(year => {
    cumulativeStudies += yearCounts[year].studies;
    cumulativeSamples += yearCounts[year].samples;
    
    return {
      year: parseInt(year),
      cumulativeStudies,
      cumulativeSamples
    };
  }).filter(item => item.year >= 2011); // Start from 2011 to match the reference chart
  
  return { data, unknownYearCount: 0 }; // Always return 0 since we include all studies now
};

export const processTrackerStatusData = (trackerPapers: any[], trackerData: any[]) => {
  const allSubmissions = [...trackerPapers, ...trackerData];
  const statusCounts: { [key: string]: number } = {};

  // Define the order of stages as they appear in the submission progress
  const stageOrder = [
    'Awaiting Review',
    'Initial Review', 
    'Approved for Portal Curation',
    'Curation in Progress',
    'Final Review',
    'Preparing for Release',
    'Released'
  ];

  // Initialize all stages with 0 count
  stageOrder.forEach(stage => {
    statusCounts[stage] = 0;
  });

  allSubmissions.forEach((submission: any) => {
    const status = submission.status || '';
    
    // Map various status variations to the standard stages
    if (status === 'Submission' || status === 'Awaiting Review') {
      statusCounts['Awaiting Review']++;
    } else if (status === 'Initial Review') {
      statusCounts['Initial Review']++;
    } else if (status === 'Approved for Portal Curation' || status === 'Approved for Portal') {
      statusCounts['Approved for Portal Curation']++;
    } else if (status === 'Curation in Progress' || status === 'Clarification Needed' || 
               status === 'Changes Requested' || status === 'Awaiting Submitters Response') {
      statusCounts['Curation in Progress']++;
    } else if (status === 'Final Review' || status === 'Under Review' || status === 'In Review') {
      statusCounts['Final Review']++;
    } else if (status === 'Preparing for Release' || status === 'Import in Progress') {
      statusCounts['Preparing for Release']++;
    } else if (status === 'Released' || status === 'In Portal') {
      statusCounts['Released']++;
    } else {
      // For any unmapped statuses, try to categorize them
      const lowerStatus = status.toLowerCase();
      if (lowerStatus.includes('released') || lowerStatus.includes('portal')) {
        statusCounts['Released']++;
      } else if (lowerStatus.includes('review')) {
        statusCounts['Final Review']++;
      } else if (lowerStatus.includes('progress') || lowerStatus.includes('curation')) {
        statusCounts['Curation in Progress']++;
      } else {
        statusCounts['Awaiting Review']++;
      }
    }
  });

  return stageOrder
    .map(stage => ({ name: stage, count: statusCounts[stage] }))
    .filter(item => item.count > 0); // Only show stages that have submissions
};

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

  return Object.values(monthlyData)
    .sort((a: any, b: any) => a.month.localeCompare(b.month))
    .slice(-12); // Last 12 months
};

export const processStudiesData = (studies: any[]) => {
  if (!studies) return [];
  
  const typeGroups = studies.reduce((acc: any, study: any) => {
    const type = study.cancerType?.name || 'Unknown';
    if (!acc[type]) {
      acc[type] = 0;
    }
    acc[type]++;
    return acc;
  }, {});

  return Object.entries(typeGroups)
    .map(([name, count]) => ({ name, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
};

export const processCancerTypesData = (cancerTypes: any[]) => {
  if (!cancerTypes) return [];
  
  const parentGroups = cancerTypes.reduce((acc: any, type: any) => {
    const parent = type.parent || 'Other';
    if (!acc[parent]) {
      acc[parent] = 0;
    }
    acc[parent]++;
    return acc;
  }, {});

  return Object.entries(parentGroups)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
};

export const processCancerTypesByParent = (cancerTypes: any[]) => {
  if (!cancerTypes) return [];
  
  const nameGroups = cancerTypes.reduce((acc: any, type: any) => {
    const name = type.name || 'Other';
    if (!acc[name]) {
      acc[name] = 0;
    }
    acc[name]++;
    return acc;
  }, {});

  return Object.entries(nameGroups)
    .map(([name, count]) => ({ name, count: count as number }))
    .sort((a, b) => b.count - a.count);
};

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

  const releasedRate = statusCounts.total > 0 ? ((statusCounts.released / statusCounts.total) * 100).toFixed(1) : '0';
  const inProgressRate = statusCounts.total > 0 ? ((statusCounts.inProgress / statusCounts.total) * 100).toFixed(1) : '0';
  const notCuratableRate = statusCounts.total > 0 ? ((statusCounts.notCuratable / statusCounts.total) * 100).toFixed(1) : '0';

  return [
    { name: 'Released', value: parseFloat(releasedRate), count: statusCounts.released },
    { name: 'In Progress', value: parseFloat(inProgressRate), count: statusCounts.inProgress },
    { name: 'Not Curatable', value: parseFloat(notCuratableRate), count: statusCounts.notCuratable }
  ];
};

export const processSampleCountsByDataType = (sampleLists: any[], studies: any[], year: number) => {
  if (!sampleLists || !studies) return [];
  
  // Create a map of study years using the same logic as cumulative growth
  const studyYearMap: { [key: string]: string } = {};
  
  studies.forEach((study: any) => {
    let studyYear: string | null = null;
    
    // Try to extract year from citation first
    if (study.citation) {
      const yearMatch = study.citation.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) {
        studyYear = yearMatch[0];
      }
    }
    
    // If no year from citation, try from name
    if (!studyYear && study.name) {
      const yearMatch = study.name.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) {
        studyYear = yearMatch[0];
      }
    }
    
    // If no year from name, try from studyId
    if (!studyYear && study.studyId) {
      const yearMatch = study.studyId.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) {
        studyYear = yearMatch[0];
      }
    }
    
    // If still no year found, check for special patterns in study name
    if (!studyYear && study.name) {
      const studyName = study.name.toLowerCase();
      if (studyName.includes('tcga') && studyName.includes('firehose legacy')) {
        studyYear = '2011';
      } else if (studyName.includes('target') && studyName.includes('gdc')) {
        studyYear = '2024';
      } else if (studyName.includes('tcga') && studyName.includes('gdc')) {
        studyYear = '2024';
      } else if (studyName.includes('cptac') && studyName.includes('gdc')) {
        studyYear = '2024';
      }
    }
    
    if (studyYear) {
      studyYearMap[study.studyId] = studyYear;
    }
  });
  
  // Define all possible data types to ensure consistent display (merged mRNA RNA Seq types)
  const allDataTypes = [
    'Sequenced',
    'CNA',
    'mRNA (RNA Seq)',
    'mRNA (Microarray)',
    'miRNA',
    'Methylation',
    'RPPA',
    'Other'
  ];
  
  // Initialize all data types with 0 count
  const dataTypeCounts: { [key: string]: number } = {};
  allDataTypes.forEach(type => {
    dataTypeCounts[type] = 0;
  });
  
  // Filter sample lists by year and extract sample counts from description
  sampleLists.forEach((sampleList: any) => {
    const studyId = sampleList.studyId;
    const studyYear = studyYearMap[studyId];
    
    if (studyYear && parseInt(studyYear) === year) {
      // Extract sample count from description field using regex
      let sampleCount = 0;
      if (sampleList.description) {
        const sampleCountMatch = sampleList.description.match(/(\d+)\s+samples?/i);
        if (sampleCountMatch) {
          sampleCount = parseInt(sampleCountMatch[1]);
        }
      }
      
      // Only process if we found a sample count
      if (sampleCount > 0) {
        const sampleListId = sampleList.sampleListId || '';
        
        // Extract data type from sampleListId (merge RNA Seq V2 with RNA Seq)
        let dataType = 'Other';
        if (sampleListId.includes('sequenced')) {
          dataType = 'Sequenced';
        } else if (sampleListId.includes('cna')) {
          dataType = 'CNA';
        } else if (sampleListId.includes('rna_seq_v2') || sampleListId.includes('rna_seq')) {
          dataType = 'mRNA (RNA Seq)';
        } else if (sampleListId.includes('mrna')) {
          dataType = 'mRNA (Microarray)';
        } else if (sampleListId.includes('mirna')) {
          dataType = 'miRNA';
        } else if (sampleListId.includes('methylation')) {
          dataType = 'Methylation';
        } else if (sampleListId.includes('rppa')) {
          dataType = 'RPPA';
        }
        
        dataTypeCounts[dataType] += sampleCount;
      }
    }
  });
  
  // Return all data types, even those with 0 counts
  return allDataTypes
    .map(dataType => ({ name: dataType, count: dataTypeCounts[dataType] }))
    .sort((a, b) => b.count - a.count);
};
