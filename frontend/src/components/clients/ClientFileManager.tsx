import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, File, Trash, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

interface ClientFile {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: string
  category: string
}

export function ClientFileManager({}: { clientId: string }) {
  const [files, setFiles] = useState<ClientFile[]>([])
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target
    if (!fileInput?.files?.length) return

    try {
      setUploading(true)
      // TODO: Implement file upload API call
      toast.success('File uploaded successfully')
    } catch (error) {
      toast.error('Failed to upload file')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const handleFileDelete = async (fileId: string) => {
    try {
      // TODO: Implement file delete API call
      setFiles(files.filter(f => f.id !== fileId))
      toast.success('File deleted successfully')
    } catch (error) {
      toast.error('Failed to delete file')
      console.error(error)
    }
  }

  const handleFileDownload = async (fileId: string) => {
    try {
      // TODO: Implement file download API call
      console.log('Will download file:', fileId)
      toast.success('File download started')
    } catch (error) {
      toast.error('Failed to download file')
      console.error(error)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <File className="h-5 w-5 mr-2" />
          File Management
        </CardTitle>
        <div>
          <input
            type="file"
            id="client-file-upload"
            className="hidden"
            onChange={handleFileUpload}
            multiple
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById('client-file-upload')?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Files'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No files uploaded yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Upload NIST RMF documentation, policies, and other relevant files.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <File className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>{format(new Date(file.uploadedAt), 'MMM d, yyyy')}</span>
                      <span>•</span>
                      <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      <Badge variant="outline" className="ml-2">{file.category}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFileDownload(file.id)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFileDelete(file.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 