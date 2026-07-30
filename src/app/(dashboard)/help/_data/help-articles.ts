// Barrel: keeps the historical import path stable while the help data lives in
// per-category modules. See docs/superpowers/specs/2026-07-29-help-section-design.md.
export * from './types'
export { HELP_ARTICLES, getArticleBySlug, getArticlesByCategory } from './articles'
export { HELP_FAQS } from './faqs'
export * from './search'
