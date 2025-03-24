import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface RiskData {
  impact: number;
  likelihood: number;
  risk_score: number;
  notes?: string;
}

interface Risk {
  id?: string;
  assessmentId: string;
  title: string;
  description?: string;
  data: RiskData;
  created_at?: string;
  updated_at?: string;
}

interface RiskMatrixImprovedProps {
  risks?: Risk[];
}

const RiskMatrixImproved: React.FC<RiskMatrixImprovedProps> = ({ risks = [] }) => {
  // Calculate risk distribution
  const riskDistribution = risks.reduce((acc, risk) => {
    // Calculate base score (1-25)
    const baseScore = risk.data.impact * risk.data.likelihood;
    
    // Scale to 0-100 and invert the scale (higher score = lower risk)
    const score = 100 - ((baseScore / 25) * 100);
    
    let category = 'Low';
    if (score < 30) category = 'Critical';
    else if (score < 50) category = 'High';
    else if (score < 70) category = 'Medium';
    else category = 'Low';
    
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Convert to chart data format
  const chartData = Object.entries(riskDistribution).map(([category, count]) => ({
    name: category,
    value: count
  }));

  // Define colors for each risk level
  const getRiskColor = (category: string) => {
    switch (category) {
      case 'Critical': return '#dc2626';
      case 'High': return '#f97316';
      case 'Medium': return '#eab308';
      case 'Low': return '#22c55e';
      default: return '#94a3b8';
    }
  };

  return (
    <div className="w-full p-4 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700">
      <h3 className="text-lg font-medium mb-4 dark:text-white">Risk Distribution</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getRiskColor(entry.name)} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '0.375rem', border: '1px solid #e5e7eb', color: '#1f2937', 
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'}} 
              wrapperStyle={{ outline: 'none' }}
              itemStyle={{ color: '#1f2937' }}
              formatter={(value: number) => [`${value} Risk(s)`, '']}
              labelFormatter={(name) => `${name}`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-between mt-4 text-sm dark:text-gray-300">
        <div className="flex items-center">
          <span className="h-3 w-3 rounded-full bg-red-600 mr-1"></span>
          <span>Critical</span>
        </div>
        <div className="flex items-center">
          <span className="h-3 w-3 rounded-full bg-orange-500 mr-1"></span>
          <span>High</span>
        </div>
        <div className="flex items-center">
          <span className="h-3 w-3 rounded-full bg-yellow-500 mr-1"></span>
          <span>Medium</span>
        </div>
        <div className="flex items-center">
          <span className="h-3 w-3 rounded-full bg-green-500 mr-1"></span>
          <span>Low</span>
        </div>
      </div>
    </div>
  );
};

export default RiskMatrixImproved;