import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface SamplesByCancerTypeChartProps {
  data: Array<{ name: string; samples: number; studies: number; cancerTypeId: string }>;
  isLoading: boolean;
  variant?: 'full' | 'embedded';
  height?: number;
  maxBars?: number;
  barSize?: number;
}

const COLORS = [
  "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", 
  "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
  "#aec7e8", "#ffbb78", "#98df8a", "#ff9896", "#c5b0d5",
  "#c49c94", "#f7b6d3", "#c7c7c7", "#dbdb8d", "#9edae5"
];

const SamplesByCancerTypeChart: React.FC<SamplesByCancerTypeChartProps> = ({ 
  data, 
  isLoading, 
  variant = 'full',
  height = 600,
  maxBars = 20,
  barSize = 22
}) => {
  const sortedData = data
    .map(item => ({
      ...item,
      samples: Math.round(item.samples),
    }))
    .sort((a, b) => b.samples - a.samples)
    .slice(0, maxBars)

  // Use smaller margins for embedded variant but ensure space for labels
  const chartMargin = variant === 'embedded' 
    ? { top: 10, right: 20, left: 20, bottom: 50 }
    : { top: 20, right: 30, left: 20, bottom: 60 };

  const chartComponent = (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={sortedData}
        layout="vertical"
        margin={chartMargin}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          type="number"
          tick={{ fontSize: 12, fill: '#666' }}
          axisLine={{ stroke: '#ccc' }}
          tickLine={{ stroke: '#ccc' }}
          tickFormatter={(value) => Math.round(value).toLocaleString()}
          domain={[0, 'dataMax']}
          ticks={[0, 5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000]}
          label={{
            value: 'Number of Samples',
            position: 'insideBottom',
            offset: -10,
            style: { textAnchor: 'middle', fontSize: '12px', fill: '#666' }
          }}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: '#666' }}
          axisLine={{ stroke: '#ccc' }}
          tickLine={{ stroke: '#ccc' }}
          width={190}
          tickFormatter={(value) =>
            value.length > 25 ? value.substring(0, 25) + '...' : value
          }
          label={{
            value: 'Cancer Type',
            angle: -90,
            position: 'insideLeft',
            style: { textAnchor: 'middle', fontSize: '12px', fill: '#666' }
          }}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                  <p className="font-semibold text-gray-900 mb-2">{label}</p>
                  <p className="text-blue-600">
                    <span className="font-medium">Samples:</span> {Math.round(data.samples).toLocaleString()}
                  </p>
                  <p className="text-green-600">
                    <span className="font-medium">Studies:</span> {data.studies}
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="samples" radius={[0, 4, 4, 0]} barSize={barSize}>
          {sortedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  if (variant === 'embedded') {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="text-center text-gray-500">
            <p>No data available</p>
          </div>
        </div>
      );
    }

    return chartComponent;
  }

  // Full variant with Card wrapper (existing behavior)
  if (isLoading) {
    return (
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">
            Samples by Cancer Type
          </CardTitle>
          <p className="text-sm text-gray-600">
            Top {maxBars} cancer types by sample count with study information
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">
            Samples by Cancer Type
          </CardTitle>
          <p className="text-sm text-gray-600">
            Top {maxBars} cancer types by sample count with study information
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p>No data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">
          Samples by Cancer Type
        </CardTitle>
        <p className="text-sm text-gray-600">
          Top {maxBars} cancer types by sample count with study information
        </p>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          {chartComponent}
        </div>
      </CardContent>
    </Card>
  );
};

export default SamplesByCancerTypeChart;
