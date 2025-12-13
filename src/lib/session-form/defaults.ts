export type SessionFormDefaultsV1 = {
  v: 1
  time: string
  duration: string
  serviceTypeId: string
  selectedClientIds: string[]
}

export function getSessionFormDefaultsStorageKey(params: {
  organizationId: string
  contractorId: string
}) {
  return `mca_session_form_defaults:v1:${params.organizationId}:${params.contractorId}`
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

export function loadSessionFormDefaults(storageKey: string): SessionFormDefaultsV1 | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<SessionFormDefaultsV1>

    if (parsed.v !== 1) return null
    if (typeof parsed.time !== 'string') return null
    if (typeof parsed.duration !== 'string') return null
    if (typeof parsed.serviceTypeId !== 'string') return null
    if (!isStringArray(parsed.selectedClientIds)) return null

    return {
      v: 1,
      time: parsed.time,
      duration: parsed.duration,
      serviceTypeId: parsed.serviceTypeId,
      selectedClientIds: parsed.selectedClientIds,
    }
  } catch {
    return null
  }
}

export function saveSessionFormDefaults(storageKey: string, defaults: Omit<SessionFormDefaultsV1, 'v'>) {
  if (typeof window === 'undefined') return

  const payload: SessionFormDefaultsV1 = {
    v: 1,
    time: defaults.time,
    duration: defaults.duration,
    serviceTypeId: defaults.serviceTypeId,
    selectedClientIds: defaults.selectedClientIds,
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(payload))
  } catch {
    // Ignore storage errors (e.g., quota, disabled storage)
  }
}

export function clearSessionFormDefaults(storageKey: string) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.removeItem(storageKey)
  } catch {
    // Ignore
  }
}

