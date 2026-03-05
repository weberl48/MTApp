'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, BookOpen, Users, Calendar, FileText, Settings, ChevronRight, PlayCircle, UserCog, BarChart2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useOrganization } from '@/contexts/organization-context'
import { useWalkthrough } from '@/components/walkthroughs/walkthrough-provider'
import {
  HELP_ARTICLES,
  HELP_CATEGORIES,
  searchArticlesRanked,
  getArticlesByCategory,
  type HelpCategory,
  type SearchResult,
} from './_data/help-articles'

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
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800/60 text-inherit rounded px-0.5">{part}</mark>
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
  const { can } = useOrganization()
  const { startWalkthrough } = useWalkthrough()

  const isAdminOrAbove = can('session:view-all')

  // Filter articles based on user role
  const accessibleArticles = useMemo(() => {
    return HELP_ARTICLES.filter(article => !article.adminOnly || isAdminOrAbove)
  }, [isAdminOrAbove])

  // Get filtered articles based on search and category
  const searchResults = useMemo((): SearchResult[] | null => {
    if (!searchQuery.trim()) return null
    return searchArticlesRanked(searchQuery)
      .filter(r => accessibleArticles.includes(r.article))
  }, [searchQuery, accessibleArticles])

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Help Center</h1>
        <p className="text-muted-foreground mt-1">
          Learn how to use MCA Manager with guides and tutorials
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search help articles..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setSelectedCategory(null)
          }}
          className="pl-10"
        />
      </div>

      {/* Category Filter */}
      {!searchQuery && (
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

      {/* Article List */}
      {(!showingAllArticles || searchQuery) && (
        <div className="space-y-3">
          {filteredArticles.length === 0 ? (
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
                      {article.walkthrough && (
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

      {/* Popular Articles (when showing categories) */}
      {showingAllArticles && !searchQuery && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Popular Articles</h2>
          <div className="space-y-3">
            {accessibleArticles.slice(0, 5).map(article => (
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
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {article.description}
                      </p>
                    </div>
                    {article.walkthrough && (
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
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
