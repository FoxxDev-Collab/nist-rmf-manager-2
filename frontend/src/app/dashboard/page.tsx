'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Dashboard from './Dashboard'
import { auth } from '@/services/api'
import MainLayout from '@/components/layout/MainLayout'

export default function DashboardPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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
    <MainLayout>
      <Dashboard />
    </MainLayout>
  )
} 