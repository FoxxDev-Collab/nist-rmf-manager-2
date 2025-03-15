/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/Dashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { assessments } from '@/services/api'
import type { Assessment } from '@/services/api'

export default function Dashboard() {
  const router = useRouter()
  const [assessmentsList, setAssessmentsList] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    fetchAssessments()
  }, [])

  const fetchAssessments = async () => {
    try {
      setLoading(true)
      const data = await assessments.getAll()
      setAssessmentsList(data)
    } catch (error) {
      toast.error('Failed to load assessments')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!id) return;
    
    try {
      await assessments.delete(id);
      toast.success('Assessment deleted successfully');
      fetchAssessments();
    } catch (error) {
      toast.error('Failed to delete assessment');
      console.error(error);
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
        fetchAssessments()
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold dark:text-white">Risk Management - Assessments</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Import Assessment</Button>
          </DialogTrigger>
          <DialogContent className="dark:bg-gray-900">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Import Assessment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFileImport} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-input" className="dark:text-gray-300">Select JSON File</Label>
                <Input
                  id="file-input"
                  type="file"
                  accept=".json"
                  disabled={importing}
                  className="dark:bg-gray-800 dark:text-white"
                />
              </div>
              <Button type="submit" disabled={importing}>
                {importing ? 'Importing...' : 'Import'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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
              {assessmentsList.filter((a: Assessment) => a.data.status === 'Completed').length}
            </p>
          </CardContent>
        </Card>
        
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold dark:text-white">
              {assessmentsList.filter((a: Assessment) => (a.data.score || 0) < 50).length}
            </p>
          </CardContent>
        </Card>
      </div>
   
      <Card className="dark:bg-gray-800 dark:border-gray-700">
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
                          onClick={() => handleDelete(assessment.id || '')}
                        >
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