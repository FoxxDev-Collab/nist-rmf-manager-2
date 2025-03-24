'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { clients } from '@/services/api'
import { Client } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'
import MainLayout from '@/components/layout/MainLayout'

// Industry options
const INDUSTRY_OPTIONS = [
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'financial', label: 'Financial Services' },
  { value: 'technology', label: 'Technology' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail' },
  { value: 'government', label: 'Government' },
  { value: 'energy', label: 'Energy & Utilities' },
  { value: 'education', label: 'Education' },
  { value: 'nonprofit', label: 'Non-Profit' },
  { value: 'other', label: 'Other' }
]

// Organization size options
const SIZE_OPTIONS = [
  { value: 'small', label: 'Small (1-50 employees)' },
  { value: 'medium', label: 'Medium (51-500 employees)' },
  { value: 'large', label: 'Large (501-5,000 employees)' },
  { value: 'enterprise', label: 'Enterprise (5,000+ employees)' }
]

export default function EditClientPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.clientid as string
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [industry, setIndustry] = useState('')
  const [size, setSize] = useState('')
  const [notes, setNotes] = useState('')
  
  // Form validation
  const [nameError, setNameError] = useState('')
  
  // Load client data
  useEffect(() => {
    const fetchClient = async () => {
      try {
        setLoading(true)
        const client = await clients.getById(clientId)
        
        // Populate form fields
        setName(client.name || '')
        setDescription(client.description || '')
        setContactName(client.contact_name || '')
        setContactEmail(client.contact_email || '')
        setContactPhone(client.contact_phone || '')
        setIndustry(client.industry || '')
        setSize(client.size || '')
        setNotes(client.notes || '')
      } catch (err) {
        console.error('Error fetching client:', err)
        setError('Failed to load client information')
      } finally {
        setLoading(false)
      }
    }
    
    fetchClient()
  }, [clientId])
  
  const validateForm = () => {
    let isValid = true
    
    // Name is required
    if (!name.trim()) {
      setNameError('Client name is required')
      isValid = false
    } else {
      setNameError('')
    }
    
    return isValid
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    try {
      setSubmitting(true)
      
      // Create client object
      const clientData = {
        name,
        description,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        industry,
        size,
        notes
      }
      
      // Update client
      await clients.update(clientId, clientData)
      
      toast.success('Client updated successfully')
      
      // Navigate back to client details
      router.push(`/clients/${clientId}`)
    } catch (error) {
      console.error('Error updating client:', error)
      toast.error('Failed to update client')
    } finally {
      setSubmitting(false)
    }
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
  
  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="text-center py-8">
              <p>{error}</p>
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
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            onClick={() => router.push(`/clients/${clientId}`)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Edit Client: {name}</h1>
        </div>
        
        <Separator className="mb-6" />
        
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className={nameError ? 'text-red-500' : ''}>
                    Client Name *
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={nameError ? 'border-red-500' : ''}
                    placeholder="Enter client organization name"
                  />
                  {nameError && <p className="text-red-500 text-sm mt-1">{nameError}</p>}
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the client organization"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRY_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="size">Organization Size</Label>
                    <Select value={size} onValueChange={setSize}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {SIZE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="pt-4">
                  <h3 className="font-medium mb-2">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contactName">Contact Name</Label>
                      <Input
                        id="contactName"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Primary contact name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="contactEmail">Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="Contact email address"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="contactPhone">Phone</Label>
                      <Input
                        id="contactPhone"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="Contact phone number"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes about the client"
                    rows={4}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/clients/${clientId}`)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  {submitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
} 