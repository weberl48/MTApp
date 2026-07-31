import { describe, it, expect } from 'vitest'
import { setSectionDisabled, findTomlDuplicates } from './toml-config.mjs'

/**
 * Two earlier regex versions of this helper silently corrupted
 * supabase/config.toml — once by adding a duplicate `enabled` key, once by
 * treating a bracket inside a comment as a section boundary and splicing a bogus
 * table header into the file. The CLI reports either as a bare
 * "ProjectConfigParseError" with no line number, so the damage was only visible
 * by reading the file. These cases pin both failures.
 */

// A comment containing a table-like token AND a value containing brackets, both
// inside the section being edited: the exact shape that broke it.
const tricky = [
  '[db.seed]',
  '# disabled for the same reason as [db.migrations]',
  'enabled = true',
  'sql_paths = ["./seed.sql"]',
  '',
  '[realtime]',
  'enabled = true',
].join('\n')

describe('setSectionDisabled', () => {
  const r = setSectionDisabled(tricky, 'db.seed')

  it('rewrites the existing key rather than adding a second one', () => {
    expect(r.result).toBe('updated')
    expect((r.text.match(/^enabled/gm) || []).length).toBe(2)
  })

  it('introduces no duplicate table or key', () => {
    expect(findTomlDuplicates(r.text)).toEqual([])
  })

  it('leaves the following section untouched', () => {
    expect(r.text).toMatch(/\[realtime\]\nenabled = true/)
  })

  it('preserves a bracketed value and does not promote a comment to a header', () => {
    expect(r.text).toContain('sql_paths = ["./seed.sql"]')
    expect(r.text).not.toMatch(/^\[db\.migrations\]/m)
  })

  it('is idempotent', () => {
    expect(setSectionDisabled(r.text, 'db.seed').result).toBe('unchanged')
  })

  it('creates a missing section cleanly', () => {
    const added = setSectionDisabled('[api]\nenabled = true', 'db.seed')
    expect(added.result).toBe('added-section')
    expect(findTomlDuplicates(added.text)).toEqual([])
  })

  it('inserts the key when the section has none', () => {
    const noKey = setSectionDisabled('[db.seed]\n# nothing here\n\n[api]\nenabled = true', 'db.seed')
    expect(noKey.result).toBe('inserted')
    expect(noKey.text).toMatch(/\[db\.seed\]\nenabled = false/)
  })
})

describe('findTomlDuplicates', () => {
  it('detects the duplicate-key corruption', () => {
    expect(findTomlDuplicates('[db.migrations]\nenabled = false\nenabled = true')).toHaveLength(1)
  })

  it('detects a duplicated table', () => {
    expect(findTomlDuplicates('[api]\nenabled = true\n[api]\nport = 1')).toHaveLength(1)
  })

  it('accepts a well-formed file', () => {
    expect(findTomlDuplicates('[api]\nenabled = true\n\n[db]\nport = 54322')).toEqual([])
  })
})
