import type { HelpArticle, HelpCategory } from '../types'
import { GETTING_STARTED_ARTICLES } from './getting-started'
import { CLIENTS_ARTICLES } from './clients'
import { SESSIONS_ARTICLES } from './sessions'
import { INVOICES_ARTICLES } from './invoices'
import { TEAM_ARTICLES } from './team'
import { ANALYTICS_ARTICLES } from './analytics'
import { SETTINGS_ARTICLES } from './settings'

export const HELP_ARTICLES: HelpArticle[] = [
  ...GETTING_STARTED_ARTICLES,
  ...CLIENTS_ARTICLES,
  ...SESSIONS_ARTICLES,
  ...INVOICES_ARTICLES,
  ...TEAM_ARTICLES,
  ...ANALYTICS_ARTICLES,
  ...SETTINGS_ARTICLES,
]

export function getArticleBySlug(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find(article => article.slug === slug)
}

export function getArticlesByCategory(category: HelpCategory): HelpArticle[] {
  return HELP_ARTICLES.filter(article => article.category === category)
}
