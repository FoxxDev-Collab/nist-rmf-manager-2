// src/pages/Login.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { auth } from '@/services/api'

export default function Login() {
  const router = useRouter()
  const [passCode, setPassCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await auth.login(passCode)
      toast.success('Login successful')
      router.push('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      if (error instanceof Error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        if (axiosError.response?.data?.message) {
          toast.error(axiosError.response.data.message)
        } else {
          toast.error(error.message)
        }
      } else {
        toast.error('An unexpected error occurred during login')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome to the RMF Manager</CardTitle>
          <CardDescription className="text-center">
            Enter your access code to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passCode">Access Code</Label>
              <Input
                id="passCode"
                type="password"
                value={passCode}
                onChange={(e) => setPassCode(e.target.value)}
                placeholder="Enter access code"
                required
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}