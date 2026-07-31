import type { HelpArticle, HelpFaq } from './types'
import { HELP_ARTICLES } from './articles'
import { HELP_FAQS } from './faqs'

export type SearchResult = {
  article: HelpArticle
  score: number
  excerpt: string
  matchTerms: string[]
}

export type FaqSearchResult = {
  faq: HelpFaq
  score: number
}

/** Owner-phrasing → help-vocabulary bridges. Keys and values are lowercase. */
export const SYNONYMS: Record<string, string[]> = {
  bill: ['invoice'], billing: ['invoice'], bills: ['invoice'],
  pay: ['earnings', 'payroll'], paycheck: ['earnings'], paystub: ['earnings'], stub: ['earnings'],
  price: ['pricing', 'rate'], cost: ['pricing', 'rate'], charge: ['pricing', 'rate', 'fee'],
  '2fa': ['mfa'], 'two-factor': ['mfa'], authenticator: ['mfa'],
  cancel: ['cancellation', 'cancelled'], cancelling: ['cancellation'],
  therapist: ['contractor'], staff: ['contractor', 'team'],
  customer: ['client'], patient: ['client'], student: ['client'], kid: ['client'],
  money: ['earnings', 'payroll'], paid: ['payment', 'payroll'],
  reminder: ['reminders'], overdue: ['due'],
  login: ['sign in', 'password'], phone: ['mobile', 'install'],
  tour: ['walkthrough'], tours: ['walkthrough'], tutorial: ['walkthrough', 'guided tour'],
  // Owners and contractors call the session-location field many different things.
  room: ['classroom', 'location'], rooms: ['classroom', 'location'],
  site: ['location', 'classroom'], sites: ['location', 'classroom'],
  location: ['classroom'], locations: ['classroom'],
  place: ['location', 'classroom'], venue: ['location', 'classroom'],
  building: ['location', 'classroom'], facility: ['location', 'classroom'],
  dayhab: ['location', 'classroom'], 'day-hab': ['location', 'classroom'],
  school: ['classroom', 'location'], schools: ['classroom', 'location'],
}

/** Words that carry question structure but no search meaning. */
export const QUESTION_STOPWORDS = new Set([
  'how', 'do', 'does', 'did', 'i', 'we', 'you', 'a', 'an', 'the', 'is', 'are',
  'was', 'were', 'my', 'to', 'can', 'cant', "can't", 'where', 'why', 'what',
  'when', 'who', 'which', 'if', 'of', 'for', 'in', 'on', 'at', 'it', 'this',
  'that', 'be', 'get', 'gets', 'didnt', "didn't", 'wont', "won't", 'not', 'me',
])

/** Tokenize, drop question stopwords, expand synonyms.
 *  Returns one group per surviving term: [term, ...synonyms]. */
export function expandTerms(query: string): string[][] {
  const raw = query.toLowerCase().split(/\s+/).filter(t => t.length > 0)
  if (raw.length === 0) return []
  const terms = raw.filter(t => !QUESTION_STOPWORDS.has(t))
  // pure-stopword queries ("how do i") carry no searchable meaning
  if (terms.length === 0) return []
  return terms.map(t => [t, ...(SYNONYMS[t] ?? [])])
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

/** Ranked search: keyword/synonym/question-phrasing aware, with excerpts. */
export function searchArticlesRanked(query: string): SearchResult[] {
  const groups = expandTerms(query)
  if (groups.length === 0) return []

  const results: SearchResult[] = []

  for (const article of HELP_ARTICLES) {
    const titleLower = article.title.toLowerCase()
    const descLower = article.description.toLowerCase()
    const contentLower = article.content.toLowerCase()
    const keywordsLower = (article.keywords ?? []).map(k => k.toLowerCase())

    let score = 0
    let matchedGroups = 0
    const matchedTerms: string[] = []

    for (const group of groups) {
      let groupMatched = false

      for (const variant of group) {
        let variantMatched = false

        if (keywordsLower.some(k => k.includes(variant))) {
          score += 6
          variantMatched = true
        }
        if (titleLower.includes(variant)) {
          score += titleLower === variant ? 10 : 5
          variantMatched = true
        }
        if (descLower.includes(variant)) {
          score += 3
          variantMatched = true
        }
        if (contentLower.includes(variant)) {
          score += 1
          variantMatched = true
        }

        if (variantMatched) {
          matchedTerms.push(variant)
          groupMatched = true
        }
      }

      if (groupMatched) matchedGroups++
    }

    // Bonus: every meaning-carrying term matched (directly or via synonym)
    if (matchedGroups === groups.length && groups.length > 1) {
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

/** Rank FAQs for a query; question text weighs more than the answer. */
export function searchFaqs(query: string): FaqSearchResult[] {
  const groups = expandTerms(query)
  if (groups.length === 0) return []

  const results: FaqSearchResult[] = []
  for (const faq of HELP_FAQS) {
    const q = faq.question.toLowerCase()
    const a = faq.answer.toLowerCase()
    let score = 0
    for (const group of groups) {
      for (const variant of group) {
        if (q.includes(variant)) score += 5
        else if (a.includes(variant)) score += 2
      }
    }
    if (score > 0) results.push({ faq, score })
  }
  return results.sort((a, b) => b.score - a.score)
}

/** Simple search (backwards-compatible). */
export function searchArticles(query: string): HelpArticle[] {
  return searchArticlesRanked(query).map(r => r.article)
}

