'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

export default function Header() {
  const pathname = usePathname()
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null)
  
  // Extract assessment ID from path if we're in an assessment page
  useEffect(() => {
    const match = pathname.match(/\/assessment\/([^\/]+)/)
    if (match && match[1]) {
      setCurrentAssessmentId(match[1])
    } else {
      setCurrentAssessmentId(null)
    }
  }, [pathname])

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b shadow-sm dark:bg-gray-900 dark:border-gray-800">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/" className="text-xl font-bold text-primary">
            NIST RMF Manager
          </Link>
        </div>
        
        <nav className="flex items-center space-x-4">
          <Link 
            href="/" 
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === '/' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Dashboard
          </Link>
          
          <Link 
            href="/clients" 
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname.startsWith('/clients') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Clients
          </Link>
          
          {currentAssessmentId && (
            <>
              <span className="text-muted-foreground">/</span>
              
              <Link 
                href={`/assessment/${currentAssessmentId}`}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === `/assessment/${currentAssessmentId}` ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Assessment
              </Link>
              
              <Link 
                href={`/assessment/${currentAssessmentId}/risk`}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === `/assessment/${currentAssessmentId}/risk` ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Risks
              </Link>

              <Link 
                href={`/assessment/${currentAssessmentId}/objective`}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === `/assessment/${currentAssessmentId}/objectives` ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Objectives
              </Link>
            </>
          )}
        </nav>
        
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          <Link 
            href="/profile" 
            className="text-sm font-medium text-muted-foreground hover:text-primary"
          >
            Profile
          </Link>
          
          <Link 
            href="/auth" 
            className="text-sm font-medium text-muted-foreground hover:text-primary"
          >
            Sign Out
          </Link>
        </div>
      </div>
    </header>
  )
} 