

import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchCancerStudies, fetchSamples } from '@/services/cbioportalApi';
import { parseIssuesData, parsePullRequestsData, parseSampleCountData } from '@/utils/dataParser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SamplesByCancerTypeChart from '@/components/analytics/SamplesByCancerTypeChart';
import { BarChart3, ArrowRight, Database, FileText, GitBranch, Dna } from 'lucide-react';
import issuesData from '@/data/issues.txt?raw';
import pullRequestsData from '@/data/pull_requests.txt?raw';
import sampleCountData from '@/data/Sample_count_cancer_type.csv?raw';

const AnalyticsPreview: React.FC = () => {
  // Fetch studies data for total count
  const { data: studies, isLoading: studiesLoading } = useQuery({
    queryKey: ['cancer-studies'],
    queryFn: fetchCancerStudies,
  });

  // Fetch unique samples count
  const { data: uniqueSamples, isLoading: samplesLoading } = useQuery({
    queryKey: ['samples'],
    queryFn: fetchSamples,
  });

  // Parse CSV data for samples by cancer type (consistent with analytics page)
  const samplesByCancerType = React.useMemo(() => {
    return parseSampleCountData(sampleCountData);
  }, []);

  // Parse tracker data (best-effort)
  let trackerPapers: any[] = [];
  let trackerData: any[] = [];
  try {
    trackerPapers = parseIssuesData(issuesData);
    trackerData = parsePullRequestsData(pullRequestsData);
  } catch (error) {
    console.error('Error parsing tracker data:', error);
  }

  // Top 5 for preview
  const top5SamplesByCancerType = React.useMemo(
    () => samplesByCancerType.slice(0, 5),
    [samplesByCancerType]
  );

  // Unique cancer types from studies (excluding mixed)
  const uniqueCancerTypesFromStudies = React.useMemo(() => {
    if (!studies) return 0;
    const uniqueCancerTypeIds = new Set(
      studies
        .filter((study: any) => study.cancerTypeId && study.cancerTypeId !== 'mixed')
        .map((study: any) => study.cancerTypeId)
    );
    return uniqueCancerTypeIds.size;
  }, [studies]);

  // Metrics tiles
  const isLoading = studiesLoading || samplesLoading;
  
  const metrics = [
    {
      title: 'Total Studies',
      value: studiesLoading ? '...' : `${studies?.length || 0}`,
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Total Samples',
      value: samplesLoading ? '...' : uniqueSamples > 0 ? `${Math.round(uniqueSamples / 1000)}K+` : '0',
      icon: Database,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Cancer Types',
      value: `${uniqueCancerTypesFromStudies}`,
      icon: GitBranch,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Genomic Datatypes',
      value: '10+',
      icon: Dna,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl shadow-xl border border-slate-200/60 p-8 overflow-hidden relative">
      {/* BG accents */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/40 to-purple-100/40 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-emerald-100/40 to-blue-100/40 rounded-full blur-2xl" />

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <h2 className="text-3xl font-bold">Dashboard Overview</h2>
          </div>
          <p className="text-slate-600 text-lg font-medium max-w-2xl mx-auto">
            Real-time insights into cancer genomics data curated in cBioPortal
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 mb-8">
          {/* Metrics */}
          <div className="xl:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {metrics.map((metric, idx) => {
                const Icon = metric.icon;
                return (
                  <Card
                    key={idx}
                    className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden"
                  >
                    <CardContent className="p-6">
                      <div
                        className={`inline-flex items-center justify-center w-12 h-12 ${metric.bgColor} rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className={`h-6 w-6 ${metric.iconColor}`} />
                      </div>
                      <div className="space-y-1">
                        <div
                          className={`text-3xl font-bold bg-gradient-to-r ${metric.color} bg-clip-text text-transparent`}
                        >
                          {metric.value}
                        </div>
                        <div className="text-sm font-medium text-slate-600">
                          {metric.title}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Chart */}
          <div className="xl:col-span-3">
            <Card className="h-full border-0 shadow-lg overflow-visible">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200/60 pb-3">
                <CardTitle className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                  Top 5 Cancer Types
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-5">
                <div className="h-48 md:h-52 lg:h-60 overflow-visible">
                  <SamplesByCancerTypeChart
                    data={top5SamplesByCancerType}
                    isLoading={false}
                    variant="embedded"
                    height={240}
                    maxBars={5}
                    barSize={18}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/analytics">
            <Button
              size="lg"
              className="group bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 text-white px-10 py-4 text-lg font-bold transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 rounded-2xl"
            >
              <BarChart3 className="mr-3 h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
              Explore Complete Analytics
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPreview;

