'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { clients, assessments as assessmentsApi } from '@/services/api'
import { Client, Assessment } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Pencil, ArrowLeft, Building, FileText, User, Phone, Mail, Info, Upload, PlusCircle, Trash } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import MainLayout from '@/components/layout/MainLayout'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.clientid as string
  
  const [client, setClient] = useState<Client | null>(null)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [assessmentToDelete, setAssessmentToDelete] = useState<string | null>(null)

  const fetchClientData = useCallback(async () => {
    try {
      setLoading(true)
      const [clientData, assessmentsData] = await Promise.all([
        clients.getById(clientId),
        clients.getAssessments(clientId)
      ])
      
      setClient(clientData)
      setAssessments(assessmentsData)
    } catch (err) {
      console.error('Error fetching client data:', err)
      setError('Failed to load client information')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchClientData()
  }, [fetchClientData])

  const handleEdit = () => {
    router.push(`/clients/${clientId}/edit`)
  }

  const handleCreateAssessment = () => {
    router.push(`/assessment/create?clientId=${clientId}`)
  }

  const handleFileImport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fileInput = document.getElementById('client-file-input') as HTMLInputElement
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

      if (!assessment.title && !assessment.name && !assessment.organization_name && !client?.name) {
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
      // Automatically associate with the current client
      const assessmentData = {
        // Core Assessment properties
        title: assessment.title || assessment.name || `${client?.name || 'Unknown'} Assessment`,
        description: assessment.description || '',
        client_id: clientId, // Associate with the current client
        
        // AssessmentData properties
        data: {
          organization: client?.name || assessment.organization_name || assessment.client_name || assessment.organization || '',
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
        await assessmentsApi.create(assessmentData)
        toast.success('Assessment imported successfully')
        await fetchClientData() // Refresh data
        fileInput.value = ''
      } catch (error: unknown) {
        console.error('Import error details:', error)
        let errorMessage = 'Failed to import assessment'
        
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { status: number; data?: { message?: string } } }
          errorMessage = `Server error (${axiosError.response?.status}): ${axiosError.response?.data?.message || 'Unknown error'}`
          console.error('Response data:', axiosError.response?.data)
        } else if (error && typeof error === 'object' && 'request' in error) {
          errorMessage = 'No response from server. Please check if the backend is running.'
        } else if (error instanceof Error) {
          errorMessage = `Error: ${error.message}`
        }
        
        toast.error(errorMessage)
      }
    } catch (error: unknown) {
      let errorMessage = 'Failed to process assessment file'
      
      if (error instanceof SyntaxError) {
        errorMessage = 'Invalid JSON file format'
      } else if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`
      }
      
      toast.error(errorMessage)
      console.error(error)
    } finally {
      setImporting(false)
    }
  }

  const openDeleteDialog = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setAssessmentToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!assessmentToDelete) return;
    
    try {
      await assessmentsApi.delete(assessmentToDelete);
      toast.success('Assessment deleted successfully');
      fetchClientData();
    } catch (error) {
      toast.error('Failed to delete assessment');
      console.error(error);
    } finally {
      setDeleteDialogOpen(false);
      setAssessmentToDelete(null);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <div className="flex justify-center items-center h-64">
            <p>Loading client information...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !client) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="text-center py-8">
              <p>{error || 'Client not found'}</p>
              <Button 
                variant="outline"
                onClick={() => router.push('/clients')}
                className="mt-4"
              >
                Back to Clients
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/clients')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{client.name}</h1>
              {client.industry && (
                <Badge variant="outline" className="mt-1">
                  {client.industry}
                </Badge>
              )}
            </div>
          </div>
          <Button onClick={handleEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Client Details
          </Button>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.description && (
                <div>
                  <h3 className="text-sm font-medium flex items-center">
                    <Info className="h-4 w-4 mr-2 text-muted-foreground" />
                    Description
                  </h3>
                  <p className="text-sm mt-1">{client.description}</p>
                </div>
              )}
              
              {client.contact_name && (
                <div>
                  <h3 className="text-sm font-medium flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    Contact Name
                  </h3>
                  <p className="text-sm mt-1">{client.contact_name}</p>
                </div>
              )}
              
              {client.contact_email && (
                <div>
                  <h3 className="text-sm font-medium flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    Email
                  </h3>
                  <p className="text-sm mt-1">
                    <a href={`mailto:${client.contact_email}`} className="text-blue-600 hover:underline">
                      {client.contact_email}
                    </a>
                  </p>
                </div>
              )}
              
              {client.contact_phone && (
                <div>
                  <h3 className="text-sm font-medium flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    Phone
                  </h3>
                  <p className="text-sm mt-1">{client.contact_phone}</p>
                </div>
              )}
              
              {client.size && (
                <div>
                  <h3 className="text-sm font-medium">Organization Size</h3>
                  <p className="text-sm mt-1">{client.size}</p>
                </div>
              )}
              
              {client.notes && (
                <div>
                  <h3 className="text-sm font-medium">Notes</h3>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{client.notes}</p>
                </div>
              )}
              
              {!client.contact_name && !client.contact_email && !client.contact_phone && !client.notes && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">This client needs more information.</p>
                  <Button 
                    variant="outline" 
                    onClick={handleEdit}
                    className="mt-4"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Add Client Details
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assessments Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Assessments
              </CardTitle>
              <div className="flex space-x-2">
                <form onSubmit={handleFileImport}>
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
                    <Button onClick={handleCreateAssessment}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Assessment
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {assessments.map((assessment) => (
                    <Card key={assessment.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/assessment/${assessment.id}`)}>
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
                            onClick={(e) => openDeleteDialog(assessment.id || '', e)}
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
        </div>
      </div>

      {/* Delete confirmation dialog */}
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
    </MainLayout>
  )
} 