import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer, BarChart, CartesianGrid,
  XAxis, YAxis, Tooltip, Cell, Bar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchAvgTimePerStage } from '@/services/cbioportalApi';

const STAGE_COLORS: Record<string, string> = {
  'Submitted':            '#7570b3',
  'Initial Review':       '#1b9e77',
  'Approved for Portal':  '#66a61e',
  'Curation in Progress': '#d95f02',
  'Final Review':         '#e6ab02',
  'Preparing for Release':'#a6761d',
  'Released':             '#2986E2',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { stage, avgDays, count } = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md text-sm">
      <p className="font-semibold text-gray-800">{stage}</p>
      <p className="text-gray-600">Avg: <strong>{avgDays} day{avgDays !== 1 ? 's' : ''}</strong></p>
      <p className="text-gray-400 text-xs">{count} submission{count !== 1 ? 's' : ''}</p>
    </div>
  );
};

const AvgTimePerStageChart: React.FC = () => {
  const { data = [], isLoading } = useQuery({
    queryKey: ['avg-time-per-stage'],
    queryFn: fetchAvgTimePerStage,
  });

  const maxDays = Math.max(...data.map((d: any) => d.avgDays), 1);

  return (
    <Card className="bg-white shadow-md border border-slate-100">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">
          Avg. Time per Pipeline Stage
        </CardTitle>
        <p className="text-sm text-gray-500">
          Average days a submission spends at each stage
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : data.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-gray-400">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 4, right: 40, left: 10, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#888' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}d`}
                  domain={[0, Math.ceil(maxDays * 1.1)]}
                />
                <YAxis
                  type="category"
                  dataKey="stage"
                  tick={{ fontSize: 11, fill: '#555' }}
                  axisLine={false}
                  tickLine={false}
                  width={150}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avgDays" radius={[0, 4, 4, 0]} barSize={18} label={{
                  position: 'right',
                  fontSize: 10,
                  fill: '#888',
                  formatter: (v: number) => `${v}d`,
                }}>
                  {data.map((entry: any, i: number) => (
                    <Cell
                      key={i}
                      fill={STAGE_COLORS[entry.stage] || '#888'}
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AvgTimePerStageChart;
