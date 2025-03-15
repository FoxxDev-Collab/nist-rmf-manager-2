'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import AssessmentDetail from '@/components/shared/AssessmentDetail'
import { auth } from '@/services/api'

// Define the params type
type PageParams = {
  assessmentid: string;
}

export default function AssessmentPage({ params }: { params: Promise<PageParams> }) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Unwrap params using React.use()
  const unwrappedParams = use(params)
  const assessmentId = unwrappedParams.assessmentid

  console.log('Assessment Detail Page - params:', { id: assessmentId });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (auth.isAuthenticated()) {
          setIsAuthenticated(true)
        } else {
          router.push('/auth')
        }
      } catch (error) {
        console.error('Authentication error:', error)
        router.push('/auth')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // This will never render as we redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <AssessmentDetail id={assessmentId} />
    </div>
  )
} 