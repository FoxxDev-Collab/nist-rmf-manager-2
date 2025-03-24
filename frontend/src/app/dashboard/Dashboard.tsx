/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/Dashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { assessments } from '@/services/api'
import type { Assessment } from '@/services/api'
import { Upload, Trash, ArrowRight, Users } from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [assessmentsList, setAssessmentsList] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [assessmentToDelete, setAssessmentToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchAssessments()
  }, [])

  const fetchAssessments = async () => {
    try {
      setLoading(true)
      const data = await assessments.getAll()
      console.log('Fetched assessments:', data)
      
      // Validate and add defaults for assessments with missing data properties
      const validatedData = data.map(assessment => {
        // Ensure each assessment has a data property with required fields
        if (!assessment.data) {
          assessment.data = {
            organization: 'Unknown',
            assessor: 'Unknown',
            date: new Date().toISOString(),
            status: 'Unknown',
            controls: {},
            score: 0,
            completion: 0
          }
        }
        
        // Ensure the controls property exists
        if (!assessment.data.controls) {
          assessment.data.controls = {}
        }
        
        return assessment
      })
      
      setAssessmentsList(validatedData)
    } catch (error) {
      console.error('Error fetching assessments:', error)
      toast.error('Failed to load assessments')
    } finally {
      setLoading(false)
    }
  }

  const openDeleteDialog = (id: string) => {
    setAssessmentToDelete(id);
    setDeleteDialogOpen(true);
  }

  const confirmDelete = async () => {
    if (!assessmentToDelete) return;
    
    try {
      await assessments.delete(assessmentToDelete);
      toast.success('Assessment deleted successfully');
      fetchAssessments();
    } catch (error) {
      toast.error('Failed to delete assessment');
      console.error(error);
    } finally {
      setDeleteDialogOpen(false);
      setAssessmentToDelete(null);
    }
  };

  const handleFileImport = async (e: React.FormEvent) => {
    e.preventDefault()
    const fileInput = document.getElementById('file-input') as HTMLInputElement
    if (!fileInput?.files?.[0]) {
      toast.error('Please select a file')
      return
    }

    try {
      setImporting(true)
      const file = fileInput.files[0]
      const content = await file.text()
      const data = JSON.parse(content)
      const assessment = data.assessment || data

      if (!assessment.title && !assessment.name && !assessment.organization_name && !assessment.client_name) {
        toast.error('Invalid assessment file: missing title or organization name')
        return
      }

      // Extract controls data if available - try multiple possible locations
      let controls = {}
      if (assessment.controls) {
        controls = assessment.controls
        console.log('Controls found directly in assessment:', Object.keys(controls).length)
      } else if (assessment.data?.controls) {
        controls = assessment.data.controls
        console.log('Controls found in assessment.data:', Object.keys(controls).length)
      } else {
        // Look for controls elsewhere in the file
        for (const key in assessment) {
          if (typeof assessment[key] === 'object' && assessment[key]?.controls) {
            controls = assessment[key].controls
            console.log(`Controls found in assessment.${key}:`, Object.keys(controls).length)
            break
          }
        }
      }

      if (Object.keys(controls).length === 0) {
        console.warn('No controls found in assessment file')
      }

      const now = new Date().toISOString()

      // Create assessment with the exact structure expected by the backend
      const assessmentData = {
        // Core Assessment properties
        title: assessment.title || assessment.name || `${assessment.organization_name || assessment.client_name || 'Unknown'} Assessment`,
        description: assessment.description || '',
        
        // AssessmentData properties
        data: {
          organization: assessment.organization_name || assessment.client_name || assessment.organization || '',
          assessor: assessment.assessor_name || assessment.assessor || '',
          date: assessment.assessment_date || assessment.date || now,
          status: assessment.status || 'In Progress',
          controls: controls,
          score: assessment.score || assessment.overall_score || 0,
          completion: assessment.completion || 0
        },
        
        created_at: assessment.created_at || now,
        updated_at: now
      }
      
      console.log('Sending assessment with controls data:', Object.keys(controls).length)
      
      try {
        await assessments.create(assessmentData)
        toast.success('Assessment imported successfully')
        await fetchAssessments()
        console.log('Assessments after import:', assessmentsList)
        fileInput.value = ''
      } catch (error: any) {
        console.error('Import error details:', error)
        let errorMessage = 'Failed to import assessment'
        
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          errorMessage = `Server error (${error.response.status}): ${error.response.data?.message || 'Unknown error'}`
          console.error('Response data:', error.response.data)
        } else if (error.request) {
          // The request was made but no response was received
          errorMessage = 'No response from server. Please check if the backend is running.'
        } else {
          // Something happened in setting up the request that triggered an Error
          errorMessage = `Error: ${error.message || 'Unknown error'}`
        }
        
        toast.error(errorMessage)
      }
    } catch (error: any) {
      let errorMessage = 'Failed to process assessment file'
      
      if (error instanceof SyntaxError) {
        errorMessage = 'Invalid JSON file format'
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`
      }
      
      toast.error(errorMessage)
      console.error(error)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Assessment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this assessment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight dark:text-white">Security Assessment Manager</h1>
          <p className="text-muted-foreground dark:text-gray-400 mt-1">
            Manage security assessments, risks, and improvement objectives
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => router.push('/clients')}>
            <Users className="h-4 w-4 mr-2" />
            Clients
          </Button>
          <form onSubmit={handleFileImport}>
            <input
              type="file"
              id="file-input"
              className="hidden"
              accept=".json"
              onChange={() => document.getElementById('submit-button')?.click()}
            />
            <Button
              type="button"
              onClick={() => document.getElementById('file-input')?.click()}
              disabled={importing}
            >
              <Upload className="h-4 w-4 mr-2" />
              {importing ? 'Importing...' : 'Import Assessment'}
            </Button>
            <button id="submit-button" type="submit" className="hidden" />
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Total Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold dark:text-white">{assessmentsList.length}</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold dark:text-white">
              {assessmentsList.filter((a: Assessment) => a.data?.status === 'Completed').length}
            </p>
          </CardContent>
        </Card>
        
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold dark:text-white">
              {assessmentsList.filter((a: Assessment) => (a.data?.score || 0) < 50).length}
            </p>
          </CardContent>
        </Card>
      </div>
   
      <Card className="mt-6 dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-white">Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <p className="dark:text-gray-300">Loading assessments...</p>
            </div>
          ) : assessmentsList.length === 0 ? (
            <div className="text-center py-8">
              <p className="dark:text-gray-300">No assessments found. Import your first assessment to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assessmentsList.map((assessment) => (
                <Card key={assessment.id} className="dark:bg-gray-900 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold dark:text-white">{assessment.title}</h3>
                        {assessment.description && (
                          <p className="text-sm text-muted-foreground dark:text-gray-400">
                            {assessment.description}
                          </p>
                        )}
                        <div className="flex items-center mt-1 space-x-2">
                          <span className="text-xs text-muted-foreground dark:text-gray-400">
                            Organization: {assessment.data?.organization || 'Unknown'}
                          </span>
                          {assessment.client_id && (
                            <Button 
                              variant="link" 
                              className="text-xs p-0 h-auto" 
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/clients/${assessment.client_id}`);
                              }}
                            >
                              View Client <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/assessment/${assessment.id}`)}
                          className="dark:bg-gray-800 dark:text-white dark:border-gray-600"
                        >
                          View
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => openDeleteDialog(assessment.id || '')}
                        >
                          <Trash className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}