'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { clients } from '@/services/api'
import { Client, Assessment } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Pencil, ArrowLeft, Building, FileText, User, Phone, Mail, Info } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import MainLayout from '@/components/layout/MainLayout'

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.clientid as string
  
  const [client, setClient] = useState<Client | null>(null)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClientData = async () => {
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
    }
    
    fetchClientData()
  }, [clientId])

  const handleEdit = () => {
    router.push(`/clients/${clientId}/edit`)
  }

  const handleCreateAssessment = () => {
    router.push(`/assessment/create?clientId=${clientId}`)
  }

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
              <Button onClick={handleCreateAssessment} size="sm">
                New Assessment
              </Button>
            </CardHeader>
            <CardContent>
              {assessments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No assessments found for this client.</p>
                  <Button 
                    variant="outline" 
                    onClick={handleCreateAssessment}
                    className="mt-4"
                  >
                    Create Assessment
                  </Button>
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
                        <div>
                          <Badge variant={
                            (assessment.data.score || 0) < 50 ? 'destructive' : 
                            (assessment.data.score || 0) < 70 ? 'outline' : 'default'
                          }>
                            Score: {assessment.data.score || 0}
                          </Badge>
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
    </MainLayout>
  )
} 