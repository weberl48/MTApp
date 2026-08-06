'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import ReactMarkdown, { Components } from 'react-markdown'
import { Search, BookOpen, Users, Calendar, FileText, Settings, ChevronRight, PlayCircle, UserCog, BarChart2, ArrowRight, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useOrganization } from '@/contexts/organization-context'
import { useWalkthrough, useWalkthroughAudienceFlags } from '@/components/walkthroughs/walkthrough-provider'
import { canStartWalkthrough } from '@/components/walkthroughs/walkthroughs'
import { HelpGapsCard } from '@/components/help/help-gaps-card'
import { GuidedToursCard } from '@/components/help/guided-tours-card'
import { AiChat, useAiHelpVisible } from '@/components/help/ai-chat'
import { createSearchMissGate, logSearchMiss } from '@/lib/help/events'
import {
  HELP_ARTICLES,
  HELP_CATEGORIES,
  HELP_FAQS,
  searchArticlesRanked,
  searchFaqs,
  getArticlesByCategory,
  type HelpCategory,
  type HelpFaq,
  type SearchResult,
} from './_data/help-articles'

// One gate per browser session: each missed query is logged at most once.
const searchMissGate = createSearchMissGate()

const faqMarkdownComponents: Components = {
  p: ({ children }) => <p className="text-sm text-muted-foreground leading-6 mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
  ul: ({ children }) => <ul className="list-disc list-outside ml-5 mb-2 space-y-1 text-sm text-muted-foreground">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-outside ml-5 mb-2 space-y-1 text-sm text-muted-foreground">{children}</ol>,
  li: ({ children }) => <li className="leading-6">{children}</li>,
}

/** One FAQ rendered inside an accordion item: answer + optional deep link. */
function FaqAnswer({ faq }: { faq: HelpFaq }) {
  return (
    <div className="space-y-2">
      <ReactMarkdown components={faqMarkdownComponents}>{faq.answer.trim()}</ReactMarkdown>
      {faq.articleSlug && (
        <Link
          href={`/help/${faq.articleSlug}/`}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Read more
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  )
}

/** Highlight matched terms in text using <mark> tags. */
function HighlightedText({ text, terms }: { text: string; terms: string[] }) {
  if (terms.length === 0) return <>{text}</>

  const escaped = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi')
  const parts = text.split(regex)

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-warning-soft text-inherit rounded px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

const CATEGORY_ICONS: Record<HelpCategory, React.ComponentType<{ className?: string }>> = {
  'getting-started': BookOpen,
  'clients': Users,
  'sessions': Calendar,
  'invoices': FileText,
  'team': UserCog,
  'analytics': BarChart2,
  'settings': Settings,
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory | null>(null)
  const [showAllFaqs, setShowAllFaqs] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const aiVisible = useAiHelpVisible()
  const { can, organization, user } = useOrganization()
  const { startWalkthrough } = useWalkthrough()
  const audienceFlags = useWalkthroughAudienceFlags()

  const isAdminOrAbove = can('session:view-all')

  // Filter articles based on user role
  const accessibleArticles = useMemo(() => {
    return HELP_ARTICLES.filter(article => !article.adminOnly || isAdminOrAbove)
  }, [isAdminOrAbove])

  const accessibleFaqs = useMemo(() => {
    return HELP_FAQS.filter(faq => !faq.adminOnly || isAdminOrAbove)
  }, [isAdminOrAbove])

  // Get filtered articles based on search and category
  const searchResults = useMemo((): SearchResult[] | null => {
    if (!searchQuery.trim()) return null
    return searchArticlesRanked(searchQuery)
      .filter(r => accessibleArticles.includes(r.article))
  }, [searchQuery, accessibleArticles])

  const faqResults = useMemo(() => {
    if (!searchQuery.trim()) return null
    return searchFaqs(searchQuery).filter(r => accessibleFaqs.includes(r.faq))
  }, [searchQuery, accessibleFaqs])

  // Gap detection: a query that still finds nothing 1.5s after typing stops
  // is logged once per session. Fire-and-forget; failures are invisible.
  useEffect(() => {
    const q = searchQuery.trim()
    if (q.length < 3 || !organization || !user) return
    if ((searchResults?.length ?? 0) > 0 || (faqResults?.length ?? 0) > 0) return
    const t = setTimeout(() => {
      if (searchMissGate(q)) logSearchMiss(organization.id, user.id, q)
    }, 1500)
    return () => clearTimeout(t)
  }, [searchQuery, searchResults, faqResults, organization, user])

  const filteredArticles = useMemo(() => {
    if (searchResults) return searchResults.map(r => r.article)
    if (selectedCategory) return getArticlesByCategory(selectedCategory).filter(a => accessibleArticles.includes(a))
    return accessibleArticles
  }, [searchResults, selectedCategory, accessibleArticles])

  // Map for quick lookup of search result data by slug
  const searchResultMap = useMemo(() => {
    if (!searchResults) return null
    const map = new Map<string, SearchResult>()
    for (const r of searchResults) map.set(r.article.slug, r)
    return map
  }, [searchResults])

  // Get categories with article counts
  const categoriesWithCounts = useMemo(() => {
    return HELP_CATEGORIES.map(cat => ({
      ...cat,
      count: accessibleArticles.filter(a => a.category === cat.id).length,
    })).filter(cat => cat.count > 0)
  }, [accessibleArticles])

  const showingAllArticles = !searchQuery && !selectedCategory

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Help Center</h1>
        <p className="text-muted-foreground mt-1">
          Learn how to use MCA Manager with guides and tutorials
        </p>
      </div>

      {/* Ask the AI helper */}
      {aiVisible && (
        <Card className="border-primary/30">
          <CardContent className="py-4">
            {!aiOpen ? (
              <button
                type="button"
                onClick={() => setAiOpen(true)}
                aria-label="Ask the AI helper — get an answer instead of searching"
                className="flex w-full items-center gap-2 rounded-md border bg-muted px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/80"
              >
                <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                Ask a question about the app…
              </button>
            ) : (
              <div className="h-96">
                <AiChat />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search help articles..."
          aria-label="Search help articles"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setSelectedCategory(null)
          }}
          className="pl-10"
        />
      </div>

      {/* Category Filter — chips are the in-category switcher (jump between
          categories without backing out to the grid), not a second copy of
          the Category Cards below. Cards already cover the "browse all"
          moment, so the chip row only renders once a category is selected. */}
      {!searchQuery && selectedCategory && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categoriesWithCounts.map(cat => {
            const Icon = CATEGORY_ICONS[cat.id]
            return (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className="gap-1.5"
              >
                <Icon className="h-4 w-4" />
                {cat.name}
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {cat.count}
                </Badge>
              </Button>
            )
          })}
        </div>
      )}

      {/* Results Header */}
      {(searchQuery || selectedCategory) && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} found
            {searchQuery && ` for "${searchQuery}"`}
            {selectedCategory && ` in ${HELP_CATEGORIES.find(c => c.id === selectedCategory)?.name}`}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory(null)
            }}
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* Category Cards (when showing all) */}
      {showingAllArticles && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categoriesWithCounts.map(cat => {
            const Icon = CATEGORY_ICONS[cat.id]
            return (
              <Card
                key={cat.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedCategory(cat.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{cat.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{cat.description}</CardDescription>
                  <p className="text-sm text-muted-foreground mt-2">
                    {cat.count} article{cat.count !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Guided tours (when showing all) */}
      {showingAllArticles && <GuidedToursCard />}

      {/* Inline FAQ answers (search) */}
      {searchQuery && faqResults && faqResults.length > 0 && (
        <div className="space-y-3">
          {faqResults.slice(0, 3).map(({ faq }) => (
            <Card key={faq.id} className="border-primary/30">
              <CardContent className="py-4 space-y-2">
                <h3 className="font-medium text-foreground">{faq.question}</h3>
                <FaqAnswer faq={faq} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Article List */}
      {(!showingAllArticles || searchQuery) && (
        <div className="space-y-3">
          {filteredArticles.length === 0 && (faqResults?.length ?? 0) === 0 ? (
            <Card>
              <CardContent className="py-8 text-center space-y-4">
                <div>
                  <p className="text-muted-foreground">No articles found matching your search.</p>
                  <p className="text-sm text-muted-foreground mt-1">Try different keywords or browse by category.</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {categoriesWithCounts.map(cat => {
                    const Icon = CATEGORY_ICONS[cat.id]
                    return (
                      <Button
                        key={cat.id}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('')
                          setSelectedCategory(cat.id)
                        }}
                        className="gap-1.5"
                      >
                        <Icon className="h-4 w-4" />
                        {cat.name}
                      </Button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredArticles.map(article => {
              const result = searchResultMap?.get(article.slug)
              return (
                <Card key={article.slug} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <Link href={`/help/${article.slug}/`} className="group">
                          <h3 className="font-medium text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                            {article.title}
                            <ChevronRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {article.description}
                        </p>
                        {result && (
                          <p className="text-sm text-muted-foreground mt-1.5 italic line-clamp-2">
                            &ldquo;<HighlightedText text={result.excerpt} terms={result.matchTerms} />&rdquo;
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {HELP_CATEGORIES.find(c => c.id === article.category)?.name}
                          </Badge>
                          {article.adminOnly && (
                            <Badge variant="secondary" className="text-xs">
                              Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                      {canStartWalkthrough(article.walkthrough, audienceFlags, organization?.settings) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            startWalkthrough(article.walkthrough!)
                          }}
                          className="gap-1.5 shrink-0"
                        >
                          <PlayCircle className="h-4 w-4" />
                          <span className="hidden sm:inline">Walkthrough</span>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Common Questions (when showing categories) */}
      {showingAllArticles && !searchQuery && accessibleFaqs.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Common Questions</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowAllFaqs(v => !v)}>
              {showAllFaqs ? 'Show fewer' : 'View all questions'}
            </Button>
          </div>
          {!showAllFaqs ? (
            <Accordion type="single" collapsible className="rounded-lg border px-4">
              {accessibleFaqs.slice(0, 8).map(faq => (
                <AccordionItem key={faq.id} value={faq.id} className="last:border-b-0">
                  <AccordionTrigger className="text-left text-sm font-medium">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <FaqAnswer faq={faq} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="space-y-6">
              {HELP_CATEGORIES.map(cat => {
                const faqs = accessibleFaqs.filter(f => f.category === cat.id)
                if (faqs.length === 0) return null
                return (
                  <div key={cat.id}>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      {cat.name}
                    </h3>
                    <Accordion type="single" collapsible className="rounded-lg border px-4">
                      {faqs.map(faq => (
                        <AccordionItem key={faq.id} value={faq.id} className="last:border-b-0">
                          <AccordionTrigger className="text-left text-sm font-medium">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent>
                            <FaqAnswer faq={faq} />
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Owner-only worklist of content gaps */}
      <HelpGapsCard />
    </div>
  )
}
