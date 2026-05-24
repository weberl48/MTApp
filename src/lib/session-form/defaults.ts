export type SessionFormDefaults = {
  v: 2
  time: string
  duration: string
}

export function getSessionFormDefaultsStorageKey(params: {
  organizationId: string
  contractorId: string
}) {
  return `mca_session_form_defaults:v2:${params.organizationId}:${params.contractorId}`
}

export function loadSessionFormDefaults(storageKey: string): SessionFormDefaults | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<SessionFormDefaults>

    if (parsed.v !== 2) return null
    if (typeof parsed.time !== 'string') return null
    if (typeof parsed.duration !== 'string') return null

    return {
      v: 2,
      time: parsed.time,
      duration: parsed.duration,
    }
  } catch {
    return null
  }
}

export function saveSessionFormDefaults(storageKey: string, defaults: Omit<SessionFormDefaults, 'v'>) {
  if (typeof window === 'undefined') return

  const payload: SessionFormDefaults = {
    v: 2,
    time: defaults.time,
    duration: defaults.duration,
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

// Quick-log defaults include serviceTypeId (for the quick-log drawer FAB)
export type QuickLogDefaults = {
  v: 1
  time: string
  duration: string
  serviceTypeId: string
}

export function getQuickLogDefaultsStorageKey(params: {
  organizationId: string
  contractorId: string
}) {
  return `mca_quick_log_defaults:v1:${params.organizationId}:${params.contractorId}`
}

export function loadQuickLogDefaults(storageKey: string): QuickLogDefaults | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<QuickLogDefaults>

    if (parsed.v !== 1) return null
    if (typeof parsed.time !== 'string') return null
    if (typeof parsed.duration !== 'string') return null
    if (typeof parsed.serviceTypeId !== 'string') return null

    return {
      v: 1,
      time: parsed.time,
      duration: parsed.duration,
      serviceTypeId: parsed.serviceTypeId,
    }
  } catch {
    return null
  }
}

export function saveQuickLogDefaults(storageKey: string, defaults: Omit<QuickLogDefaults, 'v'>) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(storageKey, JSON.stringify({ v: 1, ...defaults }))
  } catch {
    // Ignore
  }
}
