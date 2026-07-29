#!/usr/bin/env node
/**
 * Dev-DB scenario dataset generator for the MCA-Dev Supabase project.
 *
 * Emits dev-seed.sql: a full production-shaped dataset covering every session
 * status, payment method, billing method/frequency, invoice state (pending,
 * sent, overdue, paid, Square, batch), group sessions with attendee splits,
 * two tax years of paid payroll history (including a Dec→Jan cash-basis
 * boundary), goals, and session requests.
 *
 * Deterministic by design: fixed reference date, no randomness, and every
 * seeded row uses the `dd5eed00-` UUID prefix so re-running replaces the
 * dataset instead of duplicating it. Existing seed rows (org, users, service
 * types, the four Test clients, their 22 sessions) are never touched.
 *
 * Usage: node scripts/dev-seed/generate.mjs   → writes scripts/dev-seed/dev-seed.sql
 * Apply: node scripts/dev-seed/apply.mjs      (MCA-Dev only; refuses prod)
 */
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Fixed reference date — regenerating always yields the same file. Bump when
// the dataset should "move forward in time", then re-apply.
const TODAY = '2026-07-29'

const ORG = 'a0000000-0000-0000-0000-000000000001'
const CONTRACTOR = '8dcc04b8-fb6b-4fbb-9ffb-ce3a8c525e84' // Dev Contractor
const OWNER = 'f20d1c84-29b5-438a-865c-c8a4bbe1db5f' // Dev Owner

// Existing dev service types (id, per-30-min base rate, contractor pay from contractor_rates)
const SVC = {
  musical: { id: '83f28c35-3366-43f8-93a2-ae55026a27c8', name: 'Musical Expressions', rate: 60, pay: 38.5 },
  adaptive: { id: 'c528cc96-b368-47e4-9922-a12056c2d7d6', name: 'Adaptive Lesson', rate: 45, pay: 29.5 },
  creative: { id: 'd0b7bb76-ab52-4c4b-831c-97e9db033389', name: 'Creative Remedies', rate: 50, pay: 50 },
  schoolGroup: { id: 'bfda7114-408c-4f79-a162-31c2d002fafc', name: 'In-school group session', rate: 105, pay: 73 },
  exprGroup: { id: 'f12ce1d4-d43e-4976-9626-e7dcb60ebc41', name: 'Music Expressions Group', rate: 50, perPerson: 20, pay: 50 },
  scholarship: { id: '80979ad5-a36a-43b7-8699-4f5eb7c084eb', name: 'Scholarship Individual Session', rate: 60, pay: 40 },
  lateCancel: { id: '64c0f857-fd9c-429c-8b77-35efca722e55', name: 'Late Cancellation Fee', rate: 50, pay: 50 },
}

// Existing seeded clients (kept, built upon)
const EXISTING = {
  privatePay: 'da9b2437-22a8-4835-9a85-8f7b4da7f4cf', // Test Private Pay
  groupHome: '57a9d0cb-59ef-4890-9791-cf9f5ec930a7', // Test Group Home
  monthly: 'ce7d3e8f-e599-4762-bb7b-89aa2852202e', // Test Monthly Billing
  scholarship: 'e6b1d020-5eab-4c2e-bc21-f6f8389c7802', // Test Scholarship
}

// ---- deterministic UUID helpers (dd5eed00- prefix = "dev seed") ----
const uid = (block, n) => `dd5eed00-0000-4000-a000-${block}${String(n).padStart(11, '0')}`
const cid = n => uid('c', n)
let sessionN = 0, invoiceN = 0, itemN = 0, attendeeN = 0, miscN = 0
const nextSession = () => uid('d', ++sessionN)
const nextInvoice = () => uid('b', ++invoiceN)
const nextItem = () => uid('e', ++itemN)
const nextAttendee = () => uid('a', ++attendeeN)
const nextMisc = () => uid('f', ++miscN)

const esc = v => (v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`)
const num = v => (v == null ? 'NULL' : String(Math.round(v * 100) / 100))
const round2 = v => Math.round(v * 100) / 100

const NEW_CLIENTS = [
  { key: 'c01', name: 'Avery Thompson', payment: 'private_pay', billing: 'square', freq: 'per_session', fee: false, email: 'avery.thompson@example.com', phone: '555-0101', notes: 'Prefers morning sessions. Responds well to rhythm-based exercises.' },
  { key: 'c02', name: 'Jordan Lee', payment: 'private_pay', billing: 'check', freq: 'per_session', fee: false, email: 'jordan.lee@example.com', phone: '555-0102', notes: 'Parent pays by check at end of session.' },
  { key: 'c03', name: 'Sam Rivera', payment: 'private_pay', billing: 'email', freq: 'per_session', fee: true, email: 'sam.rivera@example.com', phone: '555-0103', notes: null },
  { key: 'c04', name: 'Morgan Blake', payment: 'private_pay', billing: 'square', freq: 'monthly', fee: false, email: 'morgan.blake@example.com', phone: '555-0104', notes: 'Monthly billing per family request.' },
  { key: 'c05', name: 'Casey Nguyen', payment: 'self_directed', billing: 'email', freq: 'per_session', fee: false, email: 'casey.nguyen@example.com', phone: '555-0105', notes: 'Self-directed reimbursement — payments often 60+ days.' },
  { key: 'c06', name: 'Sunrise Group Home', payment: 'group_home', billing: 'email', freq: 'per_session', fee: false, email: 'billing@sunrisegh.example.com', phone: '555-0106', notes: 'Group sessions Tuesdays. Invoice the facility, attn: Rhonda.' },
  { key: 'c07', name: 'Willow House', payment: 'group_home', billing: 'check', freq: 'per_session', fee: false, email: null, phone: '555-0107', notes: 'No email on file — mail invoices to front office.' },
  { key: 'c08', name: 'Riley Foster', payment: 'scholarship', billing: 'other', freq: 'per_session', fee: false, email: 'foster.family@example.com', phone: '555-0108', notes: 'NTLC scholarship. Batch monthly on the Scholarship tab.' },
  { key: 'c09', name: 'Quinn Harper', payment: 'scholarship', billing: 'other', freq: 'per_session', fee: false, email: 'harper.q@example.com', phone: '555-0109', notes: 'NTLC scholarship.' },
  { key: 'c10', name: 'Alex Kim', payment: 'venmo', billing: 'other', freq: 'per_session', fee: false, email: 'alex.kim@example.com', phone: '555-0110', notes: 'Pays via Venmo after each session.' },
  { key: 'c11', name: 'Jamie Ortiz', payment: 'private_pay', billing: 'square', freq: 'per_session', fee: false, email: 'jamie.ortiz@example.com', phone: '555-0111', notes: 'Intake complete — first session not yet scheduled.' },
  { key: 'c12', name: 'Taylor Brooks', payment: 'private_pay', billing: 'square', freq: 'per_session', fee: false, email: 'taylor.brooks@example.com', phone: '555-0112', notes: null },
]
const C = Object.fromEntries(NEW_CLIENTS.map((c, i) => [c.key, { ...c, id: cid(i + 1) }]))

// Months covered: Jan 2025 → Jul 2026
const MONTHS = []
for (let y = 2025; y <= 2026; y++) {
  for (let m = 1; m <= 12; m++) {
    if (y === 2026 && m > 7) break
    MONTHS.push(`${y}-${String(m).padStart(2, '0')}`)
  }
}
const d = (month, day) => `${month}-${String(day).padStart(2, '0')}`
const addDays = (dateStr, days) => {
  const dt = new Date(`${dateStr}T00:00:00Z`)
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}
const monthEnd = month => addDays(`${month}-01`, 32).slice(0, 8) + '01' === `${month}-01` ? null : null // unused
const PAID_THROUGH = '2026-05-31' // approved sessions on/before this date have been paid out

const sessions = [] // {id, date, time, duration, svc, clientId, clientName, status, total, pay, mca, notes, clientNotes, headcount, memberNames, classroom, contractorId, rejectionReason, attendees: [{clientId, cost}]}

function statusFor(month, day) {
  if (month < '2026-07') return 'approved'
  const date = d(month, day)
  if (date > TODAY) return 'draft'
  if (day > 24) return 'draft'
  if (day > 14) return 'submitted'
  return 'approved'
}

function addSession(s) {
  sessions.push({ id: nextSession(), contractorId: CONTRACTOR, time: null, notes: null, clientNotes: null, attendees: [], ...s })
}

const TIMES = ['09:00', '10:30', '14:00', '15:30']

MONTHS.forEach((month, mi) => {
  // 4 individual Musical Expressions across regular clients
  const indiv = [
    { c: C.c01, day: 3, dur: 30 },
    { c: C.c02, day: 8, dur: 45 },
    { c: C.c03, day: 12, dur: 60 },
    { c: C.c10, day: 17, dur: 30 },
  ]
  indiv.forEach((x, i) => {
    const f = x.dur / 30
    addSession({
      date: d(month, x.day), time: TIMES[i], duration: x.dur, svc: SVC.musical,
      clientId: x.c.id, clientName: x.c.name, status: statusFor(month, x.day),
      total: SVC.musical.rate * f, pay: SVC.musical.pay * f, mca: (SVC.musical.rate - SVC.musical.pay) * f,
      notes: i === 0 ? 'Worked on call-and-response drumming; strong engagement.' : null,
      clientNotes: i === 2 ? 'Practiced two new chords — try the strumming pattern at home.' : null,
    })
  })

  // Adaptive lesson for the self-directed client
  addSession({
    date: d(month, 9), time: '11:00', duration: 45, svc: SVC.adaptive,
    clientId: C.c05.id, clientName: C.c05.name, status: statusFor(month, 9),
    total: SVC.adaptive.rate * 1.5, pay: SVC.adaptive.pay * 1.5, mca: (SVC.adaptive.rate - SVC.adaptive.pay) * 1.5,
  })

  // Existing Test Private Pay client keeps light history too
  if (mi % 2 === 0) {
    addSession({
      date: d(month, 20), time: '13:00', duration: 30, svc: SVC.musical,
      clientId: EXISTING.privatePay, clientName: 'Test Private Pay', status: statusFor(month, 20),
      total: SVC.musical.rate, pay: SVC.musical.pay, mca: SVC.musical.rate - SVC.musical.pay,
    })
  }

  // In-school group session at the group home (flat rate, headcount, classroom)
  addSession({
    date: d(month, 10), time: '10:00', duration: 30, svc: SVC.schoolGroup,
    clientId: C.c06.id, clientName: C.c06.name, status: statusFor(month, 10),
    total: SVC.schoolGroup.rate, pay: SVC.schoolGroup.pay, mca: SVC.schoolGroup.rate - SVC.schoolGroup.pay,
    headcount: 6, memberNames: 'Ava R., Ben K., Chris P., Dana L., Eli M., Fay S.',
    classroom: mi % 2 === 0 ? 'Room 12' : 'Music Room',
    notes: 'Group percussion circle; two new participants settled in well.',
  })
  // Willow House group every third month
  if (mi % 3 === 1) {
    addSession({
      date: d(month, 24), time: '10:00', duration: 30, svc: SVC.schoolGroup,
      clientId: C.c07.id, clientName: C.c07.name, status: statusFor(month, 24),
      total: SVC.schoolGroup.rate, pay: SVC.schoolGroup.pay, mca: SVC.schoolGroup.rate - SVC.schoolGroup.pay,
      headcount: 5, memberNames: 'Gio T., Hana W., Ivy C., Jack D., Kai F.', classroom: 'Common Room',
    })
  }

  // Multi-client group with per-attendee invoice split (4 attendees @ (50+3*20)/4)
  if (mi % 2 === 1) {
    const attendees = [C.c01, C.c02, C.c10, C.c12]
    const total = SVC.exprGroup.rate + (attendees.length - 1) * SVC.exprGroup.perPerson
    addSession({
      date: d(month, 15), time: '16:00', duration: 30, svc: SVC.exprGroup,
      clientId: attendees[0].id, clientName: attendees[0].name, status: statusFor(month, 15),
      total, pay: SVC.exprGroup.pay, mca: total - SVC.exprGroup.pay,
      headcount: attendees.length,
      attendees: attendees.map(a => ({ clientId: a.id, clientName: a.name, cost: round2(total / attendees.length) })),
    })
  }

  // Scholarship sessions (flat $60, contractor $40 — batched monthly, never per-session invoiced)
  const scholarshipClients = [
    { id: C.c08.id, name: C.c08.name, day: 5 },
    { id: C.c08.id, name: C.c08.name, day: 19 },
    { id: C.c09.id, name: C.c09.name, day: 12 },
    { id: C.c09.id, name: C.c09.name, day: 26 },
    ...(mi % 3 === 0 ? [{ id: EXISTING.scholarship, name: 'Test Scholarship', day: 23 }] : []),
  ]
  for (const sc of scholarshipClients) {
    addSession({
      date: d(month, sc.day), time: '12:00', duration: mi % 2 ? 45 : 30, svc: SVC.scholarship,
      clientId: sc.id, clientName: sc.name, status: statusFor(month, sc.day),
      total: SVC.scholarship.rate, pay: SVC.scholarship.pay, mca: SVC.scholarship.rate - SVC.scholarship.pay,
    })
  }

  // Monthly-billing clients (Creative Remedies, batched — no per-session invoices)
  for (const mc of [
    { id: C.c04.id, name: C.c04.name, day: 7 },
    { id: C.c04.id, name: C.c04.name, day: 21 },
    { id: EXISTING.monthly, name: 'Test Monthly Billing', day: 16 },
  ]) {
    addSession({
      date: d(month, mc.day), time: '09:30', duration: 30, svc: SVC.creative,
      clientId: mc.id, clientName: mc.name, status: statusFor(month, mc.day),
      total: SVC.creative.rate, pay: SVC.creative.pay, mca: 0,
    })
  }

  // A no-show every third month ($60 fee, contractor keeps normal 30-min pay)
  if (mi % 3 === 2) {
    addSession({
      date: d(month, 11), time: '14:00', duration: 30, svc: SVC.musical,
      clientId: C.c01.id, clientName: C.c01.name, status: 'no_show',
      total: 60, pay: SVC.musical.pay, mca: 60 - SVC.musical.pay,
      notes: 'No-show — family did not answer confirmation call.',
    })
  }

  // A cancelled session every fourth month (no invoice; some carry a rejection reason)
  if (mi % 4 === 3) {
    addSession({
      date: d(month, 22), time: '15:00', duration: 30, svc: SVC.musical,
      clientId: C.c02.id, clientName: C.c02.name, status: 'cancelled',
      total: null, pay: null, mca: null,
      rejectionReason: mi % 8 === 3 ? 'Duplicate entry — session was logged twice.' : null,
    })
  }

  // Occasional late-cancellation fee (billable, pay = total, MCA margin 0)
  if (mi % 5 === 4) {
    addSession({
      date: d(month, 27), time: null, duration: 30, svc: SVC.lateCancel,
      clientId: C.c03.id, clientName: C.c03.name, status: statusFor(month, 27),
      total: SVC.lateCancel.rate, pay: SVC.lateCancel.pay, mca: 0,
    })
  }

  // Owner runs a couple of sessions too
  if (mi % 6 === 0) {
    addSession({
      date: d(month, 14), time: '10:00', duration: 60, svc: SVC.musical,
      clientId: C.c12.id, clientName: C.c12.name, status: statusFor(month, 14), contractorId: OWNER,
      total: SVC.musical.rate * 2, pay: SVC.musical.pay * 2, mca: (SVC.musical.rate - SVC.musical.pay) * 2,
    })
  }
})

// Future sessions (reminder + upcoming-schedule scenarios)
addSession({ date: '2026-08-04', time: '10:00', duration: 30, svc: SVC.musical, clientId: C.c12.id, clientName: C.c12.name, status: 'draft', total: 60, pay: 38.5, mca: 21.5 })
addSession({ date: '2026-08-06', time: '11:00', duration: 45, svc: SVC.adaptive, clientId: C.c05.id, clientName: C.c05.name, status: 'draft', total: 67.5, pay: 44.25, mca: 23.25 })
const approvedRequestSessionId = sessions[sessions.length - 1].id

// ---- payroll: mark historical contractor work as paid (cash basis) ----
// Paid on the 5th of the following month → December 2025 work is paid in
// January 2026, exercising the cash-basis year boundary in tax summaries.
let bonusCount = 0
for (const s of sessions) {
  const payrollStatus = s.status === 'approved' || s.status === 'no_show'
  if (payrollStatus && s.date <= PAID_THROUGH && s.pay != null) {
    s.paidDate = addDays(s.date.slice(0, 7) + '-01', 35).slice(0, 8) + '05'
    s.paidAmount = s.pay
    // Two sessions paid at an adjusted amount (paid-amount override scenario)
    if (s.date.startsWith('2026-02') && bonusCount < 2 && s.svc === SVC.musical) {
      s.paidAmount = round2(s.pay + 5)
      bonusCount++
    }
  }
}

// ---- invoices ----
const invoices = [] // {id, sessionId, clientId, amount, mca, pay, status, paymentMethod, dueDate, paidDate, createdAt, squareId, squareUrl, applyFee, type, period, reminders}
const invoiceItems = [] // batch line items

const clientById = new Map([
  ...NEW_CLIENTS.map((c, i) => [cid(i + 1), c]),
  [EXISTING.privatePay, { name: 'Test Private Pay', payment: 'private_pay', billing: 'square', freq: 'per_session', fee: false }],
  [EXISTING.groupHome, { name: 'Test Group Home', payment: 'group_home', billing: 'email', freq: 'per_session', fee: false }],
  [EXISTING.monthly, { name: 'Test Monthly Billing', payment: 'private_pay', billing: 'square', freq: 'monthly', fee: false }],
  [EXISTING.scholarship, { name: 'Test Scholarship', payment: 'scholarship', billing: 'other', freq: 'per_session', fee: false }],
])

function invoiceStateFor(sessionDate) {
  const due = addDays(sessionDate, 30)
  const month = sessionDate.slice(0, 7)
  if (month <= '2026-04') return { status: 'paid', dueDate: due, paidDate: addDays(sessionDate, 18), reminders: '[]' }
  if (month === '2026-05') return { status: 'sent', dueDate: due, paidDate: null, reminders: '[7,1]' } // overdue
  if (month === '2026-06') {
    const overdue = due < TODAY
    return { status: 'sent', dueDate: due, paidDate: null, reminders: overdue ? '[7]' : '[]' }
  }
  return { status: 'pending', dueDate: due, paidDate: null, reminders: '[]' }
}

let squareN = 0
function pushInvoice(s, clientId, amount, mca, pay, state) {
  const client = clientById.get(clientId)
  const useSquare = client.billing === 'square' && state.status !== 'pending'
  squareN++
  invoices.push({
    id: nextInvoice(), sessionId: s.id, clientId,
    amount, mca, pay,
    status: state.status, paymentMethod: client.payment,
    dueDate: state.dueDate, paidDate: state.paidDate, reminders: state.reminders,
    createdAt: `${s.date}T17:00:00Z`,
    squareId: useSquare ? `DEVSEED-SQ-${String(squareN).padStart(4, '0')}` : null,
    squareUrl: useSquare ? `https://squareupsandbox.com/pay/devseed-${String(squareN).padStart(4, '0')}` : null,
    applyFee: client.fee ? true : null,
    type: 'session', period: null,
  })
}

for (const s of sessions) {
  if (s.status === 'cancelled') continue // pending invoices are cleaned up on cancel
  const client = clientById.get(s.clientId)
  if (!client) continue
  // Monthly-billing and scholarship clients are batched, never per-session invoiced
  const batched = client.freq === 'monthly' || client.payment === 'scholarship'
  if (batched) continue

  if (s.attendees.length > 0) {
    // Per-attendee split invoices (skip batched attendees)
    const state = invoiceStateFor(s.date)
    for (const a of s.attendees) {
      const ac = clientById.get(a.clientId)
      if (ac.freq === 'monthly' || ac.payment === 'scholarship') continue
      const share = a.cost
      const payShare = round2(s.pay / s.attendees.length)
      pushInvoice(s, a.clientId, share, round2(share - payShare), payShare, state)
    }
    continue
  }

  if (s.status === 'draft' || s.status === 'submitted') {
    // Invoices are created with the session and stay pending until approval
    pushInvoice(s, s.clientId, s.total, s.mca, s.pay, { status: 'pending', dueDate: addDays(s.date, 30), paidDate: null, reminders: '[]' })
  } else if (s.status === 'approved' || s.status === 'no_show') {
    pushInvoice(s, s.clientId, s.total, s.mca, s.pay, invoiceStateFor(s.date))
  }
}

// ---- batch invoices (scholarship + monthly clients), grouped per client-month ----
const batchGroups = new Map()
for (const s of sessions) {
  const client = clientById.get(s.clientId)
  if (!client) continue
  const batched = client.freq === 'monthly' || client.payment === 'scholarship'
  if (!batched || s.status !== 'approved') continue
  const month = s.date.slice(0, 7)
  if (month >= '2026-07') continue // current month left unbatched — "Generate All" test material
  const key = `${s.clientId}::${month}`
  if (!batchGroups.has(key)) batchGroups.set(key, [])
  batchGroups.get(key).push(s)
}

for (const [key, group] of batchGroups) {
  const [clientId, month] = key.split('::')
  const client = clientById.get(clientId)
  const amount = round2(group.reduce((t, s) => t + s.total, 0))
  const pay = round2(group.reduce((t, s) => t + s.pay, 0))
  const mca = round2(amount - pay)
  const state =
    month <= '2026-04'
      ? { status: 'paid', dueDate: addDays(`${month}-28`, 30), paidDate: addDays(`${month}-28`, 20), reminders: '[]' }
      : month === '2026-05'
        ? { status: 'sent', dueDate: '2026-06-30', paidDate: null, reminders: '[7,1]' }
        : { status: 'pending', dueDate: '2026-07-31', paidDate: null, reminders: '[]' }
  const invoiceId = nextInvoice()
  invoices.push({
    id: invoiceId, sessionId: null, clientId,
    amount, mca, pay,
    status: state.status, paymentMethod: client.payment,
    dueDate: state.dueDate, paidDate: state.paidDate, reminders: state.reminders,
    createdAt: `${addDays(`${month}-28`, 1)}T09:00:00Z`,
    squareId: null, squareUrl: null,
    applyFee: client.fee ? true : null,
    type: 'batch', period: month,
  })
  for (const s of group) {
    invoiceItems.push({
      id: nextItem(), invoiceId, sessionId: s.id,
      description: `${s.svc.name} — ${s.date}`,
      sessionDate: s.date, duration: s.duration,
      amount: s.total, mca: s.mca, pay: s.pay,
      serviceName: s.svc.name, contractorName: s.contractorId === OWNER ? 'Dev Owner' : 'Dev Contractor',
    })
  }
}

// ---- goals + session requests ----
const goals = [
  { clientId: C.c01.id, description: 'Increase verbal engagement during preferred-song activities.', status: 'active' },
  { clientId: C.c01.id, description: 'Maintain steady beat on hand drum for 60 seconds.', status: 'met', completedAt: '2026-03-12T00:00:00Z' },
  { clientId: C.c02.id, description: 'Tolerate transitions between activities without distress.', status: 'not_met' },
  { clientId: C.c05.id, description: 'Use adaptive switch to trigger musical phrases independently.', status: 'active' },
  { clientId: C.c08.id, description: 'Identify and express three emotions through instrument choice.', status: 'active' },
  { clientId: EXISTING.scholarship, description: 'Participate in group singing for a full session.', status: 'met', completedAt: '2026-05-02T00:00:00Z' },
].map(g => ({ ...g, id: nextMisc() }))

const requests = [
  { clientId: C.c12.id, preferredDate: '2026-08-06', preferredTime: '11:00', altDate: '2026-08-08', altTime: '14:00', duration: 45, svc: SVC.adaptive.id, notes: 'Hoping to add a second weekly session before school starts.', status: 'approved', respondedBy: OWNER, respondedAt: '2026-07-21T15:00:00Z', responseNotes: 'Scheduled for Aug 6.', createdSessionId: approvedRequestSessionId, createdAt: '2026-07-20T12:00:00Z' },
  { clientId: C.c01.id, preferredDate: '2026-08-11', preferredTime: '09:00', altDate: null, altTime: null, duration: 30, svc: SVC.musical.id, notes: 'Can we move to Tuesdays in August?', status: 'pending', createdAt: '2026-07-26T18:00:00Z' },
  { clientId: C.c03.id, preferredDate: '2026-08-14', preferredTime: null, altDate: null, altTime: null, duration: 60, svc: SVC.musical.id, notes: null, status: 'pending', createdAt: '2026-07-28T10:00:00Z' },
  { clientId: C.c05.id, preferredDate: '2026-07-30', preferredTime: '13:00', altDate: null, altTime: null, duration: 45, svc: SVC.adaptive.id, notes: 'Short-notice request for this week.', status: 'declined', respondedBy: OWNER, respondedAt: '2026-07-27T09:00:00Z', responseNotes: 'No availability this week — offered Aug 6 instead.', createdAt: '2026-07-26T08:00:00Z' },
].map(r => ({ ...r, id: nextMisc() }))

// ---- SQL emission ----
const out = []
out.push(`-- MCA-Dev scenario dataset (generated by scripts/dev-seed/generate.mjs — do not hand-edit)
-- Reference date: ${TODAY}. Idempotent: all rows use the dd5eed00- UUID prefix
-- and are deleted before re-insert. Never run against production.
`)

out.push(`-- CHUNK delete previous seed
DELETE FROM session_reminders WHERE session_id::text LIKE 'dd5eed00%';
DELETE FROM invoice_items WHERE id::text LIKE 'dd5eed00%' OR invoice_id::text LIKE 'dd5eed00%' OR session_id::text LIKE 'dd5eed00%';
DELETE FROM invoices WHERE id::text LIKE 'dd5eed00%' OR session_id::text LIKE 'dd5eed00%';
DELETE FROM session_attendees WHERE id::text LIKE 'dd5eed00%' OR session_id::text LIKE 'dd5eed00%';
DELETE FROM session_requests WHERE id::text LIKE 'dd5eed00%';
DELETE FROM client_goals WHERE id::text LIKE 'dd5eed00%';
DELETE FROM sessions WHERE id::text LIKE 'dd5eed00%';
DELETE FROM clients WHERE id::text LIKE 'dd5eed00%';`)

out.push(`-- CHUNK clients + goals`)
for (const [i, c] of NEW_CLIENTS.entries()) {
  out.push(
    `INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, notes, billing_method, billing_frequency, square_fee_enabled, organization_id, created_at, updated_at) VALUES (` +
      `${esc(cid(i + 1))}, ${esc(c.name)}, ${esc(c.email)}, ${esc(c.phone)}, ${esc(c.payment)}, ${esc(c.notes)}, ${esc(c.billing)}, ${esc(c.freq)}, ${c.fee}, ${esc(ORG)}, '2025-01-02T10:00:00Z', '2025-01-02T10:00:00Z');`
  )
}
for (const g of goals) {
  out.push(
    `INSERT INTO client_goals (id, client_id, description, status, completed_at, organization_id, created_at) VALUES (` +
      `${esc(g.id)}, ${esc(g.clientId)}, ${esc(g.description)}, ${esc(g.status)}, ${esc(g.completedAt ?? null)}, ${esc(ORG)}, '2025-02-01T10:00:00Z');`
  )
}

// Sessions in year chunks to keep each Management API request modest
for (const year of ['2025', '2026']) {
  out.push(`-- CHUNK sessions ${year}`)
  for (const s of sessions.filter(x => x.date.startsWith(year))) {
    const submittedAt = s.status === 'draft' ? null : `${s.date}T18:00:00Z`
    const approvedAt = s.status === 'approved' || s.status === 'no_show' ? `${addDays(s.date, 1)}T09:00:00Z` : null
    out.push(
      `INSERT INTO sessions (id, date, time, duration_minutes, service_type_id, contractor_id, status, notes, client_notes, group_headcount, group_member_names, classroom, rejection_reason, total_amount, contractor_pay, mca_cut, contractor_paid_date, contractor_paid_amount, submitted_at, approved_at, organization_id, created_at, updated_at) VALUES (` +
        `${esc(s.id)}, ${esc(s.date)}, ${esc(s.time)}, ${s.duration}, ${esc(s.svc.id)}, ${esc(s.contractorId)}, ${esc(s.status)}, ${esc(s.notes)}, ${esc(s.clientNotes)}, ${s.headcount ?? 'NULL'}, ${esc(s.memberNames ?? null)}, ${esc(s.classroom ?? null)}, ${esc(s.rejectionReason ?? null)}, ${num(s.total)}, ${num(s.pay)}, ${num(s.mca)}, ${esc(s.paidDate ?? null)}, ${num(s.paidAmount ?? null)}, ${esc(submittedAt)}, ${esc(approvedAt)}, ${esc(ORG)}, '${s.date}T08:00:00Z', '${s.date}T18:30:00Z');`
    )
  }
}

out.push(`-- CHUNK attendees`)
// Clients link to sessions ONLY via session_attendees — every session gets at
// least one row (individual sessions: one attendee bearing the full cost).
for (const s of sessions) {
  const rows = s.attendees.length
    ? s.attendees
    : [{ clientId: s.clientId, cost: s.total ?? 0 }]
  for (const a of rows) {
    out.push(
      `INSERT INTO session_attendees (id, session_id, client_id, individual_cost) VALUES (${esc(nextAttendee())}, ${esc(s.id)}, ${esc(a.clientId)}, ${num(a.cost)});`
    )
  }
}

out.push(`-- CHUNK invoices`)
for (const inv of invoices) {
  out.push(
    `INSERT INTO invoices (id, session_id, client_id, amount, mca_cut, contractor_pay, rent_amount, status, payment_method, due_date, paid_date, invoice_type, billing_period, reminder_sent_days, apply_square_fee, square_invoice_id, square_payment_url, organization_id, created_at, updated_at) VALUES (` +
      `${esc(inv.id)}, ${esc(inv.sessionId)}, ${esc(inv.clientId)}, ${num(inv.amount)}, ${num(inv.mca)}, ${num(inv.pay)}, 0, ${esc(inv.status)}, ${esc(inv.paymentMethod)}, ${esc(inv.dueDate)}, ${esc(inv.paidDate)}, ${esc(inv.type)}, ${esc(inv.period)}, '${inv.reminders}'::jsonb, ${inv.applyFee == null ? 'NULL' : inv.applyFee}, ${esc(inv.squareId)}, ${esc(inv.squareUrl)}, ${esc(ORG)}, ${esc(inv.createdAt)}, ${esc(inv.createdAt)});`
  )
}

out.push(`-- CHUNK invoice items + requests`)
for (const it of invoiceItems) {
  out.push(
    `INSERT INTO invoice_items (id, invoice_id, session_id, description, session_date, duration_minutes, amount, mca_cut, contractor_pay, rent_amount, service_type_name, contractor_name) VALUES (` +
      `${esc(it.id)}, ${esc(it.invoiceId)}, ${esc(it.sessionId)}, ${esc(it.description)}, ${esc(it.sessionDate)}, ${it.duration}, ${num(it.amount)}, ${num(it.mca)}, ${num(it.pay)}, 0, ${esc(it.serviceName)}, ${esc(it.contractorName)});`
  )
}
for (const r of requests) {
  out.push(
    `INSERT INTO session_requests (id, client_id, preferred_date, preferred_time, alternative_date, alternative_time, duration_minutes, service_type_id, notes, status, response_notes, responded_by, responded_at, created_session_id, organization_id, created_at, updated_at) VALUES (` +
      `${esc(r.id)}, ${esc(r.clientId)}, ${esc(r.preferredDate)}, ${esc(r.preferredTime)}, ${esc(r.altDate)}, ${esc(r.altTime)}, ${r.duration}, ${esc(r.svc)}, ${esc(r.notes)}, ${esc(r.status)}, ${esc(r.responseNotes ?? null)}, ${esc(r.respondedBy ?? null)}, ${esc(r.respondedAt ?? null)}, ${esc(r.createdSessionId ?? null)}, ${esc(ORG)}, ${esc(r.createdAt)}, ${esc(r.createdAt)});`
  )
}

const sql = out.join('\n') + '\n'
const target = join(dirname(fileURLToPath(import.meta.url)), 'dev-seed.sql')
writeFileSync(target, sql)

const counts = {
  clients: NEW_CLIENTS.length,
  goals: goals.length,
  sessions: sessions.length,
  byStatus: sessions.reduce((m, s) => ((m[s.status] = (m[s.status] || 0) + 1), m), {}),
  attendeeRows: sessions.reduce((t, s) => t + (s.attendees.length || 1), 0),
  invoices: invoices.length,
  invoicesByStatus: invoices.reduce((m, i) => ((m[i.status] = (m[i.status] || 0) + 1), m), {}),
  batchInvoices: invoices.filter(i => i.type === 'batch').length,
  invoiceItems: invoiceItems.length,
  requests: requests.length,
  paidSessions: sessions.filter(s => s.paidDate).length,
}
console.log('Wrote', target)
console.log(JSON.stringify(counts, null, 2))
