const CBIOPORTAL_API_BASE = "https://www.cbioportal.org/api";

/**
 * Fetch all cancer studies from cBioPortal
 */
export const fetchCancerStudies = async () => {
  try {
    const response = await fetch(`${CBIOPORTAL_API_BASE}/studies`);
    if (!response.ok) {
      throw new Error(`Failed to fetch cancer studies: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching cancer studies:", error);
    throw error;
  }
};

/**
 * Fetch cancer types from cBioPortal - returns full array for chart processing
 */
export const fetchCancerTypes = async () => {
  try {
    const response = await fetch(`${CBIOPORTAL_API_BASE}/cancer-types`);
    if (!response.ok) {
      throw new Error(`Failed to fetch cancer types: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching cancer types:", error);
    throw error;
  }
};

/**
 * Fetch unique cancer types count from cBioPortal
 */
export const fetchCancerTypesCount = async () => {
  try {
    const response = await fetch(`${CBIOPORTAL_API_BASE}/cancer-types`);
    if (!response.ok) {
      throw new Error(`Failed to fetch cancer types: ${response.status}`);
    }
    const cancerTypes = await response.json();
    
    // Count unique cancer types by cancerTypeId
    const uniqueCancerTypeIds = new Set(cancerTypes.map((type: any) => type.cancerTypeId));
    return uniqueCancerTypeIds.size;
  } catch (error) {
    console.error("Error fetching cancer types:", error);
    throw error;
  }
};

/**
 * Fetch unique patient count from cBioPortal
 */
export const fetchPatients = async () => {
  try {
    const response = await fetch(`${CBIOPORTAL_API_BASE}/patients`);
    if (!response.ok) {
      throw new Error(`Failed to fetch patients: ${response.status}`);
    }
    const patients = await response.json();
    
    // Count unique patients by PatientID
    const uniquePatientIds = new Set(patients.map((patient: any) => patient.patientId));
    return uniquePatientIds.size;
  } catch (error) {
    console.error("Error fetching patients:", error);
    throw error;
  }
};

/**
 * Fetch unique sample count from cBioPortal
 */
export const fetchSamples = async () => {
  try {
    const response = await fetch(`${CBIOPORTAL_API_BASE}/samples`);
    if (!response.ok) {
      throw new Error(`Failed to fetch samples: ${response.status}`);
    }
    const samples = await response.json();
    
    // Count unique samples by sampleId
    const uniqueSampleIds = new Set(samples.map((sample: any) => sample.sampleId));
    return uniqueSampleIds.size;
  } catch (error) {
    console.error("Error fetching samples:", error);
    throw error;
  }
};

/**
 * Fetch sample counts for a study
 */
export const fetchSampleCounts = async (studyId: string) => {
  try {
    const response = await fetch(`${CBIOPORTAL_API_BASE}/studies/${studyId}/sample-counts`);
    if (!response.ok) {
      throw new Error(`Failed to fetch sample counts: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching sample counts:", error);
    throw error;
  }
};

/**
 * Fetch samples grouped by sample type from cBioPortal
 */
export const fetchSamplesByType = async () => {
  try {
    const response = await fetch(`${CBIOPORTAL_API_BASE}/samples`);
    if (!response.ok) {
      throw new Error(`Failed to fetch samples: ${response.status}`);
    }
    const samples = await response.json();
    
    // Group samples by sampleType and count them
    const sampleTypeGroups = samples.reduce((acc: any, sample: any) => {
      const sampleType = sample.sampleType || 'Unknown';
      if (!acc[sampleType]) {
        acc[sampleType] = 0;
      }
      acc[sampleType]++;
      return acc;
    }, {});

    return Object.entries(sampleTypeGroups)
      .map(([name, count]) => ({ name, count: count as number }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error("Error fetching samples by type:", error);
    throw error;
  }
};

/**
 * Fetch sample lists from cBioPortal
 */
export const fetchSampleLists = async () => {
  try {
    const response = await fetch(`${CBIOPORTAL_API_BASE}/sample-lists`);
    if (!response.ok) {
      throw new Error(`Failed to fetch sample lists: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching sample lists:", error);
    throw error;
  }
};

/**
 * Fetch samples grouped by cancer type from cBioPortal following the proper API approach
 */
export const fetchSamplesByCancerType = async (): Promise<Array<{ name: string; samples: number; studies: number; cancerTypeId: string }>> => {
  try {
    // Step 1: Get all studies with summary projection
    const studiesResponse = await fetch(`${CBIOPORTAL_API_BASE}/studies?projection=SUMMARY`);
    if (!studiesResponse.ok) {
      throw new Error(`Failed to fetch studies: ${studiesResponse.status}`);
    }
    const studies = await studiesResponse.json();

    // Step 2: Get all cancer types for name mapping
    const cancerTypesResponse = await fetch(`${CBIOPORTAL_API_BASE}/cancer-types`);
    if (!cancerTypesResponse.ok) {
      throw new Error(`Failed to fetch cancer types: ${cancerTypesResponse.status}`);
    }
    const cancerTypes = await cancerTypesResponse.json();

    // Step 3: Create cancer type name mapping
    const cancerTypeNameMap: Record<string, string> = {};
    cancerTypes.forEach((type: any) => {
      cancerTypeNameMap[type.cancerTypeId] = type.name;
    });

    // Step 4: Get sample lists to count samples per study
    const sampleListsResponse = await fetch(`${CBIOPORTAL_API_BASE}/sample-lists`);
    if (!sampleListsResponse.ok) {
      throw new Error(`Failed to fetch sample lists: ${sampleListsResponse.status}`);
    }
    const sampleLists = await sampleListsResponse.json();

    // Step 5: Create sample count mapping per study
    const studySampleCounts: Record<string, number> = {};
    
    // Get sample counts from "all" sample lists for each study
    sampleLists.forEach((sampleList: any) => {
      if (sampleList.sampleListId.endsWith('_all') && sampleList.description) {
        const studyId = sampleList.studyId;
        // Extract sample count from description using regex
        const sampleCountMatch = sampleList.description.match(/(\d+)\s+samples?/i);
        if (sampleCountMatch) {
          studySampleCounts[studyId] = parseInt(sampleCountMatch[1]);
        }
      }
    });

    // Step 6: Group by cancer type and aggregate data
    const cancerTypeGroups: Record<string, { name: string; samples: number; studies: number; cancerTypeId: string }> = {};
    
    studies.forEach((study: any) => {
      const cancerTypeId = study.cancerTypeId || 'unknown';
      const sampleCount = studySampleCounts[study.studyId] || study.allSampleCount || 0;
      
      if (!cancerTypeGroups[cancerTypeId]) {
        cancerTypeGroups[cancerTypeId] = {
          name: cancerTypeNameMap[cancerTypeId] || cancerTypeId,
          samples: 0,
          studies: 0,
          cancerTypeId: cancerTypeId
        };
      }
      
      cancerTypeGroups[cancerTypeId].samples += sampleCount;
      cancerTypeGroups[cancerTypeId].studies += 1;
    });

    // Step 7: Return sorted results
    return Object.values(cancerTypeGroups)
      .filter((group) => group.samples > 0)
      .sort((a, b) => b.samples - a.samples);
      
  } catch (error) {
    console.error("Error fetching samples by cancer type:", error);
    return [];
  }
};
