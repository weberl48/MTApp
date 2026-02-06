'use client'

import { use } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown, { Components } from 'react-markdown'
import { ArrowLeft, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useOrganization } from '@/contexts/organization-context'
import { useWalkthrough } from '@/components/walkthroughs/walkthrough-provider'
import { getArticleBySlug, getArticlesByCategory, HELP_CATEGORIES } from '../_data/help-articles'

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold text-foreground mt-8 mb-4 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-semibold text-foreground mt-8 mb-4 pb-2 border-b">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-muted-foreground leading-7 mb-4">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-outside ml-6 mb-4 space-y-2 text-muted-foreground">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside ml-6 mb-4 space-y-2 text-muted-foreground">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-7">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  code: ({ children }) => (
    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
  ),
  hr: () => (
    <hr className="my-8 border-border" />
  ),
}

export default function HelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const { can } = useOrganization()
  const { startWalkthrough } = useWalkthrough()

  const isAdminOrAbove = can('session:view-all')

  const article = getArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  // Check if user has access to this article
  if (article.adminOnly && !isAdminOrAbove) {
    notFound()
  }

  // Get related articles
  const relatedArticles = article.relatedArticles
    ?.map(slug => getArticleBySlug(slug))
    .filter((a): a is NonNullable<typeof a> => a != null && (!a.adminOnly || isAdminOrAbove))

  // Get other articles in the same category
  const categoryArticles = getArticlesByCategory(article.category)
    .filter(a => a.slug !== article.slug && (!a.adminOnly || isAdminOrAbove))
    .slice(0, 3)

  const categoryName = HELP_CATEGORIES.find(c => c.id === article.category)?.name

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/help"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Help Center
      </Link>

      {/* Article Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{categoryName}</Badge>
          {article.adminOnly && <Badge variant="secondary">Admin</Badge>}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {article.title}
        </h1>
        <p className="text-lg text-muted-foreground">{article.description}</p>

        {/* Walkthrough Button */}
        {article.walkthrough && (
          <Button
            onClick={() => startWalkthrough(article.walkthrough!)}
            className="gap-2"
          >
            <PlayCircle className="h-4 w-4" />
            Start Interactive Walkthrough
          </Button>
        )}
      </div>

      {/* Article Content */}
      <Card>
        <CardContent className="py-6 px-6">
          <article>
            <ReactMarkdown components={markdownComponents}>
              {article.content.trim()}
            </ReactMarkdown>
          </article>
        </CardContent>
      </Card>

      {/* Related Articles */}
      {relatedArticles && relatedArticles.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Related Articles</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {relatedArticles.map(related => (
              <Link key={related.slug} href={`/help/${related.slug}`}>
                <Card className="h-full hover:bg-muted/50 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{related.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-2">
                      {related.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* More in this Category */}
      {categoryArticles.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">More in {categoryName}</h2>
          <div className="space-y-2">
            {categoryArticles.map(catArticle => (
              <Link
                key={catArticle.slug}
                href={`/help/${catArticle.slug}`}
                className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <h3 className="font-medium">{catArticle.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                  {catArticle.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
