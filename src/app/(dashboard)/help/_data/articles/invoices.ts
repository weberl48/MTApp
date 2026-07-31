import type { HelpArticle } from '../types'

export const INVOICES_ARTICLES: HelpArticle[] = [
  {
    slug: 'generating-invoices',
    title: 'How Invoices Are Generated',
    category: 'invoices',
    description: 'Understanding how invoices are automatically created from approved sessions.',
    adminOnly: true,
    relatedArticles: ['sending-invoices', 'scholarship-billing', 'invoice-lifecycle', 'billing-and-pay-rules'],
    keywords: ['bill', 'per client', 'automatic', 'generate invoice', 'pending', 'create invoice'],
    content: `
## How Invoices Are Generated

Invoices in MCA Manager are created automatically. You do not need to build them by hand.

### The Automatic Process

1. A contractor logs a session and submits it. The system immediately creates a new invoice for the client in "Pending" status.
2. The invoice appears in the Invoices section, ready to be sent.
3. An admin reviews and approves the session on the Sessions page.
4. If auto-send is enabled (Settings > Customize and Automate > Automation), approval sends the invoice to the client automatically; otherwise, send it manually when you're ready.

### What Is on an Invoice

- Client name and contact information
- Session date, time, and duration
- Service type and rate
- Financial breakdown: total amount, MCA portion, contractor portion
- Payment instructions (configured in Settings)
- An activity log showing status changes and when it was sent or paid
- A **Client Preview** that displays the exact document the client receives

### Invoice Statuses

- **Pending** - Created but not yet sent to the client.
- **Sent** - Delivered to the client by email or Square.
- **Paid** - Payment has been received and recorded.

Sent invoices that are past their due date are displayed with an **Overdue** indicator and a count of days late. This is a visual flag, not a separate status.

### Scholarship and Monthly-Batched Sessions

Scholarship clients are handled differently. Sessions for scholarship clients are NOT automatically invoiced one at a time. Instead, they are batched monthly and invoiced together from the Scholarship tab on the Invoices page.

The same applies to any client whose **Invoicing** setting (Clients > Edit Client) is **Monthly batch** — their sessions are held and combined into one monthly invoice at normal pricing.

### Editing a Session That Already Has an Invoice

If you edit a session in a way that changes its price and it already has an invoice, you'll be asked what to do: **No, just update session** leaves the invoice untouched, **Regenerate only** updates the invoice amounts and resets it to Pending for you to re-send, and **Regenerate & send** updates the invoice and immediately emails it to the client.

### Automation

You can configure the app to send invoices automatically when a session is approved, rather than waiting for manual action. See Settings > Customize and Automate > Automation tab.

### Missing an invoice?

If a submitted or approved session has no invoice (for example, after an invoice was deleted), open the session's detail page — admins and owners will see a **Create Invoice** button. Clicking it creates the pending invoice(s) from the session's recorded amounts. Sessions for monthly-billed or scholarship clients don't get per-session invoices — they are billed through the monthly batch instead.
    `,
  },
  {
    slug: 'sending-invoices',
    title: 'Sending Invoices',
    category: 'invoices',
    description: 'How to send invoices individually or in bulk via email or Square.',
    adminOnly: true,
    walkthrough: 'send-invoice',
    relatedArticles: ['generating-invoices', 'automation-settings', 'square-integration'],
    keywords: ['send invoice', 'email invoice', 'square', 'bulk actions', 'processing fee', 'pdf'],
    content: `
## Sending Invoices

Once an invoice has been generated, you can deliver it to the client by email or through Square.

### Sending an Individual Invoice

1. Navigate to **Billing > Invoices** in the sidebar.
2. Click on the invoice you want to send.
3. On the invoice detail page, open the **actions menu** (the "⋯" button in the top corner).
4. Choose **Send via Email** to email the invoice with a PDF attachment, or **Send via Square** to create a Square invoice with an online payment link.

The same menu also lets you **Mark as Sent**, **Mark as Paid** (including a Venmo option), **Mark as Unpaid**, or **Download PDF** — useful when payment happens outside the app.

### Sending via Square

When you use the Square option, a Square invoice is created in your connected Square account and sent to the client automatically. When the client pays using the Square link, MCA Manager receives a webhook notification and marks the invoice as paid without any manual action.

### Square Processing Fee

You can add an automatic processing fee to every Square invoice to cover online payment costs. Go to **Settings > Business Rules > Invoices** and enable the **Square Processing Fee** option. You can choose a fixed dollar amount (e.g., $3.00) or a percentage (e.g., 2.9% + $0.30 to match Square's standard rate). The fee appears as a separate "Online Processing Fee" line item on the Square invoice.

**Per-client:** instead of charging everyone, you can leave the org-wide toggle off and check **Add Square processing fee to invoices** on individual clients (Clients > Edit Client) — for example, clients who always pay online. Configure the fee amount in Settings either way.

**Per-invoice:** every unpaid invoice that hasn't been sent to Square yet shows a **Square Processing Fee** switch on its detail page. Flip it off if a client decides not to pay online after all (or on, to add the fee just once). Once the Square invoice exists, the fee can no longer be changed from here.

### Sorting the Invoice List

Use the **sort dropdown** at the top of the invoices list to order by newest/oldest, **date submitted** (when the contractor submitted the session), **date approved** (when an admin approved it), or amount. The sort applies to every tab. Monthly batch invoices sort by their generation date for the submitted/approved options.

### Bulk Actions

To handle multiple invoices at once:

1. Go to the Invoices list.
2. Use the checkboxes to select the invoices you want to act on.
3. A blue action bar appears above the list showing the selection count and total, with **Export CSV**, **Mark Sent**, and **Mark Paid** buttons.

This is useful for recording offline payments or preparing a batch export for your records.

### Previewing an Invoice

Before sending, you can see exactly what the client will receive. Open the invoice and click **Show preview** on the **Client Preview** card — the invoice document appears right on the page, no download needed. This is the same PDF that gets attached to the email, so what you see is precisely what the client gets. (For Square-billed invoices, the client receives Square's hosted invoice instead; the preview card notes this and links to it.)

On a phone, the preview opens in a new tab instead of displaying inline.

### Downloading a PDF

From any invoice detail page, you can download a PDF copy of the invoice using the download button on the Client Preview card (or **Download PDF** in the actions menu). The PDF includes all financial details and your organization's payment instructions.

### Auto-Send

If you would prefer invoices to be sent immediately when sessions are approved, you can enable auto-send in **Settings > Customize and Automate > Automation**. This removes the need to manually trigger each send.
    `,
  },
  {
    slug: 'scholarship-billing',
    title: 'Scholarship Billing',
    category: 'invoices',
    description: 'How scholarship sessions are tracked and batch-invoiced on a monthly basis.',
    walkthrough: 'scholarship-billing',
    adminOnly: true,
    relatedArticles: ['generating-invoices', 'automation-settings', 'configuring-services', 'adding-a-client', 'billing-and-pay-rules'],
    keywords: ['scholarship', 'monthly batch', 'batch invoice', 'flat rate', 'classroom'],
    content: `
## Scholarship Billing

Scholarship clients are billed differently from private-pay clients. Rather than generating an invoice for every session, scholarship sessions are grouped by month and invoiced as a single batch per client.

The same tab also handles clients whose **Invoicing** setting is **Monthly batch** (Clients > Edit Client). Their sessions batch identically, but are billed at **normal pricing** — the scholarship rate only applies to scholarship-funded clients and scholarship service types.

### Where to Find It

Navigate to **Invoices** and click the **Scholarship** tab. This tab is always visible for admins and owners, even when there are no scholarship sessions in the system yet. When there is nothing to show, you will see a message explaining what the tab is for.

### What Makes a Session "Scholarship"

A session is treated as scholarship through either of two paths:

1. **Client-based** - The client's payment method is set to **Scholarship** (under Clients > Edit Client). Any session logged for this client will be routed to batch invoicing.
2. **Service-type-based** - The service type is marked as a **Scholarship Service** (under Settings > Services). Any session using this service type will be routed to batch invoicing, regardless of the client's payment method.

In both cases, per-session invoices are skipped and the session is held for monthly batch generation instead.

### How It Works

The Scholarship tab displays all approved scholarship sessions that have not yet been invoiced. Sessions are grouped by **client** and by **month**. For each group, you can see the service type, date, contractor, and duration of each session.

### Generating Invoices

- **Generate Invoice** (per group) - Creates one invoice for that client covering the selected month's sessions.
- **Generate All** - Creates invoices for every unbilled group shown on the page.

After generating, the confirmation message includes a **View** button — click it to jump straight to the new invoice (or to the invoice list when several were created at once).

All generated invoices start in **Pending** status. Review them before sending to make sure the details are correct — the invoice page's **Client Preview** shows exactly what the client will receive. Once generated, batch invoices appear under the "Batch Invoices" section on the same tab.

### Scholarship Rate

The invoice amount is based on the flat scholarship rate configured on the service type, not the standard session rate. The rate is the same regardless of session duration. You can set this rate in **Settings > Services** when editing a service type.

### Contractor Pay

Contractors are paid based on normal pricing rules, not the scholarship rate. If the scholarship rate is lower than what the contractor would normally earn, the organization absorbs the difference. This means switching a client to scholarship does not affect contractor compensation.

### Auto-Generation

If you prefer to automate this process, go to **Settings > Customize and Automate > Automation** and enable auto-generate for scholarship invoices. You can set a day of the month (1-28) on which invoices are automatically created, covering the previous month's unbilled sessions. Generated invoices start in Pending status so you can review them before sending.

### Classroom Tracking

For scholarship group sessions, contractors select a **Classroom** from a dropdown when logging the session. This helps track which room or location the group met in. The classroom list is configured by the owner under **Settings > Business Rules > Sessions > Classrooms**.

**Per-agency lists:** each billed client/agency (e.g., a school district, day hab, or group home) can have its **own** classroom/program list — configure these under **Settings > Business Rules > Sessions > Per-Agency Classroom / Program Lists**. When a session is billed to an agency with its own list, the session form shows that agency's options — for any payment type, not just scholarship groups.

### Setting Up Scholarship Billing

1. **Configure a scholarship service type** - Go to Settings > Services, create or edit a service type, and check "Scholarship Service". Set the flat scholarship rate.
2. **Set client payment method** - Go to Clients, edit the client, and set their payment method to "Scholarship".
3. **(Optional) Configure classrooms** - Go to Settings > Business Rules > Sessions and add classroom names so contractors can select a room when logging scholarship group sessions.
4. **Log sessions as usual** - Contractors log sessions normally. The system automatically routes scholarship sessions to batch invoicing.
5. **Generate invoices monthly** - Visit the Scholarship tab on Invoices and click Generate, or enable auto-generation in Settings.
    `,
  },
  {
    slug: 'billing-and-pay-rules',
    title: 'Billing & Pay Rules',
    category: 'invoices',
    description: 'The full money path from a logged session to what the client owes and what the contractor earns.',
    adminOnly: true,
    relatedArticles: ['invoice-lifecycle', 'square-integration', 'pricing-deep-dive', 'scholarship-billing', 'client-billing-controls'],
    keywords: ['money', 'billing rules', 'mca cut', 'who pays', 'payment method', 'contractor pay', 'no-show fee'],
    content: `
## Billing & Pay Rules

Every dollar in MCA Manager follows the same basic path: a contractor completes a session, the app calculates what the client owes and what the contractor earns, an invoice goes out, and the contractor gets paid. This article walks through that path end to end. For the exact pricing formulas (duration multipliers, group math, contractor pay priority), see **Pricing Deep Dive**.

### Three Numbers, Set at Session Creation

When a session is submitted, three numbers are calculated and stored on the session:

- **Total Amount** - what the client (or their agency, or the scholarship fund) owes.
- **Contractor Pay** - what the contractor earns for the session.
- **MCA Cut** - what the organization keeps (Total minus Contractor Pay).

These numbers are locked in at that point — later invoices are built from the session's stored amounts, not recalculated from the current service type configuration. If you change a service type's rates afterward, past sessions and their invoices keep their original numbers.

Group sessions split billing per attendee: each client who attended gets their own invoice, so a 4-person group session produces 4 separate invoices (unless the client is billed to an agency as a single group, in which case the full group total goes on one invoice — see **Group Sessions**).

### How Payment Method Determines Billing

Every client has a **Payment Method**, and it controls how much they're billed:

- **Private Pay** - billed the standard formula (base rate scaled by duration, plus per-person rate for groups).
- **Self-Directed** - same formula as Private Pay; the difference is who ultimately pays (a third party reimburses the client).
- **Group Home** - same formula, billed to the facility/agency instead of an individual.
- **Scholarship** - billed a flat scholarship rate regardless of duration, and batched monthly instead of per session (see **Scholarship & Monthly Exceptions** below).
- **Venmo** - same formula as Private Pay; the difference is how payment is collected.

This is a separate concept from **Billing Method** (Square, Email, Check, Other), which controls *how the invoice is delivered*, not how much is billed. A client can be Private Pay + Square, Group Home + Check, or any other combination.

### No-Shows

When a client no-shows, they're charged a flat fee ($60 by default) instead of the normal session price. The contractor still gets their normal 30-minute session pay — a no-show doesn't reduce their earnings. The fee amount is configurable; see **No-Shows & Cancellations**.

### Contractor Pay Priority

Contractor pay is determined by a priority chain — the most specific rule that applies wins: a group pay matrix (exact pay by headcount and duration), then a contractor's custom rate, then the service type's duration-based pay schedule, and finally a percentage-of-total formula as the fallback. **Pricing Deep Dive** covers each of these with worked examples. **Where to configure:** contractor custom rates live under **Team > Rates**; pay schedules and the MCA percentage live on each service type (**Settings > Services**).

### Scholarship & Monthly Exceptions

Two kinds of clients skip the normal one-invoice-per-session flow entirely:

- **Scholarship clients** (Payment Method = Scholarship, or a service type marked as a Scholarship Service) are billed a flat rate that doesn't change with duration. The contractor is still paid using the normal priority chain above — if the scholarship rate is lower than what the contractor would normally earn, MCA absorbs the difference. Contractor pay is never reduced by a client being on scholarship.
- **Monthly-batched clients** (Invoicing = Monthly batch, set per client) are billed at normal pricing, but their sessions accumulate and are combined into one invoice per month instead of one invoice per session.

Both groups are held and invoiced together from the **Scholarship** tab on the Invoices page — see **Scholarship Billing** and **Client Billing Controls** for the full walkthrough.
    `,
  },
  {
    slug: 'invoice-lifecycle',
    title: 'The Invoice Lifecycle',
    category: 'invoices',
    description: 'What each invoice status means, how overdue and reminders are calculated, and what can and cannot be deleted.',
    adminOnly: true,
    relatedArticles: ['generating-invoices', 'sending-invoices', 'square-integration', 'billing-and-pay-rules'],
    keywords: ['overdue', 'delete invoice', 'resend', 'paid date', 'reminders', 'status'],
    content: `
## The Invoice Lifecycle

Every invoice moves through a small set of statuses. This article covers what each one means, when the app moves an invoice between them automatically, and what you can and can't undo.

### Pending → Sent → Paid

- **Pending** - created automatically when a session is submitted (see **How Invoices Are Generated**). Not yet delivered to the client.
- **Sent** - delivered by email or Square, or manually marked as sent from the actions menu if you handled it outside the app.
- **Paid** - payment has been recorded, either automatically (a Square payment webhook, see **Square Integration**) or manually via **Mark as Paid**.

Moving an invoice *off* Paid — using **Mark as Unpaid**, or a bulk action that touches a paid invoice — always clears its recorded paid date rather than leaving a stale one behind. If you re-mark it Paid later, you'll need to set the date again.

### Overdue Is Computed, Not a Status

There's no separate "Overdue" status. A **Sent** invoice is shown with an Overdue badge and a day count whenever its due date has passed, based on your local calendar date — the badge disappears the moment it's marked Paid. The due date itself is set when the invoice is created: the session date plus your organization's **Default Due Days** (30 days by default). **Where to configure:** Settings > Business Rules > Invoices.

### Reminder Emails

Unpaid, sent invoices get automatic reminder emails before (and once after) their due date. By default, reminders go out 7 and 1 days before the due date; you can change which days and turn reminders off entirely. Each reminder day is tracked per invoice so it's only ever sent once, even if the daily reminder job runs more than once. **Where to configure:** Settings > Business Rules > Invoices ("Send Reminders" and "Reminder Days Before Due").

### Resubmitting a Session Recreates Its Invoice

If a session's invoice goes missing — most commonly because an admin sent it back for revision (**Request Revision** deletes the session's pending invoice and returns it to draft) — resubmitting or re-approving the session automatically creates a fresh pending invoice for it. You don't need to build one by hand, and it won't double-bill: if any invoice already exists for the session, nothing new is created. As a manual backstop, admins and owners can also open the session's detail page and click **Create Invoice** if one is ever missing.

This is different from editing an *already-invoiced* session in a way that changes its price — that flow asks whether to leave the invoice alone, regenerate its amounts, or regenerate and resend (see **How Invoices Are Generated**).

### Deleting Invoices

Only **Pending** invoices can be deleted. Once an invoice has been **Sent** or **Paid**, it's a financial record, and no flow in the app — deleting it directly, rejecting the session, or cancelling the session — will remove it. This is intentional: it guarantees that anything already delivered to (or paid by) a client stays in the record. If a sent or paid invoice needs correcting, use the actions menu (Mark as Unpaid, re-send, etc.) rather than trying to delete it.
    `,
  },
  {
    slug: 'square-integration',
    title: 'Square Integration',
    category: 'invoices',
    description: 'How sending invoices through Square works, including processing fees and automatic payment updates.',
    adminOnly: true,
    relatedArticles: ['sending-invoices', 'invoice-lifecycle', 'billing-and-pay-rules', 'client-billing-controls'],
    keywords: ['square', 'credit card', 'processing fee', 'webhook', 'online payment'],
    content: `
## Square Integration

MCA Manager can send invoices through your connected Square account so clients can pay online by card, bank transfer, or Cash App Pay.

### Sending an Invoice via Square

Choosing **Send via Square** from an invoice's actions menu creates an order and invoice in your Square account and publishes it, which sends the client an email from Square with a payment link. See **Sending Invoices** for the step-by-step. If a send is retried after a timeout, or you click the button twice, Square recognizes it as the same request rather than creating a duplicate invoice.

### Processing Fee

You can pass along Square's card processing cost to the client as a separate "Online Processing Fee" line item. It never affects contractor pay — only the total the client is billed. There are three layers, from broadest to narrowest:

- **Organization-wide** - Settings > Business Rules > Invoices > Square Processing Fee, as a fixed dollar amount or a percentage (optionally plus a flat amount, to mirror Square's own 2.9% + $0.30 style pricing).
- **Per-client** - leave the org-wide toggle off and check **Add Square processing fee to invoices** on individual clients (Clients > Edit Client) for clients who always pay online.
- **Per-invoice** - any unpaid invoice that hasn't been sent to Square yet shows its own Square Processing Fee switch, letting you turn the fee on or off for that one invoice. Once the Square invoice has been created, the fee can no longer be changed from there.

### Payments Are Marked Paid Automatically

When a client pays a Square invoice, Square sends MCA Manager a webhook notification and the invoice is marked **Paid** with no manual action needed. Because Square doesn't guarantee webhook delivery order and can retry events, this update is forward-only: once an invoice is Paid, a later or out-of-order webhook can never move it back to Sent or Pending, even if it reports an unpaid/canceled status. A paid invoice only changes if you change it yourself (for example, **Mark as Unpaid**).

Square invoices also carry their own built-in reminder emails around the due date — separate from, and in addition to, MCA Manager's own invoice reminders (see **The Invoice Lifecycle**), which are sent regardless of how an invoice was delivered.

### Sandbox vs. Production

Your Square connection runs in either **sandbox** or **production** mode. In sandbox, every invoice email is redirected to a developer test address instead of the real client (with the client's name prefixed "[TEST]"), so you can safely test the integration without emailing anyone. Production mode sends real invoices to real clients. You can check your current connection status from **Settings** or the Square status endpoint.
    `,
  },
]
