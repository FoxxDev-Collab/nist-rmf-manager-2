import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ControlsStatusCardProps {
  implementedPercentage: number;
  partialPercentage: number;
  notImplementedPercentage: number;
  plannedPercentage: number;
  totalControls: number;
}

export function ControlsStatusCard({
  implementedPercentage,
  partialPercentage,
  notImplementedPercentage,
  plannedPercentage,
  totalControls
}: ControlsStatusCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          Controls Status
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Summary of control implementation statuses</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-green-500"></span>
              <span>Implemented</span>
            </div>
            <Badge variant="outline">{implementedPercentage}%</Badge>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
              <span>Partially Implemented</span>
            </div>
            <Badge variant="outline">{partialPercentage}%</Badge>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-red-500"></span>
              <span>Not Implemented</span>
            </div>
            <Badge variant="outline">{notImplementedPercentage}%</Badge>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-purple-500"></span>
              <span>Planned</span>
            </div>
            <Badge variant="outline">{plannedPercentage}%</Badge>
          </div>
          <div className="mt-2 pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Controls</span>
              <Badge variant="outline">{totalControls}</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 