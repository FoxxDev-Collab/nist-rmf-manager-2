import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BarChart, Bar, XAxis, Cell, ResponsiveContainer, LabelList } from 'recharts'
import { useEffect, useState } from 'react'

interface ControlsStatusGraphProps {
  implementedPercentage: number;
  partialPercentage: number;
  notImplementedPercentage: number;
  plannedPercentage: number;
}

interface AnimatedData {
  name: string;
  value: number;
  color: string;
  label: string;
}

export function ControlsStatusGraph({
  implementedPercentage,
  partialPercentage,
  notImplementedPercentage,
  plannedPercentage
}: ControlsStatusGraphProps) {
  const [animatedData, setAnimatedData] = useState<AnimatedData[]>([
    { name: 'Implemented', value: 0, color: '#22c55e', label: 'Implemented' },
    { name: 'Partial', value: 0, color: '#eab308', label: 'Partial' },
    { name: 'Planned', value: 0, color: '#a855f7', label: 'Planned' },
    { name: 'Not Implemented', value: 0, color: '#ef4444', label: 'Not Impl.' }
  ]);

  // Animate the values on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedData([
        { name: 'Implemented', value: implementedPercentage, color: '#22c55e', label: 'Implemented' },
        { name: 'Partial', value: partialPercentage, color: '#eab308', label: 'Partial' },
        { name: 'Planned', value: plannedPercentage, color: '#a855f7', label: 'Planned' },
        { name: 'Not Implemented', value: notImplementedPercentage, color: '#ef4444', label: 'Not Impl.' }
      ]);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [implementedPercentage, partialPercentage, notImplementedPercentage, plannedPercentage]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          Controls Status Graph
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={animatedData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 80, bottom: 10 }}
            >
              <XAxis type="number" domain={[0, 100]} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {animatedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <LabelList dataKey="value" position="right" formatter={(value: number) => `${value}%`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between mt-4 text-sm">
          <div className="flex items-center">
            <span className="h-3 w-3 rounded-full bg-green-500 mr-1"></span>
            <span>Implemented</span>
          </div>
          <div className="flex items-center">
            <span className="h-3 w-3 rounded-full bg-yellow-500 mr-1"></span>
            <span>Partial</span>
          </div>
          <div className="flex items-center">
            <span className="h-3 w-3 rounded-full bg-purple-500 mr-1"></span>
            <span>Planned</span>
          </div>
          <div className="flex items-center">
            <span className="h-3 w-3 rounded-full bg-red-500 mr-1"></span>
            <span>Not Impl.</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 