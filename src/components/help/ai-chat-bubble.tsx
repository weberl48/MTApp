'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { AiChat, useAiHelpVisible } from '@/components/help/ai-chat'

/**
 * The AI chat panel itself, shared by two triggers: the desktop bubble below
 * and the mobile More sheet's "Ask the AI helper" row. Each caller owns its
 * own open state, so the two triggers are two independent Sheet instances —
 * that's fine, only one is ever reachable at a given viewport width.
 */
export function AiChatSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Ask the AI helper</SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0 pt-2">
          <AiChat />
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** Floating "Ask the AI helper" bubble — desktop only (`lg:flex`); below `lg`
 *  the tab bar's More sheet offers the same panel via an "Ask the AI helper"
 *  row instead, so the bubble no longer competes for bottom-right space with
 *  the tab bar. Top slot of the desktop fixed-element stack: owner-onboarding
 *  prompt (lg:bottom-6) sits below this bubble (lg:bottom-20), with headroom. */
export function AiChatBubble() {
  const visible = useAiHelpVisible()
  const [open, setOpen] = useState(false)

  if (!visible) return null

  return (
    <>
      <Button
        size="icon"
        aria-label="Ask the AI helper"
        onClick={() => setOpen(true)}
        className="hidden lg:flex fixed bottom-20 right-6 z-40 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-shadow"
      >
        <Sparkles className="h-5 w-5" />
      </Button>
      <AiChatSheet open={open} onOpenChange={setOpen} />
    </>
  )
}
