/**
 * Apply one SQL file to cert. The generic applier, cert-locked.
 *
 * Deliberately unlike scripts/rates-migration/apply.mjs, which takes
 * `<ref> <file>`. That shape is fine for a one-off supervised migration and is
 * exactly wrong for a tool run repeatedly by muscle memory — so the ref is not
 * a parameter here and cannot be overridden.
 *
 * Usage:  node scripts/cert-refresh/apply-sql.mjs <file.sql>
 */
import './lib/run.mjs'
import { readFileSync, existsSync } from 'fs'
import { certQuery } from './lib/api.mjs'
import { assertCert } from './lib/guards.mjs'

await assertCert()

const file = process.argv[2]
if (!file) throw new Error('usage: apply-sql.mjs <file.sql>')
if (!existsSync(file)) throw new Error(`No such file: ${file}`)

const sql = readFileSync(file, 'utf8')
await certQuery(sql)
console.log(`  applied ${file} (${sql.length} bytes)`)
