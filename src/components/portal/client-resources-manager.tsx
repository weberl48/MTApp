'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FileText,
  Link as LinkIcon,
  ClipboardList,
  Loader2,
  MoreVertical,
  Trash2,
  ExternalLink,
  Clock,
  CheckCircle2,
  Upload,
  Download,
} from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog'

interface Resource {
  id: string
  title: string
  description: string | null
  resource_type: 'homework' | 'file' | 'link'
  content: string
  file_name: string | null
  due_date: string | null
  is_completed: boolean
  created_at: string
  created_by: { id: string; name: string } | null
}

interface ClientResourcesManagerProps {
  clientId: string
  clientName: string
}

export function ClientResourcesManager({ clientId, clientName }: ClientResourcesManagerProps) {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'homework' | 'link' | 'file' | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { dialogProps: confirmDialogProps, confirm: openConfirm } = useConfirmDialog()

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    async function loadResources() {
      try {
        const response = await fetch(`/api/clients/${clientId}/resources`)
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
  }, [clientId])

  function openDialog(type: 'homework' | 'link' | 'file') {
    setDialogType(type)
    setTitle('')
    setDescription('')
    setContent('')
    setDueDate('')
    setSelectedFile(null)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setDialogType(null)
    setSelectedFile(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    if (dialogType === 'homework' && !content.trim()) {
      toast.error('Assignment content is required')
      return
    }

    if (dialogType === 'link' && !content.trim()) {
      toast.error('URL is required')
      return
    }

    if (dialogType === 'file' && !selectedFile) {
      toast.error('Please select a file')
      return
    }

    setSaving(true)

    try {
      if (dialogType === 'file' && selectedFile) {
        // Handle file upload
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('title', title.trim())
        if (description.trim()) {
          formData.append('description', description.trim())
        }

        const response = await fetch(`/api/clients/${clientId}/resources/upload`, {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to upload file')
        }

        toast.success('File uploaded!')
        setResources((prev) => [data.resource, ...prev])
      } else {
        // Handle homework or link
        const response = await fetch(`/api/clients/${clientId}/resources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            resource_type: dialogType,
            content: content.trim(),
            due_date: dueDate || null,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create resource')
        }

        toast.success(
          dialogType === 'homework' ? 'Homework assigned!' : 'Link added!'
        )

        setResources((prev) => [data.resource, ...prev])
      }

      closeDialog()
    } catch (error) {
      console.error('[MCA] Error creating resource')
      toast.error(error instanceof Error ? error.message : 'Failed to create resource')
    } finally {
      setSaving(false)
    }
  }

  async function handleDownload(resource: Resource) {
    try {
      const response = await fetch(`/api/clients/${clientId}/resources/${resource.id}/download`)

      if (!response.ok) {
        throw new Error('Failed to download file')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = resource.file_name || 'download'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('[MCA] Error downloading file')
      toast.error('Failed to download file')
    }
  }

  function handleDelete(resource: Resource) {
    openConfirm({
      title: 'Delete Resource',
      description: `Delete "${resource.title}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        setDeletingId(resource.id)
        try {
          const response = await fetch(`/api/clients/${clientId}/resources`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resourceId: resource.id }),
          })

          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || 'Failed to delete')
          }

          toast.success('Resource deleted')
          setResources((prev) => prev.filter((r) => r.id !== resource.id))
        } catch (error) {
          console.error('[MCA] Error deleting resource')
          toast.error(error instanceof Error ? error.message : 'Failed to delete')
        } finally {
          setDeletingId(null)
        }
      },
    })
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function getResourceIcon(type: string) {
    switch (type) {
      case 'homework':
        return <ClipboardList className="h-4 w-4 text-orange-500" />
      case 'file':
        return <FileText className="h-4 w-4 text-blue-500" />
      case 'link':
        return <LinkIcon className="h-4 w-4 text-purple-500" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Resources</CardTitle>
            <CardDescription>
              Homework, files, and links for {clientName}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => openDialog('file')}>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
            <Button size="sm" variant="outline" onClick={() => openDialog('link')}>
              <LinkIcon className="h-4 w-4 mr-2" />
              Add Link
            </Button>
            <Button size="sm" onClick={() => openDialog('homework')}>
              <ClipboardList className="h-4 w-4 mr-2" />
              Assign Homework
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : resources.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No resources shared yet</p>
            <p className="text-sm">Add homework or links for this client</p>
          </div>
        ) : (
          <div className="space-y-3">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getResourceIcon(resource.resource_type)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{resource.title}</p>
                      {resource.is_completed && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Done
                        </Badge>
                      )}
                    </div>
                    {resource.description && (
                      <p className="text-sm text-gray-500">{resource.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>{formatDate(resource.created_at)}</span>
                      {resource.due_date && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Due {formatDate(resource.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={deletingId === resource.id}>
                      {deletingId === resource.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreVertical className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {resource.resource_type === 'link' && (
                      <DropdownMenuItem onClick={() => window.open(resource.content, '_blank')}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Link
                      </DropdownMenuItem>
                    )}
                    {resource.resource_type === 'file' && (
                      <DropdownMenuItem onClick={() => handleDownload(resource)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDelete(resource)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Resource Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'homework' ? 'Assign Homework' : dialogType === 'file' ? 'Upload File' : 'Add Link'}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'homework'
                ? `Create a homework assignment for ${clientName}`
                : dialogType === 'file'
                  ? `Upload a file to share with ${clientName}`
                  : `Add a resource link for ${clientName}`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder={
                  dialogType === 'homework'
                    ? 'e.g., Practice breathing exercises'
                    : dialogType === 'file'
                      ? 'e.g., Session recording'
                      : 'e.g., Guided meditation video'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="Brief description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {dialogType === 'file' ? (
              <div key="file-input" className="space-y-2">
                <Label htmlFor="file">File *</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.mp3,.wav,.mp4,.doc,.docx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  required
                />
                <p className="text-xs text-gray-500">
                  Supported: PDF, images, audio, video, Word docs (max 10MB)
                </p>
                {selectedFile && (
                  <p className="text-sm text-blue-600">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            ) : (
              <div key="content-input" className="space-y-2">
                <Label htmlFor="content">
                  {dialogType === 'homework' ? 'Assignment Details *' : 'URL *'}
                </Label>
                {dialogType === 'homework' ? (
                  <Textarea
                    key="homework-textarea"
                    id="content"
                    placeholder="Describe the homework assignment..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    required
                  />
                ) : (
                  <Input
                    key="url-input"
                    id="content"
                    type="url"
                    placeholder="https://..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                  />
                )}
              </div>
            )}

            {dialogType === 'homework' && (
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date (optional)</Label>
                <Input
                  id="dueDate"
                  type="date"
                  min={today}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {dialogType === 'file' ? 'Uploading...' : 'Saving...'}
                  </>
                ) : dialogType === 'homework' ? (
                  'Assign Homework'
                ) : dialogType === 'file' ? (
                  'Upload File'
                ) : (
                  'Add Link'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog {...confirmDialogProps} />
    </Card>
  )
}
