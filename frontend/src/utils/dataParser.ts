import { logger } from './logger';

export interface IssueData {
  submissionId: string;
  issueNumber: string;
  url: string;
  status: string;
  title: string;
  author: string;
  createdAt: string;
}

export interface PullRequestData {
  submissionId: string;
  issueNumber: string;
  url: string;
  status: string;
  title: string;
  author: string;
  createdAt: string;
}

export interface SampleCountData {
  name: string;
  samples: number;
  studies: number;
  cancerTypeId: string;
}

export interface SampleByDataType {
  name: string;
  count: number;
}

/**
 * Parse issues data from tab-separated text format
 * @param data - Raw issues data string
 * @returns Array of parsed issue data
 */
export const parseIssuesData = (data: string): IssueData[] => {
  logger.debug("Parsing issues data");
  
  if (!data || data.trim() === '') {
    logger.error("Issues data is empty");
    return [];
  }
  
  try {
    const lines = data.trim().split('\n');
    logger.debug("Issues data lines:", lines.length);
    
    if (lines.length < 2) {
      logger.error("Issues data has insufficient lines");
      return [];
    }
    
    // Skip the header line
    const headers = lines[0].split('\t');
    logger.debug("Issues headers:", headers);
    
    const parsedData = lines.slice(1).map((line, index) => {
      const values = line.split('\t');
      logger.debug(`Issues line ${index}:`, values.length, "columns");
      
      return {
        submissionId: values[0] || '',
        issueNumber: values[1] || '',
        url: values[2] || '',
        status: values[3] || '',
        title: values[4] || '',
        author: values[5] || '',
        createdAt: values[6] || ''
      };
    });
    
    logger.log("Parsed issues data:", parsedData.length, "items");
    return parsedData;
  } catch (error) {
    logger.error("Error parsing issues data:", error);
    return [];
  }
};

/**
 * Parse pull requests data from tab-separated text format
 * @param data - Raw pull requests data string
 * @returns Array of parsed pull request data
 */
export const parsePullRequestsData = (data: string): PullRequestData[] => {
  logger.debug("Parsing pull requests data");
  
  if (!data || data.trim() === '') {
    logger.error("Pull requests data is empty");
    return [];
  }
  
  try {
    const lines = data.trim().split('\n');
    logger.debug("Pull requests data lines:", lines.length);
    
    if (lines.length < 2) {
      logger.error("Pull requests data has insufficient lines");
      return [];
    }
    
    // Skip the header line
    const headers = lines[0].split('\t');
    logger.debug("Pull requests headers:", headers);
    
    const parsedData = lines.slice(1).map((line, index) => {
      const values = line.split('\t');
      logger.debug(`Pull requests line ${index}:`, values.length, "columns");
      
      return {
        submissionId: values[0] || '',
        issueNumber: values[1] || '',
        url: values[2] || '',
        status: values[3] || '',
        title: values[4] || '',
        author: values[5] || '',
        createdAt: values[6] || ''
      };
    });
    
    logger.log("Parsed pull requests data:", parsedData.length, "items");
    return parsedData;
  } catch (error) {
    logger.error("Error parsing pull requests data:", error);
    return [];
  }
};

/**
 * Parse sample count data from CSV format
 * @param csvData - Raw CSV data string
 * @returns Array of parsed sample count data
 */
export const parseSampleCountData = (csvData: string): SampleCountData[] => {
  try {
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    
    const parsedData = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.replace(/"/g, ''));
      return {
        name: values[0],
        samples: parseInt(values[1]) || 0,
        studies: parseInt(values[2]) || 0,
        cancerTypeId: values[0].toLowerCase().replace(/[^a-z0-9]/g, '_')
      };
    }).filter(item => item.samples > 0);
    
    logger.log("Parsed sample count data:", parsedData.length, "items");
    return parsedData;
  } catch (error) {
    logger.error("Error parsing sample count data:", error);
    return [];
  }
};

/**
 * Parse samples by data type from CSV format
 * Moved from inline definition in Analytics.tsx
 * @param csvData - Raw CSV data string
 * @returns Array of parsed sample data by type
 */
export const parseSamplesByDataType = (csvData: string): SampleByDataType[] => {
  try {
    const lines = csvData.trim().split('\n');
    
    const parsedData = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.replace(/"/g, ''));
      return {
        name: values[0] || 'Unknown',
        count: parseInt(values[1]) || 0
      };
    }).filter(item => item.count > 0);
    
    logger.log("Parsed samples by data type:", parsedData.length, "items");
    return parsedData;
  } catch (error) {
    logger.error("Error parsing samples by data type:", error);
    return [];
  }
};