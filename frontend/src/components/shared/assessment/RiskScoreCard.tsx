import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { useEffect, useState } from 'react'

// CSS classes for the score categories
const scoreClasses = {
  critical: {
    bg: 'bg-red-600',
    text: 'text-red-600',
    border: 'border-red-600',
    lightBg: 'bg-red-100',
    color: '#dc2626'
  },
  high: {
    bg: 'bg-orange-500',
    text: 'text-orange-500',
    border: 'border-orange-500',
    lightBg: 'bg-orange-100',
    color: '#f97316'
  },
  medium: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-500',
    border: 'border-yellow-500',
    lightBg: 'bg-yellow-100',
    color: '#eab308'
  },
  low: {
    bg: 'bg-green-500',
    text: 'text-green-500',
    border: 'border-green-500',
    lightBg: 'bg-green-100',
    color: '#22c55e'
  }
};

interface RiskScoreCardProps {
  score: number;  // 0-100 scale
}

export function RiskScoreCard({ score }: RiskScoreCardProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  const scoreClass = score < 30 ? scoreClasses.critical :
                     score < 50 ? scoreClasses.high :
                     score < 70 ? scoreClasses.medium :
                     scoreClasses.low;
  
  // Animate the score on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [score]);
  
  // Data for the donut chart
  const data = [
    { name: 'Score', value: animatedScore },
    { name: 'Remaining', value: 100 - animatedScore }
  ];

  const getRiskLevelText = (score: number): string => {
    if (score < 30) return 'Critical Risk';
    if (score < 50) return 'High Risk';
    if (score < 70) return 'Medium Risk';
    return 'Low Risk';
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          Risk Score
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Overall risk score based on control implementation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-2">
          <div className="h-40 w-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={0}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1000}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  <Cell fill={scoreClass.color} />
                  <Cell fill="#f3f4f6" /> {/* Light gray for remaining */}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="relative" style={{ marginTop: '-120px', textAlign: 'center' }}>
              <p className={`text-3xl font-bold ${scoreClass.text}`}>
                {animatedScore}
              </p>
              <p className="text-sm text-muted-foreground">out of 100</p>
            </div>
          </div>
          
          <Badge className={`${scoreClass.bg} text-white mt-4`}>
            {getRiskLevelText(score)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
} 