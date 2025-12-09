'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

interface LogoUploadProps {
  organizationId: string
  currentLogoUrl: string | null
  onUploadComplete: (url: string | null) => void
}

export function LogoUpload({ organizationId, currentLogoUrl, onUploadComplete }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentLogoUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, WebP, or SVG)')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    // Show preview immediately
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to Supabase Storage
    setUploading(true)
    try {
      const supabase = createClient()

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `logo.${fileExt}`
      const filePath = `${organizationId}/${fileName}`

      // Delete existing logo if present
      if (currentLogoUrl) {
        const oldPath = currentLogoUrl.split('/').slice(-2).join('/')
        await supabase.storage.from('organization-assets').remove([oldPath])
      }

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from('organization-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('organization-assets')
        .getPublicUrl(filePath)

      // Add cache buster to URL
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`

      onUploadComplete(urlWithCacheBuster)
      toast.success('Logo uploaded successfully')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload logo')
      setPreview(currentLogoUrl)
    } finally {
      setUploading(false)
    }
  }, [organizationId, currentLogoUrl, onUploadComplete])

  const handleRemove = useCallback(async () => {
    if (!currentLogoUrl) return

    setUploading(true)
    try {
      const supabase = createClient()

      // Extract path from URL
      const urlPath = new URL(currentLogoUrl).pathname
      const storagePath = urlPath.split('/organization-assets/')[1]?.split('?')[0]

      if (storagePath) {
        await supabase.storage.from('organization-assets').remove([storagePath])
      }

      setPreview(null)
      onUploadComplete(null)
      toast.success('Logo removed')
    } catch (error) {
      console.error('Remove error:', error)
      toast.error('Failed to remove logo')
    } finally {
      setUploading(false)
    }
  }, [currentLogoUrl, onUploadComplete])

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-6">
        {/* Logo Preview */}
        <div className="relative w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-900 overflow-hidden">
          {preview ? (
            <>
              <img
                src={preview}
                alt="Organization logo"
                className="w-full h-full object-contain"
              />
              {!uploading && (
                <button
                  onClick={handleRemove}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  aria-label="Remove logo"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <div className="text-center text-gray-400">
              <ImageIcon className="w-8 h-8 mx-auto mb-1" />
              <span className="text-xs">No logo</span>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1 space-y-2">
          <h4 className="font-medium text-sm">Organization Logo</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Upload your practice logo. This will appear on invoices and emails.
            Recommended size: 512x512px. Max 5MB.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {preview ? 'Change Logo' : 'Upload Logo'}
            </Button>
            {preview && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={uploading}
              >
                Remove
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
    </div>
  )
}
