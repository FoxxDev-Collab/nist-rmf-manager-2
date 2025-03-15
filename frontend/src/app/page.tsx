'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/services/api'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (auth.isAuthenticated()) {
          router.push('/dashboard')
        } else {
          router.push('/auth')
        }
      } catch (error) {
        console.error('Error checking authentication:', error)
        router.push('/auth')
      }
    }

    checkAuth()
  }, [router])

  return null
} 