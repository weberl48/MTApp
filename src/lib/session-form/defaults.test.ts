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

  it('saves and loads v1 defaults', () => {
    saveSessionFormDefaults(key, {
      time: '10:15',
      duration: '45',
      serviceTypeId: 'service-1',
    })

    const loaded = loadSessionFormDefaults(key)
    expect(loaded).toEqual({
      v: 1,
      time: '10:15',
      duration: '45',
      serviceTypeId: 'service-1',
    })
  })

  it('returns null for invalid JSON', () => {
    window.localStorage.setItem(key, '{not-json')
    expect(loadSessionFormDefaults(key)).toBeNull()
  })

  it('returns null for wrong shapes', () => {
    window.localStorage.setItem(
      key,
      JSON.stringify({ v: 1, time: 123, duration: '30', serviceTypeId: 'x', selectedClientIds: [] })
    )
    expect(loadSessionFormDefaults(key)).toBeNull()
  })

  it('clears stored defaults', () => {
    saveSessionFormDefaults(key, {
      time: '09:00',
      duration: '30',
      serviceTypeId: '',
    })
    clearSessionFormDefaults(key)
    expect(loadSessionFormDefaults(key)).toBeNull()
  })
})

