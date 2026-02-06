'use client'

import { useEffect, useState } from 'react'
import { usePortal } from '@/contexts/portal-context'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import {
  FileText,
  Link as LinkIcon,
  ClipboardList,
  ExternalLink,
  Download,
  Clock,
  CheckCircle2,
  Loader2,
  Eye,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Resource {
  id: string
  title: string
  description: string | null
  resource_type: 'homework' | 'file' | 'link'
  content: string | undefined // URL for links, undefined for files (use download endpoint)
  file_name: string | null
  file_size: number | null
  mime_type: string | null
  due_date: string | null
  is_completed: boolean
  completed_at: string | null
  created_at: string
  created_by: { id: string; name: string } | null
}

export default function PortalResourcesPage() {
  const { token } = usePortal()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [previewResource, setPreviewResource] = useState<Resource | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    async function loadResources() {
      try {
        const response = await fetch('/api/portal/resources', {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          const data = await response.json()
          setResources(data.resources || [])
        }
      } catch (error) {
        console.error('[MCA] Error loading resources')
      } finally {
        setLoading(false)
      }
    }
    loadResources()
  }, [token])

  async function toggleHomeworkComplete(resource: Resource) {
    setUpdatingId(resource.id)
    try {
      const response = await fetch('/api/portal/resources', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resourceId: resource.id,
          is_completed: !resource.is_completed,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setResources((prev) =>
          prev.map((r) => (r.id === resource.id ? { ...r, ...data.resource } : r))
        )
        toast.success(
          resource.is_completed ? 'Marked as incomplete' : 'Marked as complete!'
        )
      } else {
        toast.error('Failed to update')
      }
    } catch (error) {
      console.error('[MCA] Error updating resource')
      toast.error('Failed to update')
    } finally {
      setUpdatingId(null)
    }
  }

  function isPreviewable(mimeType: string | null): boolean {
    if (!mimeType) return false
    return mimeType.startsWith('image/') || mimeType === 'application/pdf'
  }

  async function previewFile(resource: Resource) {
    setPreviewResource(resource)
    setPreviewLoading(true)
    try {
      const response = await fetch(`/api/portal/resources/${resource.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Failed to load preview')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      setPreviewUrl(url)
    } catch (error) {
      console.error('[MCA] Preview error')
      toast.error('Failed to load preview')
      setPreviewResource(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  function closePreview() {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl)
    }
    setPreviewResource(null)
    setPreviewUrl(null)
  }

  async function downloadFile(resource: Resource) {
    setDownloadingId(resource.id)
    try {
      const response = await fetch(`/api/portal/resources/${resource.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Download failed')
      }

      // Get the file as a blob
      const blob = await response.blob()

      // Create download link and trigger it
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = resource.file_name || 'download'
      document.body.appendChild(a)
      a.click()

      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Download started')
    } catch (error) {
      console.error('[MCA] Download error')
      toast.error(error instanceof Error ? error.message : 'Failed to download file')
    } finally {
      setDownloadingId(null)
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function formatFileSize(bytes: number | null) {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function getResourceIcon(type: string) {
    switch (type) {
      case 'homework':
        return ClipboardList
      case 'file':
        return FileText
      case 'link':
        return LinkIcon
      default:
        return FileText
    }
  }

  const homework = resources.filter((r) => r.resource_type === 'homework')
  const files = resources.filter((r) => r.resource_type === 'file')
  const links = resources.filter((r) => r.resource_type === 'link')

  function ResourceCard({ resource }: { resource: Resource }) {
    const Icon = getResourceIcon(resource.resource_type)
    const isOverdue =
      resource.due_date &&
      !resource.is_completed &&
      new Date(resource.due_date) < new Date()

    return (
      <Card className={resource.is_completed ? 'opacity-60' : ''}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {resource.resource_type === 'homework' && (
              <div className="pt-1">
                {updatingId === resource.id ? (
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                ) : (
                  <Checkbox
                    checked={resource.is_completed}
                    onCheckedChange={() => toggleHomeworkComplete(resource)}
                  />
                )}
              </div>
            )}

            <div
              className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${
                resource.resource_type === 'homework'
                  ? 'bg-orange-100 dark:bg-orange-900/30'
                  : resource.resource_type === 'file'
                  ? 'bg-blue-100 dark:bg-blue-900/30'
                  : 'bg-purple-100 dark:bg-purple-900/30'
              }`}
            >
              <Icon
                className={`h-5 w-5 ${
                  resource.resource_type === 'homework'
                    ? 'text-orange-600 dark:text-orange-400'
                    : resource.resource_type === 'file'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-purple-600 dark:text-purple-400'
                }`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3
                    className={`font-medium ${
                      resource.is_completed ? 'line-through text-gray-500' : ''
                    }`}
                  >
                    {resource.title}
                  </h3>
                  {resource.description && (
                    <p className="text-sm text-gray-500 mt-1">{resource.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {resource.is_completed && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Done
                    </Badge>
                  )}
                  {isOverdue && (
                    <Badge variant="destructive">Overdue</Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                {resource.due_date && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Due {formatDate(resource.due_date)}
                  </span>
                )}
                {resource.file_name && (
                  <span>{resource.file_name}</span>
                )}
                {resource.file_size && (
                  <span>{formatFileSize(resource.file_size)}</span>
                )}
                {resource.created_by && (
                  <span>From {resource.created_by.name}</span>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-3">
                {resource.resource_type === 'link' && resource.content && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(resource.content, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Link
                  </Button>
                )}
                {resource.resource_type === 'file' && (
                  <div className="flex gap-2">
                    {isPreviewable(resource.mime_type) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => previewFile(resource)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(resource)}
                      disabled={downloadingId === resource.id}
                    >
                      {downloadingId === resource.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {downloadingId === resource.id ? 'Downloading...' : 'Download'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Resources</h1>
        <p className="text-gray-500">Loading your resources...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resources</h1>
        <p className="text-gray-500">
          Homework, files, and links shared with you
        </p>
      </div>

      {resources.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-1">No resources yet</h3>
            <p className="text-sm text-gray-500">
              Resources shared by your therapist will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All ({resources.length})</TabsTrigger>
            <TabsTrigger value="homework">
              Homework ({homework.length})
            </TabsTrigger>
            <TabsTrigger value="files">Files ({files.length})</TabsTrigger>
            <TabsTrigger value="links">Links ({links.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4 space-y-3">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </TabsContent>

          <TabsContent value="homework" className="mt-4 space-y-3">
            {homework.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No homework assigned</p>
            ) : (
              homework.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))
            )}
          </TabsContent>

          <TabsContent value="files" className="mt-4 space-y-3">
            {files.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No files shared</p>
            ) : (
              files.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))
            )}
          </TabsContent>

          <TabsContent value="links" className="mt-4 space-y-3">
            {links.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No links shared</p>
            ) : (
              links.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewResource} onOpenChange={(open) => !open && closePreview()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{previewResource?.title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {previewLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading preview...</span>
              </div>
            ) : previewUrl && previewResource?.mime_type?.startsWith('image/') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={previewResource.title}
                className="max-w-full h-auto rounded-lg mx-auto"
              />
            ) : previewUrl && previewResource?.mime_type === 'application/pdf' ? (
              <iframe
                src={previewUrl}
                className="w-full h-[70vh] rounded-lg border"
                title={previewResource.title}
              />
            ) : null}
          </div>
          {previewResource && (
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => downloadFile(previewResource)}
                disabled={downloadingId === previewResource.id}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
