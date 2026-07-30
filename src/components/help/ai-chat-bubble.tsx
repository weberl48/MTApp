'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { AiChat, useAiHelpVisible } from '@/components/help/ai-chat'

/** Floating "Ask the AI helper" bubble. bottom-24 on mobile clears the
 *  QuickSessionFab at bottom-6; on lg the FAB is hidden so we drop to bottom-6. */
export function AiChatBubble() {
  const visible = useAiHelpVisible()
  const [open, setOpen] = useState(false)

  if (!visible) return null

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          aria-label="Ask the AI helper"
          className="fixed bottom-24 right-6 lg:bottom-6 z-40 h-12 w-12 rounded-full shadow-lg hover:shadow-xl"
        >
          <Sparkles className="h-5 w-5" />
        </Button>
      </SheetTrigger>
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
