'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { assessments } from '@/services/api'
import type { Assessment } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { FileText, Plus, Info, Building } from 'lucide-react'
import { toast } from 'sonner'
import MainLayout from '@/components/layout/MainLayout'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()
  const [assessmentsList, setAssessmentsList] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setLoading(true)
        const data = await assessments.getAll()
        setAssessmentsList(data)
      } catch (error) {
        console.error('Error fetching assessments:', error)
        toast.error('Failed to load assessments')
      } finally {
        setLoading(false)
      }
    }

    fetchAssessments()
  }, [])

  const handleCreateAssessment = () => {
    router.push('/assessment/create')
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your security assessments
            </p>
          </div>
          <Button onClick={handleCreateAssessment}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Assessment
          </Button>
        </div>

        {/* Workflow Guidance Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Assessment-First Workflow</h3>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Assessments are completed using our external tool and then uploaded into this system.
                  After uploading an assessment, you can convert it to a client record. This approach 
                  ensures that all clients in the system are associated with at least one assessment.
                </p>
                <div className="mt-3 flex gap-3">
                  <Button variant="outline" size="sm" onClick={handleCreateAssessment} className="bg-white dark:bg-blue-900">
                    Upload Assessment
                  </Button>
                  <Link href="/clients" passHref>
                    <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400">
                      View Clients
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="mb-6" />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Recent Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <p>Loading assessments...</p>
              </div>
            ) : assessmentsList.length === 0 ? (
              <div className="text-center py-8">
                <p>No assessments found. Upload your first assessment to get started.</p>
                <Button 
                  variant="outline" 
                  onClick={handleCreateAssessment}
                  className="mt-4"
                >
                  Upload Assessment
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {assessmentsList.map((assessment) => (
                  <Card 
                    key={assessment.id} 
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/assessment/${assessment.id}`)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{assessment.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {assessment.data?.organization || 'No organization'}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {assessment.client_id && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="mr-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/clients/${assessment.client_id}`);
                            }}
                          >
                            <Building className="h-4 w-4 mr-1" />
                            View Client
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/assessment/${assessment.id}`);
                          }}
                        >
                          View Details
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
    </MainLayout>
  )
} 