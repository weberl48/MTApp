import Link from 'next/link'
import { HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** A small "?" next to a page title linking to that page's help article. */
export function PageHelp({ article }: { article: string }) {
  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover:text-foreground"
    >
      <Link href={`/help/${article}/`} aria-label="Help for this page">
        <HelpCircle className="h-4 w-4" />
      </Link>
    </Button>
  )
}
