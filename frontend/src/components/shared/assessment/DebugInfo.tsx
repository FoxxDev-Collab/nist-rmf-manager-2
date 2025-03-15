import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface DebugInfoProps {
  id?: string;
  title?: string;
  description?: string;
  data: Record<string, unknown>;
}

export function DebugInfo({ id, title, description, data }: DebugInfoProps) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Debug Information</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Collapse' : 'Expand'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {id && <p className="font-medium">Assessment ID: {id}</p>}
          {title && <p className="font-medium">Title: {title}</p>}
          {description && <p className="font-medium">Description: {description}</p>}
          
          {expanded && (
            <div className="mt-4 p-4 border rounded-md">
              <p className="font-medium mb-2">Raw Data</p>
              <pre className="p-4 bg-muted rounded-md text-xs overflow-auto max-h-[500px]">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 