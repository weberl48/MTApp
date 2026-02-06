import type { OrganizationSettings, FeatureFlags } from '@/types/database'

/**
 * Check if a feature is enabled for an organization.
 * Defaults to true if the feature flag is not present (fail-open).
 */
export function isFeatureEnabled(
  settings: OrganizationSettings | Record<string, unknown> | null | undefined,
  flag: keyof FeatureFlags
): boolean {
  const features = (settings as OrganizationSettings | undefined)?.features
  return features?.[flag] ?? true
}

/**
 * Feature flag definitions with display metadata for the Settings UI.
 * To add a new toggleable feature:
 * 1. Add the boolean field to FeatureFlags in types/database.ts
 * 2. Add the default (true) to DEFAULT_SETTINGS in contexts/organization-context.tsx
 * 3. Add metadata here
 */
export const FEATURE_DEFINITIONS: Record<keyof FeatureFlags, {
  label: string
  description: string
}> = {
  client_portal: {
    label: 'Client Portal',
    description: 'Allow clients to view their sessions, goals, and resources via a secure portal link.',
  },
}
