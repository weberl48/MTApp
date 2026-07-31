import { DEFAULT_LOCATION_LABEL } from '@/types/database'
import type { ClientLocationConfig, OrganizationSettings } from '@/types/database'

/**
 * Resolve the session-location field config for a session's BILLED client.
 *
 * Precedence, highest first:
 *  1. `custom_lists.locations_by_client[billedClientId]`
 *  2. the global `custom_lists.classrooms` list — scholarship group sessions ONLY
 *  3. null (render no field)
 *
 * Legacy `classrooms_by_client` needs no branch here: `mergeOrganizationSettings()`
 * has already upgraded it into `locations_by_client`.
 *
 * A config that can never be filled — no options AND no free text — resolves to
 * null rather than rendering a required field with nothing to pick, which would
 * make the session form unsubmittable.
 */
export function resolveLocationConfig(
  settings: OrganizationSettings | null | undefined,
  billedClientId: string,
  opts: { isScholarshipGroup: boolean }
): ClientLocationConfig | null {
  const perClient = billedClientId
    ? settings?.custom_lists?.locations_by_client?.[billedClientId]
    : undefined

  const globalClassrooms = settings?.custom_lists?.classrooms ?? []

  const config: ClientLocationConfig | undefined =
    perClient ??
    (opts.isScholarshipGroup && globalClassrooms.length > 0
      ? {
          label: DEFAULT_LOCATION_LABEL,
          options: globalClassrooms,
          allow_other: false,
          required: true,
        }
      : undefined)

  if (!config) return null
  if (config.options.length === 0 && !config.allow_other) return null
  return config
}

/**
 * Whether a location value satisfies its config. Whitespace is not a value —
 * a free-text box full of spaces must not pass a required check.
 */
export function isLocationSatisfied(
  config: ClientLocationConfig | null,
  value: string
): boolean {
  if (!config || !config.required) return true
  return value.trim().length > 0
}
