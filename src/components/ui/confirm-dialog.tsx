'use client'

import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'destructive' | 'default'
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Hook for managing a confirm dialog state.
 * Returns [dialogProps, openConfirm] where openConfirm triggers the dialog
 * and resolves when user confirms/cancels.
 */
export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean
    title: string
    description: string
    confirmLabel: string
    variant: 'destructive' | 'default'
    onConfirm: () => void
  }>({
    open: false,
    title: '',
    description: '',
    confirmLabel: 'Confirm',
    variant: 'destructive',
    onConfirm: () => {},
  })

  const confirm = useCallback(
    (opts: {
      title: string
      description: string
      confirmLabel?: string
      variant?: 'destructive' | 'default'
      onConfirm: () => void
    }) => {
      setState({
        open: true,
        title: opts.title,
        description: opts.description,
        confirmLabel: opts.confirmLabel || 'Confirm',
        variant: opts.variant || 'destructive',
        onConfirm: opts.onConfirm,
      })
    },
    []
  )

  const dialogProps = {
    open: state.open,
    onOpenChange: (open: boolean) => setState(prev => ({ ...prev, open })),
    title: state.title,
    description: state.description,
    confirmLabel: state.confirmLabel,
    variant: state.variant as 'destructive' | 'default',
    onConfirm: state.onConfirm,
  }

  return { dialogProps, confirm }
}
