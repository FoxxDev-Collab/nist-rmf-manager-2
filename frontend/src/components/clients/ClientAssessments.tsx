import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Upload, PlusCircle, Trash } from 'lucide-react'
import { Assessment } from '@/services/api'
import { format } from 'date-fns'

interface ClientAssessmentsProps {
  assessments: Assessment[]
  importing: boolean
  onImport: (e: React.FormEvent<HTMLFormElement>) => void
  onCreateAssessment: () => void
  onDeleteAssessment: (id: string, e: React.MouseEvent<HTMLButtonElement>) => void
  onAssessmentClick: (id: string) => void
}

export function ClientAssessments({
  assessments,
  importing,
  onImport,
  onCreateAssessment,
  onDeleteAssessment,
  onAssessmentClick
}: ClientAssessmentsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Assessments
        </CardTitle>
        <div className="flex space-x-2">
          <form onSubmit={onImport}>
            <input
              type="file"
              id="client-file-input"
              className="hidden"
              accept=".json"
              onChange={() => document.getElementById('client-submit-button')?.click()}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('client-file-input')?.click()}
              disabled={importing}
            >
              <Upload className="h-4 w-4 mr-2" />
              {importing ? 'Importing...' : 'Import Assessment'}
            </Button>
            <button id="client-submit-button" type="submit" className="hidden" />
          </form>
        </div>
      </CardHeader>
      <CardContent>
        {assessments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No assessments found for this client.</p>
            <div className="flex justify-center gap-2 mt-4">
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('client-file-input')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Assessment
              </Button>
              <Button onClick={onCreateAssessment}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Assessment
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {assessments.map((assessment) => (
              <Card 
                key={assessment.id} 
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onAssessmentClick(assessment.id || '')}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{assessment.title}</h3>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={assessment.data.status === 'Completed' ? 'default' : 'outline'}>
                        {assessment.data.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {assessment.data.date ? format(new Date(assessment.data.date), 'MMM d, yyyy') : 'No date'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      (assessment.data.score || 0) < 50 ? 'destructive' : 
                      (assessment.data.score || 0) < 70 ? 'outline' : 'default'
                    }>
                      Score: {assessment.data.score || 0}
                    </Badge>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="h-8"
                      onClick={(e) => onDeleteAssessment(assessment.id || '', e)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 