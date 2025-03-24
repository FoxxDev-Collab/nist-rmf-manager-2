import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building, Info, User, Phone, Mail, Pencil } from 'lucide-react'
import { Client } from '@/services/api'

interface ClientInformationProps {
  client: Client
  onEdit: () => void
}

export function ClientInformation({ client, onEdit }: ClientInformationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building className="h-5 w-5 mr-2" />
          Client Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {client.description && (
          <div>
            <h3 className="text-sm font-medium flex items-center">
              <Info className="h-4 w-4 mr-2 text-muted-foreground" />
              Description
            </h3>
            <p className="text-sm mt-1">{client.description}</p>
          </div>
        )}
        
        {client.contact_name && (
          <div>
            <h3 className="text-sm font-medium flex items-center">
              <User className="h-4 w-4 mr-2 text-muted-foreground" />
              Contact Name
            </h3>
            <p className="text-sm mt-1">{client.contact_name}</p>
          </div>
        )}
        
        {client.contact_email && (
          <div>
            <h3 className="text-sm font-medium flex items-center">
              <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
              Email
            </h3>
            <p className="text-sm mt-1">
              <a href={`mailto:${client.contact_email}`} className="text-blue-600 hover:underline">
                {client.contact_email}
              </a>
            </p>
          </div>
        )}
        
        {client.contact_phone && (
          <div>
            <h3 className="text-sm font-medium flex items-center">
              <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
              Phone
            </h3>
            <p className="text-sm mt-1">{client.contact_phone}</p>
          </div>
        )}
        
        {client.size && (
          <div>
            <h3 className="text-sm font-medium">Organization Size</h3>
            <p className="text-sm mt-1">{client.size}</p>
          </div>
        )}
        
        {client.notes && (
          <div>
            <h3 className="text-sm font-medium">Notes</h3>
            <p className="text-sm mt-1 whitespace-pre-wrap">{client.notes}</p>
          </div>
        )}
        
        {!client.contact_name && !client.contact_email && !client.contact_phone && !client.notes && (
          <div className="text-center py-4">
            <p className="text-muted-foreground">This client needs more information.</p>
            <Button 
              variant="outline" 
              onClick={onEdit}
              className="mt-4"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Add Client Details
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 