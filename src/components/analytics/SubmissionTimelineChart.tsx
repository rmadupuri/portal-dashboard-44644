
import React from 'react';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SubmissionTimelineChartProps {
  data: any[];
}

const SubmissionTimelineChart: React.FC<SubmissionTimelineChartProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Submission Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="papers" 
                stackId="1"
                stroke="#3b82f6" 
                fill="#3b82f6"
                name="Papers"
              />
              <Area 
                type="monotone" 
                dataKey="datasets" 
                stackId="1"
                stroke="#10b981" 
                fill="#10b981"
                name="Datasets"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubmissionTimelineChart;
