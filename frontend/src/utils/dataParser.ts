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

export const parseIssuesData = (data: string): IssueData[] => {
  console.log("Parsing issues data:", data);
  
  if (!data || data.trim() === '') {
    console.error("Issues data is empty");
    return [];
  }
  
  try {
    const lines = data.trim().split('\n');
    console.log("Issues data lines:", lines);
    
    if (lines.length < 2) {
      console.error("Issues data has insufficient lines");
      return [];
    }
    
    // Skip the header line
    const headers = lines[0].split('\t');
    console.log("Issues headers:", headers);
    
    const parsedData = lines.slice(1).map((line, index) => {
      const values = line.split('\t');
      console.log(`Issues line ${index}:`, values);
      
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
    
    console.log("Parsed issues data:", parsedData);
    return parsedData;
  } catch (error) {
    console.error("Error parsing issues data:", error);
    return [];
  }
};

export const parsePullRequestsData = (data: string): PullRequestData[] => {
  console.log("Parsing pull requests data:", data);
  
  if (!data || data.trim() === '') {
    console.error("Pull requests data is empty");
    return [];
  }
  
  try {
    const lines = data.trim().split('\n');
    console.log("Pull requests data lines:", lines);
    
    if (lines.length < 2) {
      console.error("Pull requests data has insufficient lines");
      return [];
    }
    
    // Skip the header line
    const headers = lines[0].split('\t');
    console.log("Pull requests headers:", headers);
    
    const parsedData = lines.slice(1).map((line, index) => {
      const values = line.split('\t');
      console.log(`Pull requests line ${index}:`, values);
      
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
    
    console.log("Parsed pull requests data:", parsedData);
    return parsedData;
  } catch (error) {
    console.error("Error parsing pull requests data:", error);
    return [];
  }
};

export const parseSampleCountData = (csvData: string) => {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.replace(/"/g, ''));
    return {
      name: values[0],
      samples: parseInt(values[1]),
      studies: parseInt(values[2]),
      cancerTypeId: values[0].toLowerCase().replace(/[^a-z0-9]/g, '_')
    };
  }).filter(item => item.samples > 0);
};
