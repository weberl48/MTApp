import type { HelpArticle } from '../types'

export const CLIENTS_ARTICLES: HelpArticle[] = [
  {
    slug: 'adding-a-client',
    title: 'Adding a Client',
    category: 'clients',
    description: 'How to add a new client and configure their billing settings.',
    walkthrough: 'add-client',
    adminOnly: true,
    relatedArticles: ['logging-a-session', 'client-portal', 'scholarship-billing', 'client-billing-controls'],
    keywords: ['add client', 'payment method', 'billing method', 'monthly batch', 'new client', 'location'],
    content: `
## Adding a New Client

Clients must be added before sessions can be logged for them. Only admins and owners can manage the client list.

### Steps to Add a Client

1. Click **Clients** in the sidebar.
2. Click the **Add Client** button in the top-right corner.
3. Fill in the client details:
   - **Name** - The client's full name (required).
   - **Email** - Optional, but required for sending invoices by email or Square.
   - **Phone** - Optional contact number.
   - **Payment Method** - How this client's sessions are billed. See below.
   - **Billing Method** - How invoices are delivered and collected.
   - **Invoicing** - **Per session** (default) creates an invoice when a session is submitted. **Monthly batch** holds sessions and combines them into one invoice per month — see below.
   - **Add Square processing fee to invoices** - Check this for clients who pay online; their Square invoices automatically include the processing fee configured in Settings > Business Rules > Invoices. You can still remove the fee from an individual invoice before sending it.
   - **Require a session location** - Check this if sessions involving this client need a recorded location (for example, an agency with multiple sites). Any session involving this client — including as the group "Bill To" agency — then shows a required free-text **Location** field (labeled **Classroom** instead if the session's service type also requires one). The recorded value prints on the invoice automatically.
   - **Notes** - Internal notes visible only to your team (encrypted for HIPAA compliance).
   - **Send portal invite** - If the Client Portal feature is enabled and you entered an email, you can check this box to email the client a portal access link right away. This is currently the only way to send a portal invite — see **Client Portal** for details.
4. Click **Save** to create the client.

### Monthly Batch Invoicing

Set **Invoicing** to **Monthly batch** for clients or agencies who prefer one invoice at the end of the month instead of one per session. Their approved sessions are held and appear on the **Scholarship** tab of the Invoices page, grouped by month, ready to generate as a single combined invoice. Unlike scholarship clients, monthly-batched clients are billed at **normal pricing** — only the invoice timing changes. Auto-generation (Settings > Customize and Automate > Automation) covers these clients too.

### Payment Methods

- **Private Pay** - The client pays directly out of pocket.
- **Self-Directed** - The client is reimbursed by a third party. Payments are often slower.
- **Group Home** - Billing goes to a group home facility.
- **Scholarship** - Funded through a scholarship program. These sessions use a flat scholarship rate and are invoiced monthly in a batch, not per-session.
- **Venmo** - Direct peer-to-peer payment.

### Billing Methods

- **Square** - Client receives a Square payment link.
- **Check** - Client pays by check.
- **Email** - Invoice is sent via email with PDF attachment.
- **Other** - Any other arrangement.

### After Adding a Client

Once a client is created, click their name from the Clients list to review their complete **session and invoice history** from the client detail page (see **Viewing Client Details & History**).
    `,
  },
  {
    slug: 'client-portal',
    title: 'Client Portal',
    category: 'clients',
    description: 'How the client portal works and how to enable it for individual clients.',
    adminOnly: true,
    relatedArticles: ['adding-a-client', 'session-requests'],
    keywords: ['portal', 'client portal', 'access token', 'invite', 'portal link'],
    content: `
## Client Portal

The Client Portal is an optional feature that gives clients a private, read-only (and limited interactive) view of their own data. Clients do not need to create an account; access is granted through a secure link.

### Enabling the Portal Feature

The Client Portal must be turned on at the organization level before it can be used. Go to **Settings > Business Rules > Features** tab and toggle the **Client Portal** switch on.

### Inviting a Client

Once the feature is enabled, the only way to invite a client today is while **adding** them:

1. Go to **Clients** and click **Add Client**.
2. Enter the client's email address.
3. Check **Send portal invite** (this option only appears if an email is entered).
4. Save the client. They receive an email with a secure access link.

The link is token-based, meaning no password is required. The client clicks the link and is taken directly to their portal. Links expire after a configurable number of days (set in Settings).

There is currently no way to send or re-send a portal invite for a client that already exists — the invite checkbox only appears on the Add Client form.

### What Clients See

- **Dashboard** - A summary of upcoming sessions, active goals, and pending to-do items.
- **Sessions** - A list of past and upcoming sessions. Clients can submit a session request with preferred dates.
- **Goals** - Therapy goals with progress tracking, shown read-only. There is currently no in-app screen for staff to create or edit goals — a developer or support contact would need to add them directly.
- **Resources** - Homework assignments, links, and files your team has shared with them.

### Session Requests

Clients can request a new session from the portal by submitting preferred dates and times. The request is recorded in MCA Manager, but there is currently no dashboard screen that lists these requests for staff to review — check with the practice owner or administrator directly if a client mentions they've submitted one. A staff-facing review screen for session requests is planned for a future update. See **Session Requests** for what information is captured and how requests are resolved once reviewed.

### Token Expiry

Portal links expire after a set number of days. You can configure the expiry in **Settings > Business Rules > Sessions** tab, under the Client Portal section. When a link expires, the client sees a "This Link Has Expired" screen with a **Get a New Link** button where they can request a fresh link themselves by entering their email — this self-service flow is currently the only way to get a client a new link once their original invite has expired.
    `,
  },
  {
    slug: 'client-details',
    title: 'Viewing Client Details & History',
    category: 'clients',
    description: 'How to view a client\'s contact information, session history, and invoice history.',
    adminOnly: true,
    relatedArticles: ['adding-a-client', 'client-portal', 'client-billing-controls'],
    keywords: ['client detail', 'session history', 'invoice history', 'contact info'],
    content: `
## Viewing Client Details & History

Each client has a detail page where you can see their full record in one place.

### How to Get There

Click **Clients** in the sidebar, then click on any client's name to open their detail page.

### Contact Information

The left panel shows the client's email, phone number, payment method, billing method, and any internal notes (which are encrypted for HIPAA compliance). Email and phone are clickable to start a message or call.

### Statistics

A summary shows the client's total session count and the number of pending invoices. If there are outstanding invoices, the count is highlighted.

### Sessions Tab

Lists all sessions for this client, showing the service type, status, date, duration, and contractor name. Click any session to view its full details.

### Invoices Tab

Lists all invoices for this client, showing the amount, status, payment method, creation date, and due date. Click any invoice to view its detail page.
    `,
  },
  {
    slug: 'client-billing-controls',
    title: 'Client Billing Controls',
    category: 'clients',
    description: 'How per-client invoicing frequency and the Square processing fee opt-in work, and when each is snapshotted onto an invoice.',
    adminOnly: true,
    relatedArticles: ['adding-a-client', 'sending-invoices', 'scholarship-billing'],
    keywords: ['monthly billing', 'billing frequency', 'square fee', 'batch', 'per-session invoicing'],
    content: `
## Client Billing Controls

Two per-client settings change how and when a client gets invoiced: **Invoicing** frequency and the **Square processing fee** opt-in. Both are set when you add a client and can be changed later from **Clients > Edit Client**.

### Per Session vs. Monthly Batch

- **Per session** (the default) creates an invoice as soon as a session for that client is submitted.
- **Monthly batch** holds the client's approved sessions and combines them into a single invoice at the end of the month, on the **Scholarship** tab of the Invoices page - the same place scholarship batches are generated.

Monthly-batched clients are billed at **normal pricing**. Switching a client to monthly batch only changes *when* they're invoiced, not *how much* - that's the key difference from scholarship clients, who are billed at a flat scholarship rate. A client can be monthly-batched without being a scholarship client at all, for example an agency that prefers one combined invoice a month instead of one per session.

If **Auto-Generate Scholarship Invoices** is turned on in Settings > Customize and Automate > Automation, monthly-batched clients are swept into that same automatic batch run alongside scholarship clients.

### Square Processing Fee Opt-In

Your organization can charge an automatic processing fee on Square invoices to cover the cost of accepting online payments. It can be controlled at three levels, and the client-level toggle documented here is the middle one:

1. **Organization-wide** - turn the fee on for every Square invoice (Settings > Business Rules > Invoices).
2. **Per-client** - leave the org-wide toggle off and check **Add Square processing fee to invoices** on individual clients instead, for clients who typically pay online.
3. **Per-invoice** - override either default on a single invoice before it's sent to Square.

A client's toggle is unset by default, meaning that client simply follows whatever the organization-wide setting is. Checking or unchecking it explicitly overrides the org setting for that one client.

### Snapshot at Invoice Time

When an invoice is created, the client's Square-fee opt-in is **snapshotted onto that invoice** rather than looked up live every time the invoice is viewed. Changing a client's opt-in later only affects invoices created *after* the change - it will not add or remove the fee from an invoice that already exists. To change the fee on an existing unpaid invoice, use the per-invoice toggle on that invoice's detail page instead.

### Where to Configure

- Invoicing frequency and Square fee opt-in: **Clients > Add Client** or **Clients > Edit Client**.
- Organization-wide Square fee default and amount: **Settings > Business Rules > Invoices**.
- Scholarship batch automation: **Settings > Customize and Automate > Automation**.

### See Also

For the full mechanics of the Square processing fee, including fixed vs. percentage amounts, see **Sending Invoices**. For how scholarship batches work, see **Scholarship Billing**.
    `,
  },
]
