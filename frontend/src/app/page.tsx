'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { assessments, clients } from '@/services/api'
import type { Assessment } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { FileText, FileUp, Building, BarChart, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { toast } from 'sonner'
import MainLayout from '@/components/layout/MainLayout'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()
  const [assessmentsList, setAssessmentsList] = useState<Assessment[]>([])
  const [clientsCount, setClientsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [assessmentsData, clientsData] = await Promise.all([
          assessments.getAll(),
          clients.getAll()
        ])
        setAssessmentsList(assessmentsData)
        setClientsCount(clientsData.length)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate metrics
  const getCompletedAssessments = () => {
    return assessmentsList.filter(a => (a.data?.completion === 100 || a.data?.status === 'Completed')).length
  }

  const getInProgressAssessments = () => {
    return assessmentsList.filter(a => (a.data?.completion ?? 0) < 100 && a.data?.status !== 'Completed').length
  }

  const getHighRiskCount = () => {
    // Count assessments with a score below 70% as high risk
    return assessmentsList.filter(a => (a.data?.score ?? 0) < 70).length
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Security Assessment Overview</h1>
          <p className="text-muted-foreground mt-1">
            Welcome to the NIST RMF Manager - View your assessment and client summary
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {loading ? '...' : assessmentsList.length}
                </div>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {loading ? '...' : getCompletedAssessments()}
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                High Risk Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {loading ? '...' : getHighRiskCount()}
                </div>
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Registered Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {loading ? '...' : clientsCount}
                </div>
                <Building className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileUp className="h-5 w-5 mr-2 text-primary" />
                Assessment Dashboard
              </CardTitle>
              <CardDescription>
                Manage and upload assessments, view reports and track compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">
                The assessment dashboard lets you upload and manage NIST RMF assessment data, track control implementation, and generate reports.
              </p>
              <div className="flex justify-end">
                <Button onClick={() => router.push('/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2 text-primary" />
                Client Management
              </CardTitle>
              <CardDescription>
                Manage client organizations and their assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">
                The client management section allows you to track organizations, associate them with assessments, and monitor their compliance status.
              </p>
              <div className="flex justify-end">
                <Button onClick={() => router.push('/clients')}>
                  View Clients
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Getting Started</h3>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  This system helps manage NIST RMF assessments and client compliance. To get started, 
                  upload an assessment from the Dashboard or create a new client record.
                </p>
                <div className="mt-3 flex gap-3">
                  <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')} className="bg-white dark:bg-blue-900">
                    Dashboard
                  </Button>
                  <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400" onClick={() => router.push('/clients')}>
                    Clients
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
} 