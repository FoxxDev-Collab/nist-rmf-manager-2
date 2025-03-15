import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, BuildingIcon, UserIcon, ActivityIcon } from 'lucide-react'

interface AssessmentOverviewProps {
  organization: string;
  assessor: string;
  date: string;
  status: string;
}

// Function to get status colors for badge variants
const getStatusColor = (status: string): "default" | "destructive" | "outline" | "secondary" => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('not') || statusLower === 'failed') return 'destructive';
  if (statusLower.includes('partial')) return 'secondary';
  if (statusLower === 'planned') return 'secondary';
  if (statusLower === 'implemented' || statusLower === 'completed') return 'default';
  return 'default';
};

export function AssessmentOverview({
  organization,
  assessor,
  date,
  status
}: AssessmentOverviewProps) {
  const formattedDate = date ? new Date(date).toLocaleDateString() : 'Not specified';
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-muted rounded-md">
              <BuildingIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Organization</p>
              <p className="text-muted-foreground">{organization || 'Not specified'}</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-muted rounded-md">
              <UserIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Assessor</p>
              <p className="text-muted-foreground">{assessor || 'Not specified'}</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-muted rounded-md">
              <CalendarIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Date</p>
              <p className="text-muted-foreground">{formattedDate}</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-muted rounded-md">
              <ActivityIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Status</p>
              <Badge variant={getStatusColor(status)}>
                {status || 'Not specified'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 