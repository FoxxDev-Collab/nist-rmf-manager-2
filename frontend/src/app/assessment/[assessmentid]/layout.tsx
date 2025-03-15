'use client'

import MainLayout from '@/components/layout/MainLayout'

export default function AssessmentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MainLayout>
      {children}
    </MainLayout>
  )
} 