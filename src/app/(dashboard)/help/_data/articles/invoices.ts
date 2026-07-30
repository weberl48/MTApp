import type { HelpArticle } from '../types'

export const INVOICES_ARTICLES: HelpArticle[] = [
  {
    slug: 'generating-invoices',
    title: 'How Invoices Are Generated',
    category: 'invoices',
    description: 'Understanding how invoices are automatically created from approved sessions.',
    adminOnly: true,
    relatedArticles: ['sending-invoices', 'scholarship-billing'],
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
    relatedArticles: ['generating-invoices', 'automation-settings'],
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
    relatedArticles: ['generating-invoices', 'automation-settings', 'configuring-services', 'adding-a-client'],
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
]
