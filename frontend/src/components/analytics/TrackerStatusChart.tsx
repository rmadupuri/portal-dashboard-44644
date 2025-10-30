import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TrackerStatusChartProps {
  data: Array<{ name: string; count: number }>;
}

const TrackerStatusChart: React.FC<TrackerStatusChartProps> = ({ data }) => {
  return (
    <Card className="bg-white shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">
          Status of Pipeline Studies
        </CardTitle>
        <p className="text-sm text-gray-600">
          Distribution of studies across workflow stages
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#4b5563' }}
                interval={0}
                angle={-40}
                textAnchor="end"
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#4b5563' }}
                axisLine={{ stroke: '#e5e7eb' }}
                label={{
                  value: 'Studies',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 10,
                  style: { fill: '#6b7280', fontSize: 13 },
                }}
              />
              <Tooltip
                wrapperStyle={{ zIndex: 10 }}
                content={({ payload }) => {
                  if (!payload || payload.length === 0) return null;
                  const { name, count } = payload[0].payload;
                  return (
                    <div className="bg-white border border-gray-200 rounded-md p-3 shadow-md">
                      <div className="font-semibold text-gray-800">{name}</div>
                      <div className="text-indigo-600 font-medium">{count} studies</div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="count"
                fill="#6366f1"
                radius={[6, 6, 0, 0]}
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrackerStatusChart;
