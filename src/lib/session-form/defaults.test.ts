import {
  clearSessionFormDefaults,
  loadSessionFormDefaults,
  saveSessionFormDefaults,
} from './defaults'

describe('session form defaults storage', () => {
  const key = 'test_session_form_defaults_key'

  beforeEach(() => {
    const store = new Map<string, string>()

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
        setItem: (k: string, v: string) => {
          store.set(k, String(v))
        },
        removeItem: (k: string) => {
          store.delete(k)
        },
      },
    })
  })

  it('saves and loads v2 defaults (time + duration only)', () => {
    saveSessionFormDefaults(key, {
      time: '10:15',
      duration: '45',
    })

    const loaded = loadSessionFormDefaults(key)
    expect(loaded).toEqual({
      v: 2,
      time: '10:15',
      duration: '45',
    })
  })

  it('returns null for invalid JSON', () => {
    window.localStorage.setItem(key, '{not-json')
    expect(loadSessionFormDefaults(key)).toBeNull()
  })

  it('returns null for old v1 data', () => {
    window.localStorage.setItem(
      key,
      JSON.stringify({ v: 1, time: '09:00', duration: '30', serviceTypeId: 'x' })
    )
    expect(loadSessionFormDefaults(key)).toBeNull()
  })

  it('returns null for wrong shapes', () => {
    window.localStorage.setItem(
      key,
      JSON.stringify({ v: 2, time: 123, duration: '30' })
    )
    expect(loadSessionFormDefaults(key)).toBeNull()
  })

  it('clears stored defaults', () => {
    saveSessionFormDefaults(key, {
      time: '09:00',
      duration: '30',
    })
    clearSessionFormDefaults(key)
    expect(loadSessionFormDefaults(key)).toBeNull()
  })
})
