import { extractYearFromStudy, YEAR_CONSTANTS } from './yearExtractor';
import { logger } from './logger';

/**
 * Process cumulative growth data from studies
 */
export const processCumulativeGrowthData = (studies: any[]) => {
  if (!studies || studies.length === 0) {
    return { data: [], unknownYearCount: 0 };
  }

  const studiesPerYear: { [key: number]: number } = {};
  const samplesPerYear: { [key: number]: number } = {};

  studies.forEach((study: any) => {
    const year = extractYearFromStudy(study);
    studiesPerYear[year] = (studiesPerYear[year] || 0) + 1;
    samplesPerYear[year] = (samplesPerYear[year] || 0) + (study.allSampleCount || 0);
  });

  const sortedYears = Object.keys(studiesPerYear)
    .map(Number)
    .filter(y => y >= YEAR_CONSTANTS.MIN_YEAR)
    .sort((a, b) => a - b);

  let cumulativeStudies = 0;
  let cumulativeSamples = 0;
  const data = sortedYears.map(year => {
    cumulativeStudies += studiesPerYear[year];
    cumulativeSamples += samplesPerYear[year] || 0;
    return {
      year,
      newStudies: studiesPerYear[year],
      newSamples: samplesPerYear[year] || 0,
      cumulativeStudies,
      cumulativeSamples,
    };
  });

  logger.log('Processed cumulative growth data:', data.length, 'data points');
  return { data, unknownYearCount: 0 };
};
