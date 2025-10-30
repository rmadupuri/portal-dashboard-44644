

import React from 'react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CumulativeGrowthChartProps {
  data: any[];
  unknownYearCount: number;
}

const CumulativeGrowthChart: React.FC<CumulativeGrowthChartProps> = ({ data, unknownYearCount }) => {
  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">Cumulative Growth Over Time</CardTitle>
        {unknownYearCount > 0 && (
          <p className="text-sm text-gray-500">
            Note: {unknownYearCount} studies have no known publication year and are excluded from this chart.
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ left: 10, right: 60, top: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="year"
                domain={['dataMin', 'dataMax']}
                type="category"
                tick={{ fontSize: 11, fill: '#666' }}
                axisLine={{ stroke: '#e0e0e0' }}
              />
              <YAxis
                yAxisId="studies"
                orientation="left"
                stroke="#4A90E2"
                tick={{ fontSize: 11, fill: '#666' }}
                axisLine={{ stroke: '#e0e0e0' }}
                label={{
                  value: 'Studies',
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#4A90E2', fontSize: '12px' },
                }}
              />
              <YAxis
                yAxisId="samples"
                orientation="right"
                stroke="#50C878"
                tick={{ fontSize: 11, fill: '#666' }}
                axisLine={{ stroke: '#e0e0e0' }}
                label={{
                  value: 'Samples',
                  angle: 90,
                  position: 'insideRight',
                  offset: -10,
                  style: { textAnchor: 'middle', fill: '#50C878', fontSize: '12px' },
                }}
              />
              <Tooltip
                contentStyle={{ 
                  fontSize: '12px',
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value, name) => {
                  const displayNames = {
                    cumulativeStudies: 'Studies',
                    cumulativeSamples: 'Samples'
                  };
                  return [
                    typeof value === 'number' ? value.toLocaleString() : value,
                    displayNames[name as keyof typeof displayNames] || name
                  ];
                }}
                labelFormatter={(year) => `Year: ${year}`}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                payload={[
                  { value: 'Studies', type: 'line', id: 'ID01', color: '#4A90E2' },
                  { value: 'Samples', type: 'line', id: 'ID02', color: '#50C878' },
                ]}
              />
              <Line
                yAxisId="studies"
                type="monotone"
                dataKey="cumulativeStudies"
                stroke="#4A90E2"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="samples"
                type="monotone"
                dataKey="cumulativeSamples"
                stroke="#50C878"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CumulativeGrowthChart;
