import type { HelpArticle } from './types'
import { HELP_ARTICLES } from './articles'

export type SearchResult = {
  article: HelpArticle
  score: number
  excerpt: string
  matchTerms: string[]
}

/** Strip markdown formatting for plain-text search and excerpts. */
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, '')       // headings
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1') // bold/italic
    .replace(/`([^`]+)`/g, '$1')     // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/^[-*]\s+/gm, '')       // list markers
    .replace(/^\d+\.\s+/gm, '')      // numbered list markers
    .replace(/\n{2,}/g, ' ')         // collapse blank lines
    .replace(/\n/g, ' ')             // newlines to spaces
    .trim()
}

/** Build excerpt (~150 chars) around the first match in content. */
function buildExcerpt(content: string, terms: string[]): string {
  const plain = stripMarkdown(content)
  const lower = plain.toLowerCase()

  // Find earliest match position
  let earliest = -1
  for (const term of terms) {
    const idx = lower.indexOf(term.toLowerCase())
    if (idx !== -1 && (earliest === -1 || idx < earliest)) {
      earliest = idx
    }
  }

  if (earliest === -1) return plain.slice(0, 150).trim() + '...'

  // Center the excerpt around the match
  const start = Math.max(0, earliest - 60)
  const end = Math.min(plain.length, earliest + 90)
  let excerpt = plain.slice(start, end).trim()

  if (start > 0) excerpt = '...' + excerpt
  if (end < plain.length) excerpt = excerpt + '...'

  return excerpt
}

/** Ranked search with scoring, fuzzy partial matching, and excerpts. */
export function searchArticlesRanked(query: string): SearchResult[] {
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0)
  if (terms.length === 0) return []

  const results: SearchResult[] = []

  for (const article of HELP_ARTICLES) {
    const titleLower = article.title.toLowerCase()
    const descLower = article.description.toLowerCase()
    const contentLower = article.content.toLowerCase()

    let score = 0
    const matchedTerms: string[] = []

    for (const term of terms) {
      let termMatched = false

      // Title scoring
      if (titleLower.includes(term)) {
        score += titleLower === term ? 10 : 5
        termMatched = true
      }

      // Description scoring
      if (descLower.includes(term)) {
        score += 3
        termMatched = true
      }

      // Content scoring
      if (contentLower.includes(term)) {
        score += 1
        termMatched = true
      }

      if (termMatched) {
        matchedTerms.push(term)
      }
    }

    // Bonus: all query terms matched
    if (matchedTerms.length === terms.length && terms.length > 1) {
      score += 3
    }

    if (score > 0) {
      results.push({
        article,
        score,
        excerpt: buildExcerpt(article.content, matchedTerms),
        matchTerms: matchedTerms,
      })
    }
  }

  return results.sort((a, b) => b.score - a.score)
}

/** Simple search (backwards-compatible). */
export function searchArticles(query: string): HelpArticle[] {
  return searchArticlesRanked(query).map(r => r.article)
}

