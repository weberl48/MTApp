export type HelpCategory =
  | 'getting-started'
  | 'clients'
  | 'sessions'
  | 'invoices'
  | 'settings'
  | 'team'
  | 'analytics'

export type HelpArticle = {
  slug: string
  title: string
  category: HelpCategory
  description: string
  content: string
  relatedArticles?: string[]
  walkthrough?: string
  adminOnly?: boolean
  keywords?: string[]
}

export const HELP_CATEGORIES: { id: HelpCategory; name: string; description: string }[] = [
  { id: 'getting-started', name: 'Getting Started', description: 'Learn the basics of using the app' },
  { id: 'clients', name: 'Clients', description: 'Managing your client list and portal' },
  { id: 'sessions', name: 'Sessions', description: 'Logging and tracking sessions' },
  { id: 'invoices', name: 'Invoices', description: 'Billing, invoicing, and payments' },
  { id: 'team', name: 'Team', description: 'Managing your team and contractor rates' },
  { id: 'analytics', name: 'Analytics', description: 'Reports, analytics, and payroll' },
  { id: 'settings', name: 'Settings', description: 'Configuration and preferences' },
]

export type HelpFaq = {
  id: string            // stable kebab id, e.g. 'why-no-invoice'
  question: string      // user phrasing
  answer: string        // short markdown, 1–2 paragraphs
  articleSlug?: string  // deep link target
  category: HelpCategory
  adminOnly?: boolean
}
