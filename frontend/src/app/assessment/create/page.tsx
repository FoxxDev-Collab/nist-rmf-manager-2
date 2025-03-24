'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { assessments, clients } from '@/services/api'
import { Client } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, UploadCloud } from 'lucide-react'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import MainLayout from '@/components/layout/MainLayout'

function AssessmentCreateForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [submitting, setSubmitting] = useState(false)
  const [clientsList, setClientsList] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [clientId, setClientId] = useState('')
  const [organization, setOrganization] = useState('')
  const [assessor, setAssessor] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  
  // Form validation
  const [titleError, setTitleError] = useState('')
  const [fileError, setFileError] = useState('')
  
  // Fetch clients when component mounts
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoadingClients(true)
        const data = await clients.getAll()
        setClientsList(data)
        
        // Check if we have a clientId from URL params
        const urlClientId = searchParams.get('clientId')
        if (urlClientId) {
          setClientId(urlClientId)
          
          // Try to get the client details to pre-fill organization
          try {
            const clientData = await clients.getById(urlClientId)
            setOrganization(clientData.name)
          } catch (error) {
            console.error('Error fetching client details:', error)
          }
        }
      } catch (error) {
        console.error('Error fetching clients:', error)
        toast.error('Failed to load clients')
      } finally {
        setLoadingClients(false)
      }
    }
    
    fetchClients()
  }, [searchParams])
  
  // When client changes, update organization name
  const handleClientChange = useCallback(async (id: string) => {
    setClientId(id)
    
    if (id === "none" || !id) {
      setOrganization('')
      return
    }
    
    try {
      const clientData = await clients.getById(id)
      setOrganization(clientData.name)
    } catch (error) {
      console.error('Error fetching client details:', error)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setUploadFile(files[0])
      setFileError('')
      
      // Try to extract title from filename if not set
      if (!title) {
        const filename = files[0].name.replace(/\.[^/.]+$/, "") // Remove extension
        setTitle(filename)
      }
    }
  }
  
  const validateForm = () => {
    let isValid = true
    
    // Title is required
    if (!title.trim()) {
      setTitleError('Assessment title is required')
      isValid = false
    } else {
      setTitleError('')
    }
    
    // If no client is selected, organization is required
    if ((clientId === "none" || !clientId) && !organization.trim()) {
      toast.error('Organization name is required when no client is selected')
      isValid = false
    }

    // File is required
    if (!uploadFile) {
      setFileError('Please select an assessment file to upload')
      isValid = false
    }
    
    return isValid
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    try {
      setSubmitting(true)
      
      // In a real implementation, this would process the file
      // For now, we'll simulate the upload with a timeout
      toast.info('Processing assessment file...')
      
      // TODO: Replace with actual file parsing/processing
      // This is a placeholder for the actual file upload logic
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Create assessment object
      const assessmentData = {
        title,
        description,
        client_id: clientId && clientId !== "none" ? clientId : undefined,
        data: {
          organization,
          assessor: assessor || 'Unknown',
          date,
          status: 'In Progress',
          controls: {}, // This would be populated from the uploaded file
          score: 0,
          completion: 0
        }
      }
      
      // Submit to API
      const result = await assessments.create(assessmentData)
      
      toast.success('Assessment uploaded successfully')
      router.push(`/assessment/${result.id}`)
    } catch (error) {
      console.error('Error uploading assessment:', error)
      toast.error('Failed to process assessment file')
    } finally {
      setSubmitting(false)
    }
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Upload Assessment</h1>
      </div>
      
      <Separator className="mb-6" />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UploadCloud className="h-5 w-5 mr-2" />
            Upload Assessment File
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                <UploadCloud className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="mb-2 text-sm text-muted-foreground">
                  Upload your completed assessment file
                </p>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".json,.csv,.xlsx,.xml"
                  onChange={handleFileChange}
                  className={fileError ? 'border-red-500' : ''}
                />
                {fileError && <p className="text-red-500 text-sm mt-1">{fileError}</p>}
                {uploadFile && (
                  <p className="mt-2 text-sm">
                    Selected file: <span className="font-medium">{uploadFile.name}</span> ({Math.round(uploadFile.size / 1024)} KB)
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="title" className={titleError ? 'text-red-500' : ''}>
                  Assessment Title *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={titleError ? 'border-red-500' : ''}
                  placeholder="e.g. Client XYZ Security Assessment"
                />
                {titleError && <p className="text-red-500 text-sm mt-1">{titleError}</p>}
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the assessment"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="client">Client</Label>
                <Select value={clientId} onValueChange={handleClientChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No client (standalone assessment)</SelectItem>
                    {loadingClients ? (
                      <SelectItem value="loading" disabled>Loading clients...</SelectItem>
                    ) : (
                      clientsList.map(client => (
                        <SelectItem key={client.id} value={client.id!}>
                          {client.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {clientId && clientId !== "none" ? 'Assessment will be linked to this client' : 'You can link to a client later'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="organization">Organization Name *</Label>
                  <Input
                    id="organization"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    readOnly={!!clientId}
                    className={clientId ? 'bg-gray-100' : ''}
                    placeholder="Organization being assessed"
                  />
                </div>
                
                <div>
                  <Label htmlFor="assessor">Assessor Name</Label>
                  <Input
                    id="assessor"
                    value={assessor}
                    onChange={(e) => setAssessor(e.target.value)}
                    placeholder="Your name or team"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="date">Assessment Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Uploading...' : 'Upload Assessment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function UploadAssessmentPage() {
  return (
    <MainLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <AssessmentCreateForm />
      </Suspense>
    </MainLayout>
  )
} 