
import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface SampleCountsByDataTypeChartProps {
  data: Array<{ name: string; count: number }>;
  selectedYear: number;
  availableYears: number[];
  onYearChange: (year: number) => void;
  isLoading: boolean;
}

const COLORS = [
  '#3b82f6',
  '#ef4444',
  '#f59e0b',
  '#10b981',
  '#8b5cf6',
  '#06b6d4',
  '#84cc16',
  '#f97316'
];

const SampleCountsByDataTypeChart: React.FC<
  SampleCountsByDataTypeChartProps
> = ({ data, selectedYear, availableYears, onYearChange, isLoading }) => {
  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">
              Sample Counts by Data Type ({selectedYear})
            </CardTitle>
          </div>
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => onYearChange(parseInt(value))}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 20, right: 20, left: 30, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

                {/* X-axis → numeric values */}
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#666' }}
                  axisLine={{ stroke: '#e0e0e0' }}
                  tickFormatter={(value) => value.toLocaleString()}
                  label={{
                    value: 'Number of Samples',
                    position: 'insideBottom',
                    offset: -20,
                    style: {
                      textAnchor: 'middle',
                      fill: '#666',
                      fontSize: '12px'
                    }
                  }}
                />

                {/* Y-axis → categories with Data Type label */}
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#666' }}
                  axisLine={{ stroke: '#e0e0e0' }}
                  width={140}
                  label={{
                    value: 'Data Type',
                    angle: -90,
                    position: 'insideLeft',
                    offset: -2,
                    style: {
                      textAnchor: 'middle',
                      fill: '#666',
                      fontSize: '12px'
                    }
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
                  formatter={(value) => [
                    value?.toLocaleString(),
                    'Samples'
                  ]}
                />

                <Bar dataKey="count">
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
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

export default SampleCountsByDataTypeChart;
