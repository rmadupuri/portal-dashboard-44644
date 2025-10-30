

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CancerTypesByParentChartProps {
  data: any[];
}

const CancerTypesByParentChart: React.FC<CancerTypesByParentChartProps> = ({ data }) => {
  // Process data for pie chart
  const processedData = data.slice(0, 4).map((item, index) => ({
    name: item.name || 'Unknown',
    value: item.count || 0,
    percentage: ((item.count || 0) / data.reduce((sum, d) => sum + (d.count || 0), 0) * 100).toFixed(1)
  }));

  // Color palette matching the reference design
  const COLORS = ['#4A90E2', '#7B68EE', '#50C878', '#9370DB'];

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">Cancer Subtype</CardTitle>
        <div className="text-4xl font-bold text-purple-600">
          {data.length}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
              >
                {processedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any, name: any, props: any) => [
                  `${value} (${props.payload.percentage}%)`,
                  name
                ]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CancerTypesByParentChart;

