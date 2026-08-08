'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import ReactMarkdown, { Components } from 'react-markdown'
import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useOrganization } from '@/contexts/organization-context'
import { isFeatureEnabled } from '@/lib/features'
import { extractSources } from '@/lib/help/citations'
import { isAnswerComplete, parseHelpStream } from '@/lib/help/stream'
import { getArticleBySlug } from '@/app/(dashboard)/help/_data/help-articles'

type ChatMessage = { role: 'user' | 'assistant'; content: string; incomplete?: boolean }

// Key presence never changes within a session — probe once per page load.
let configuredCache: boolean | null = null

/** Flag + server-configured gate shared by the help-page panel and the bubble. */
export function useAiHelpVisible(): boolean {
  const { organization } = useOrganization()
  const [configured, setConfigured] = useState(configuredCache ?? false)

  useEffect(() => {
    if (configuredCache !== null) return
    fetch('/api/help/chat/')
      .then(r => r.json())
      .then(d => {
        configuredCache = !!d.configured
        setConfigured(configuredCache)
      })
      .catch(() => {
        configuredCache = false
      })
  }, [])

  return configured && isFeatureEnabled(organization?.settings, 'ai_help')
}

const aiMarkdown: Components = {
  p: ({ children }) => <p className="text-sm leading-6 mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
  ul: ({ children }) => <ul className="list-disc list-outside ml-5 mb-2 space-y-1 text-sm">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-outside ml-5 mb-2 space-y-1 text-sm">{children}</ol>,
  li: ({ children }) => <li className="leading-6">{children}</li>,
}

function AssistantMessage({ content, incomplete }: { content: string; incomplete?: boolean }) {
  const { text, slugs } = extractSources(content)
  const articles = slugs.map(getArticleBySlug).filter(a => a != null)
  return (
    <div>
      <ReactMarkdown components={aiMarkdown}>{text}</ReactMarkdown>
      {incomplete && (
        <p className="mt-2 text-xs text-muted-foreground">
          This answer stopped early. Try asking about one thing at a time.
        </p>
      )}
      {articles.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {articles.map(a => (
            <Link
              key={a.slug}
              href={`/help/${a.slug}/`}
              className="text-xs text-primary hover:underline border rounded-full px-2 py-0.5"
            >
              {a.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function AiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  const send = async () => {
    const question = input.trim()
    if (!question || busy) return
    setError(null)
    setInput('')
    // Cap history at 20 messages (drop the oldest exchanges first)
    const history = [...messages, { role: 'user' as const, content: question }].slice(-19)
    setMessages([...history, { role: 'assistant', content: '' }])
    setBusy(true)
    try {
      const res = await fetch('/api/help/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })
      if (!res.ok || !res.body) {
        setMessages(history)
        setError(
          res.status === 429
            ? "You've asked a lot of questions this hour — try again in a bit."
            : res.status === 503
              ? 'The AI helper is not configured yet.'
              : 'Something went wrong — try again.'
        )
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      let buffer = ''
      let sawDone = false
      let truncated = false
      let failed = false
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parsed = parseHelpStream(buffer)
        buffer = parsed.rest
        for (const event of parsed.events) {
          if (event.type === 'text') acc += event.text
          else if (event.type === 'truncated') truncated = true
          else if (event.type === 'done') sawDone = true
          else if (event.type === 'error') failed = true
        }
        setMessages([...history, { role: 'assistant', content: acc }])
      }
      if (failed) setError('The answer was interrupted — try again.')
      if (!acc) setMessages(history)
      // A cut-off answer stays on screen — it is usually still useful — but it
      // is labelled, so a mid-sentence stop never reads as a finished answer.
      else if (!isAnswerComplete({ sawDone, truncated })) {
        setMessages([...history, { role: 'assistant', content: acc, incomplete: true }])
      }
    } catch {
      setMessages(prev => (prev[prev.length - 1]?.content === '' ? prev.slice(0, -1) : prev))
      setError('Something went wrong — try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Ask how anything in MCA Manager works — pricing, invoices, payroll, settings. Answers
            come from the app&apos;s documentation and link to the full articles.
          </p>
        )}
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="ml-8 rounded-lg bg-primary/10 px-3 py-2 text-sm">
              {m.content}
            </div>
          ) : (
            <div key={i} className="mr-4 rounded-lg border px-3 py-2">
              {m.content === '' && busy ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <AssistantMessage content={m.content} incomplete={m.incomplete} />
              )}
            </div>
          )
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <form
        className="mt-3 space-y-1"
        onSubmit={e => {
          e.preventDefault()
          send()
        }}
      >
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask how something works…"
            maxLength={2000}
            disabled={busy}
          />
          <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label="Send question">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Don&apos;t include client names or health details.</p>
      </form>
    </div>
  )
}
