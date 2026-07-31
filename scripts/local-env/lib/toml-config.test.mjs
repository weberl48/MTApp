/**
 * Run:  node scripts/local-env/lib/toml-config.test.mjs
 *
 * Two earlier regex versions of this helper silently corrupted
 * supabase/config.toml — once by adding a duplicate `enabled` key, once by
 * treating a bracket inside a comment as a section boundary. The CLI reports
 * either as a bare "ProjectConfigParseError", so the damage is only visible by
 * reading the file. These cases are exactly those two failures.
 */
import { setSectionDisabled, findTomlDuplicates } from './toml-config.mjs'

let failures = 0
const ok = (cond, msg) => {
  console.log(`${cond ? 'PASS  ' : 'FAIL  '}${msg}`)
  if (!cond) failures++
}

// The exact shape that broke it: a comment containing a table-like token, and a
// value containing brackets, both inside the section being edited.
const tricky = [
  '[db.seed]',
  '# disabled for the same reason as [db.migrations]',
  'enabled = true',
  'sql_paths = ["./seed.sql"]',
  '',
  '[realtime]',
  'enabled = true',
].join('\n')

const r = setSectionDisabled(tricky, 'db.seed')
ok(r.result === 'updated', 'rewrites the existing key rather than adding one')
ok(findTomlDuplicates(r.text).length === 0, 'introduces no duplicate table or key')
ok(/\[realtime\]\nenabled = true/.test(r.text), 'leaves the following section untouched')
ok(r.text.includes('sql_paths = ["./seed.sql"]'), 'preserves a bracketed value')
ok((r.text.match(/^enabled/gm) || []).length === 2, 'still exactly two enabled keys')
ok(!/^\[db\.migrations\]/m.test(r.text), 'does not promote a comment into a table header')

ok(setSectionDisabled(r.text, 'db.seed').result === 'unchanged', 'second run is a no-op')

const added = setSectionDisabled('[api]\nenabled = true', 'db.seed')
ok(
  added.result === 'added-section' && findTomlDuplicates(added.text).length === 0,
  'creates a missing section cleanly'
)

const noKey = setSectionDisabled('[db.seed]\n# nothing here\n\n[api]\nenabled = true', 'db.seed')
ok(noKey.result === 'inserted' && /\[db\.seed\]\nenabled = false/.test(noKey.text),
  'inserts the key when the section has none')

ok(findTomlDuplicates('[db.migrations]\nenabled = false\nenabled = true').length === 1,
  'detects the duplicate-key corruption')
ok(findTomlDuplicates('[api]\nenabled = true\n[api]\nport = 1').length === 1,
  'detects a duplicated table')

console.log(failures ? `\n${failures} FAILURE(S)` : '\nall passed')
process.exit(failures ? 1 : 0)
