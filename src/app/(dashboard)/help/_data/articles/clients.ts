import type { HelpArticle } from '../types'

export const CLIENTS_ARTICLES: HelpArticle[] = [
  {
    slug: 'adding-a-client',
    title: 'Adding a Client',
    category: 'clients',
    description: 'How to add a new client and configure their billing settings.',
    walkthrough: 'add-client',
    adminOnly: true,
    relatedArticles: ['logging-a-session', 'client-portal', 'scholarship-billing'],
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

Once a client is created, you can:

- Attach **resources** such as homework sheets, links, or files.
- Review their complete **session and invoice history** from the client detail page.
    `,
  },
  {
    slug: 'client-portal',
    title: 'Client Portal',
    category: 'clients',
    description: 'How the client portal works and how to enable it for individual clients.',
    adminOnly: true,
    relatedArticles: ['adding-a-client'],
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

Clients can request a new session from the portal by submitting preferred dates and times. The request is recorded in MCA Manager, but there is currently no dashboard screen that lists these requests for staff to review — check with the practice owner or administrator directly if a client mentions they've submitted one. A staff-facing review screen for session requests is planned for a future update.

### Token Expiry

Portal links expire after a set number of days. You can configure the expiry in **Settings > Business Rules > Sessions** tab, under the Client Portal section. When a link expires, the client sees a "This Link Has Expired" screen with a **Get a New Link** button where they can request a fresh link by entering their email — or you can send a new invite from the client's page.
    `,
  },
  {
    slug: 'client-details',
    title: 'Viewing Client Details & History',
    category: 'clients',
    description: 'How to view a client\'s contact information, session history, and invoice history.',
    adminOnly: true,
    relatedArticles: ['adding-a-client', 'client-portal'],
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
]
