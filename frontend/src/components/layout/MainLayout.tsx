'use client'

import Header from './Header'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col dark:bg-gray-950">
      <Header />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
} 