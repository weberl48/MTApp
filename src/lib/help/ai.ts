// Server-side only: imported exclusively from API routes (holds no secrets
// itself, but streamHelpAnswer takes the Anthropic API key).
import Anthropic from '@anthropic-ai/sdk'
import { HELP_ARTICLES, HELP_FAQS } from '@/app/(dashboard)/help/_data/help-articles'
import { canWithGrants } from '@/lib/auth/permissions'
import { adminGrantsFromSettings } from '@/lib/organization/settings'
import type { OrganizationSettings, ServiceType, UserRole } from '@/types/database'

/** Serialize the whole help corpus for the system prompt. Deterministic; the
 *  contractor variant drops everything adminOnly so restricted content can
 *  never leak through an answer. */
export function buildHelpCorpus(includeAdminOnly: boolean): string {
  const articles = HELP_ARTICLES.filter(a => includeAdminOnly || !a.adminOnly)
  const faqs = HELP_FAQS.filter(f => includeAdminOnly || !f.adminOnly)
  const parts: string[] = ['# MCA Manager documentation\n']
  for (const a of articles) {
    parts.push(`## Article: ${a.title}\nslug: ${a.slug}\ncategory: ${a.category}\n\n${a.content.trim()}\n`)
  }
  parts.push('# Frequently asked questions\n')
  for (const f of faqs) {
    parts.push(
      `## FAQ: ${f.question}\nid: ${f.id}${f.articleSlug ? `\nrelated article slug: ${f.articleSlug}` : ''}\n\n${f.answer.trim()}\n`
    )
  }
  return parts.join('\n')
}

/** Whitelist serialization of non-PHI org configuration. NEVER add client,
 *  session, invoice, or team data here — that is the compliance boundary. */
export function buildOrgContext(
  orgName: string,
  settings: OrganizationSettings,
  serviceTypes: ServiceType[],
  role: UserRole
): string {
  // Margin fields reach the assistant only for roles allowed to see them —
  // including an admin whose owner has granted it (the settings are in hand).
  const showFinancials = canWithGrants(
    role,
    'financial:view-details',
    adminGrantsFromSettings(settings)
  )
  const safeSettings = {
    pricing: settings.pricing,
    invoice: settings.invoice,
    session: settings.session,
    automation: settings.automation,
    features: settings.features,
    portal: { token_expiry_days: settings.portal?.token_expiry_days },
    custom_lists: settings.custom_lists,
  }
  const services = serviceTypes.map(s => ({
    name: s.name,
    base_rate: s.base_rate,
    per_person_rate: s.per_person_rate,
    ...(showFinancials
      ? {
          mca_percentage: s.mca_percentage,
          contractor_cap: s.contractor_cap,
          rent_percentage: s.rent_percentage,
        }
      : {}),
  }))
  return [
    `# This organization's configuration (non-sensitive)`,
    `Organization: ${orgName}`,
    `Asking user's role: ${role}`,
    `Settings: ${JSON.stringify(safeSettings)}`,
    `Service types: ${JSON.stringify(services)}`,
  ].join('\n')
}

export const HELP_AI_SYSTEM_RULES = `You are the MCA Manager help assistant for a music/art therapy practice management app.

Rules:
- Answer ONLY from the documentation and organization configuration provided below. If the documentation does not cover something, say so plainly and suggest asking the practice owner — never invent screens, buttons, settings, or behavior.
- End every answer that used the documentation with a final line: Sources: [[slug]] [[slug]] — using the slug values of the articles you relied on. Omit the line only when you could not answer.
- Politely decline questions unrelated to using MCA Manager, and ALL medical or clinical questions.
- The asking user's role is given in the configuration block. Do not describe admin-only capabilities to contractors.
- Keep answers short and practical. Use markdown. Refer to UI elements in bold, e.g. **Settings > Business Rules**.
- Never ask the user for client names or health information; if they include any, answer generally without repeating those details.`

export function streamHelpAnswer(opts: {
  apiKey: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  includeAdminOnly: boolean
  orgContext: string
}) {
  const anthropic = new Anthropic({ apiKey: opts.apiKey })
  return anthropic.messages.stream({
    // No temperature: Claude 5 models reject the deprecated parameter.
    model: process.env.HELP_AI_MODEL || 'claude-sonnet-5',
    max_tokens: 1024,
    system: [
      { type: 'text', text: HELP_AI_SYSTEM_RULES },
      {
        type: 'text',
        text: buildHelpCorpus(opts.includeAdminOnly),
        cache_control: { type: 'ephemeral' },
      },
      { type: 'text', text: opts.orgContext },
    ],
    messages: opts.messages,
  })
}
