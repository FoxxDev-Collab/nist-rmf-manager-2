'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { clients } from '@/services/api'
import { Client } from '@/services/api'
import { toast } from 'sonner'
import MainLayout from '@/components/layout/MainLayout'

export default function ClientsPage() {
  const router = useRouter()
  const [clientsList, setClientsList] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredClients, setFilteredClients] = useState<Client[]>([])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const data = await clients.getAll()
      setClientsList(data)
      setFilteredClients(data)
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast.error('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = clientsList.filter(client => 
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.description && client.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (client.industry && client.industry.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredClients(filtered)
    } else {
      setFilteredClients(clientsList)
    }
  }, [searchQuery, clientsList])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this client? This will not delete associated assessments.')) return

    try {
      await clients.delete(id)
      setClientsList(clientsList.filter(client => client.id !== id))
      toast.success('Client deleted successfully')
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('Failed to delete client')
    }
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground mt-1">
              View and manage your security assessment clients
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
          >
            View Assessments
          </Button>
        </div>

        <Separator className="mb-6" />

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search clients..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{clientsList.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Client List</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <p>Loading clients...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-8">
                <p>No clients found. Create your first client to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredClients.map((client) => (
                  <Card key={client.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{client.name}</h3>
                        {client.description && (
                          <p className="text-sm text-muted-foreground">
                            {client.description}
                          </p>
                        )}
                        {client.industry && (
                          <Badge variant="outline" className="mr-2">
                            {client.industry}
                          </Badge>
                        )}
                      </div>
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/clients/${client.id}`)}
                        >
                          View
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDelete(client.id!)}
                        >
                          Delete
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