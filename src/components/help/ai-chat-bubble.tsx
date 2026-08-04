'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { AiChat, useAiHelpVisible } from '@/components/help/ai-chat'

/** Floating "Ask the AI helper" bubble. Top slot of the mobile fixed-element
 *  stack: quick-log FAB (bottom-6, spans to 80px) → owner-onboarding prompt
 *  (bottom-20, spans to 128px, owner-only until dismissed) → this bubble
 *  (bottom-32, spans to 176px). The three never overlap; the dashboard main
 *  content's bottom padding is sized to clear the full stack (see
 *  (dashboard)/layout.tsx). Desktop (lg:bottom-20) is unchanged: the FAB is
 *  lg:hidden there, so only the onboarding prompt (lg:bottom-6) sits below
 *  the bubble, with headroom. */
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
          className="fixed bottom-32 right-6 lg:bottom-20 z-40 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-shadow"
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
