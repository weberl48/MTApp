export type HelpCategory =
  | 'getting-started'
  | 'clients'
  | 'sessions'
  | 'invoices'
  | 'settings'
  | 'team'
  | 'analytics'

export type HelpArticle = {
  slug: string
  title: string
  category: HelpCategory
  description: string
  content: string
  relatedArticles?: string[]
  walkthrough?: string
  adminOnly?: boolean
}

export const HELP_CATEGORIES: { id: HelpCategory; name: string; description: string }[] = [
  { id: 'getting-started', name: 'Getting Started', description: 'Learn the basics of using the app' },
  { id: 'clients', name: 'Clients', description: 'Managing your client list and portal' },
  { id: 'sessions', name: 'Sessions', description: 'Logging and tracking sessions' },
  { id: 'invoices', name: 'Invoices', description: 'Billing, invoicing, and payments' },
  { id: 'team', name: 'Team', description: 'Managing your team and contractor rates' },
  { id: 'analytics', name: 'Analytics', description: 'Reports, analytics, and payroll' },
  { id: 'settings', name: 'Settings', description: 'Configuration and preferences' },
]

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: 'getting-started',
    title: 'Getting Started with MCA Manager',
    category: 'getting-started',
    description: 'An overview of the app and how to navigate its main features.',
    walkthrough: 'app-overview',
    relatedArticles: ['logging-a-session', 'view-as-mode'],
    content: `
## Welcome to MCA Manager

MCA Manager is a practice management system for music and art therapy. It handles session logging, client management, invoicing, and contractor payments in one place. What you see in the app depends on your role.

### For Contractors

As a contractor, your workspace is focused on logging your work and tracking your pay:

- **Dashboard** - Your home base showing recent sessions, pending submissions, and an earnings summary for the current period.
- **Sessions** - Log new sessions, check the status of submitted sessions, and edit drafts.
- **Earnings** - View your pay history broken down by pay period, with a per-session detail.
- **Mobile floating button** - On mobile, a quick-log button appears at the bottom of the screen so you can start a session entry in seconds without navigating through menus.

### For Admins and Owners

You have access to everything contractors see, plus:

- **Clients** - Add, edit, and manage your full client list. Send portal invites and view session/invoice history per client.
- **Invoices** - Review, send, and track payment status for all invoices. Bulk-mark as sent or paid.
- **Payroll** - Track which contractors have unpaid sessions and record payments.
- **Team** - View and manage team members, invite new contractors or admins, and configure pay rates.
- **Analytics** - Revenue charts, session volume, and payment status summaries.
- **Settings** - Organization configuration including service types, pricing, branding, and automation.

### Using MCA Manager on Mobile

MCA Manager is a Progressive Web App (PWA), which means you can install it on your phone without going through an app store.

On iPhone: open the site in Safari, tap the Share button, then tap "Add to Home Screen."
On Android: open the site in Chrome, tap the menu (three dots), then tap "Add to Home Screen."

Once installed, it behaves like a native app with an icon on your home screen.

### Getting Help

You can reach the Help Center at any time by clicking your avatar in the top-right corner and selecting "Help," or by using the Help link in the sidebar.
    `,
  },
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
   - **Notes** - Internal notes visible only to your team (encrypted for HIPAA compliance).
4. Click **Save** to create the client.

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

- Send them a **Client Portal invite** so they can view their sessions and goals online.
- Attach **resources** such as homework sheets, links, or files.
- Review their complete **session and invoice history** from the client detail page.
    `,
  },
  {
    slug: 'logging-a-session',
    title: 'Logging a Session',
    category: 'sessions',
    description: 'How to log a therapy session, including the pricing preview and submission workflow.',
    walkthrough: 'log-session',
    relatedArticles: ['group-sessions', 'approving-sessions'],
    content: `
## Logging a Session

Every session you provide should be logged in MCA Manager. Logged sessions flow into invoicing and contractor pay tracking automatically.

### Steps to Log a Session

1. Click **Sessions** in the sidebar, then click **New Session**. On mobile, tap the floating action button at the bottom of the screen.
2. Fill in the session details:
   - **Date** - The date the session took place.
   - **Time** - Session start time.
   - **Duration** - Select 30, 45, 60, or 90 minutes.
   - **Service Type** - The type of therapy provided. Only service types you are authorized for will appear.
   - **Client(s)** - Select the client. For group sessions, you can select multiple clients.
   - **Internal Notes** - Notes for your team. These are encrypted and never visible to clients.
   - **Client Notes** - Notes that may be shared with the client through the portal.
3. Click **Save as Draft** to save without submitting, or **Submit** to send for admin review.

### Service Types and Restrictions

Service types are configured by your organization. Some types are restricted to specific contractors, so you may not see all available service types. Admin-only work types (such as administrative tasks) may not require a client.

### Remembered Defaults

The session form remembers your last-used time, duration, and service type. These are pre-filled the next time you open the form to speed up repeat entries.

### Quick Session on Mobile

On mobile devices, contractors see a floating action button that opens a simplified quick-log drawer at the bottom of the screen. This lets you capture the essential details and submit in seconds without leaving your current view.

### Pricing Preview

After selecting a service type and client, a pricing summary appears below the form. Contractors see their expected earnings. Admins and owners see the full financial breakdown including total, MCA cut, contractor pay, and any rent.

### After Submitting

Once submitted, a session goes to an admin for review. You can view its status on the Sessions page. If it is rejected, you will see the reason and can edit and resubmit. After approval, an invoice is automatically created.

If you want to log another session right away, click the **Log Another** button that appears on the success screen.
    `,
  },
  {
    slug: 'group-sessions',
    title: 'Group Sessions',
    category: 'sessions',
    description: 'How group session pricing works, including the solo exception and total cap.',
    relatedArticles: ['logging-a-session', 'configuring-services'],
    content: `
## Group Sessions

Group sessions let you log one session with multiple clients attending at the same time. Pricing scales based on the number of attendees.

### How It Works

To log a group session, select a service type that has a per-person rate greater than zero. After selecting the service type, the client selector allows you to add multiple clients.

### Pricing Formula

The total for a group session is calculated as:

**Total = Base Rate + (Per-Person Rate x Number of Attendees)**

For example, with a base rate of $50 and a per-person rate of $20:
- 1 attendee: $50 (solo exception applies, see below)
- 3 attendees: $50 + ($20 x 3) = $110
- 8 attendees: would be $210, but capped at $150 (if a total cap is configured)

### Solo Exception

If only one person shows up to a group session, the per-person rate is not applied. The total is just the base rate. This prevents over-charging a single client for a session designed for a group.

### Total Cap

Some service types have a maximum total defined. If the calculated total would exceed that cap, the total is set to the cap amount instead. The contractor's pay is derived from the capped total.

### Contractor Pay

Contractor earnings scale with the headcount the same way the total does. As more clients attend, both the total billed and the contractor's pay increase (up to any configured cap).

### Separate Invoices

Even though it is one session, a separate invoice is generated for each client who attended. Each client's invoice reflects their portion of the session cost.
    `,
  },
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

1. A contractor logs a session and submits it.
2. An admin reviews and approves the session on the Sessions page.
3. The system immediately creates a new invoice for the client in "Pending" status.
4. The invoice appears in the Invoices section, ready to be sent.

### What Is on an Invoice

- Client name and contact information
- Session date, time, and duration
- Service type and rate
- Financial breakdown: total amount, MCA portion, contractor portion
- Payment instructions (configured in Settings)
- An activity log showing status changes and when it was sent or paid

### Invoice Statuses

- **Pending** - Created but not yet sent to the client.
- **Sent** - Delivered to the client by email or Square.
- **Paid** - Payment has been received and recorded.

Sent invoices that are past their due date are displayed with an **Overdue** indicator and a count of days late. This is a visual flag, not a separate status.

### Scholarship Sessions

Scholarship clients are handled differently. Sessions for scholarship clients are NOT automatically invoiced one at a time. Instead, they are batched monthly and invoiced together from the Scholarship tab on the Invoices page.

### Automation

You can configure the app to send invoices automatically when a session is approved, rather than waiting for manual action. See Settings > Customize and Automate > Automation tab.
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

1. Navigate to **Invoices** in the sidebar.
2. Click on the invoice you want to send.
3. On the invoice detail page, open the **InvoiceActions** dropdown.
4. Choose **Send via Email** to email the invoice with a PDF attachment, or **Send via Square** to create a Square invoice with an online payment link.

### Sending via Square

When you use the Square option, a Square invoice is created in your connected Square account and sent to the client automatically. When the client pays using the Square link, MCA Manager receives a webhook notification and marks the invoice as paid without any manual action.

### Bulk Actions

To handle multiple invoices at once:

1. Go to the Invoices list.
2. Use the checkboxes to select the invoices you want to act on.
3. Open the bulk actions menu and choose **Mark Sent**, **Mark Paid**, or **Export CSV**.

This is useful for recording offline payments or preparing a batch export for your records.

### Downloading a PDF

From any invoice detail page, you can download a PDF copy of the invoice using the download button. The PDF includes all financial details and your organization's payment instructions.

### Auto-Send

If you would prefer invoices to be sent immediately when sessions are approved, you can enable auto-send in **Settings > Customize and Automate > Automation**. This removes the need to manually trigger each send.
    `,
  },
  {
    slug: 'inviting-team-members',
    title: 'Inviting Team Members',
    category: 'team',
    description: 'How to invite contractors and admins to your organization.',
    walkthrough: 'invite-contractor',
    adminOnly: true,
    relatedArticles: ['managing-contractor-rates', 'configuring-services'],
    content: `
## Inviting Team Members

Add contractors and admins to your organization so they can log sessions or help manage the practice.

### Steps to Invite Someone

1. Click **Team** in the sidebar.
2. Click the **Invite Team Member** button in the top-right corner.
3. Select a role for the new member (Contractor or Admin).
4. Enter their email address (optional — you can also generate and share a link directly).
5. Click **Send Invite** to email the link, or **Generate invite link** to copy it manually.

The invite link is single-use and expires after 30 days. If you include an email, the person receives a message with a link to create their account and join your organization.

### Roles Explained

- **Contractor** - Can log sessions, view their own submitted and approved sessions, and track their own earnings. Cannot see other contractors' data, client lists, or invoices.
- **Admin** - Can manage clients, review and approve sessions, send invoices, and view the team list. Cannot access payroll, analytics, or sensitive financial reporting.
- **Owner** - Full access to everything, including payroll, analytics, settings, and billing configuration.

### Viewing the Team List

The Team page shows all active team members with their name, role, total sessions logged, total earnings, and amount of pending pay. Click on any team member to open their detail view.

### Team Member Detail

From a team member's detail page, you can view their stats, see their recent sessions and invoices, and manage their custom pay rates per service type.

### Deactivating a Team Member

When someone leaves, deactivate their account rather than deleting it. Deactivated users cannot log in, but all of their historical session and payment records are preserved. This is important for accurate financial records.
    `,
  },
  {
    slug: 'configuring-services',
    title: 'Configuring Service Types',
    category: 'settings',
    description: 'How to set up service types, pricing fields, and contractor restrictions.',
    walkthrough: 'configure-services',
    adminOnly: true,
    relatedArticles: ['group-sessions', 'managing-contractor-rates', 'scholarship-billing'],
    content: `
## Configuring Service Types

Service types define what your organization offers and how each service is priced. They control both what clients are billed and what contractors are paid.

### Where to Find It

Navigate to **Settings > Business Rules > Services** tab.

### Fields When Creating or Editing a Service Type

- **Name** - A descriptive label shown on sessions and invoices (e.g., "Individual Music Therapy").
- **Base Rate** - The price for a standard 30-minute session.
- **Per-Person Rate** - Additional amount per attendee for group services. Set to 0 for individual services.
- **MCA Percentage** - The percentage of the total that stays with the organization.
- **Contractor Cap** - Optional maximum amount a contractor can earn per session.
- **Total Cap** - Optional maximum total that can be billed, regardless of headcount.
- **Rent Percentage** - Percentage withheld for location rent (e.g., Matt's Music).
- **Location** - The facility where this service is provided.
- **Requires Client** - Turn this off for administrative tasks that do not involve a specific client.
- **Restrict to Contractors** - Limit which contractors can select this service type when logging sessions.
- **Scholarship Service** - Mark this type as a scholarship service and set a flat scholarship rate per session.
- **Contractor Pay Schedule** - A duration-to-pay mapping (e.g., 30 min = $38.50, 45 min = $54.00) used for precise contractor pay calculations.

### Notes on Pricing

Duration scales from the base rate, which is defined for 30 minutes. A 60-minute session is twice the base rate, a 90-minute session is three times the base rate.

For scholarship services, the total billed is the flat scholarship rate regardless of duration. The contractor is still paid based on normal pricing rules, and the organization absorbs any difference.
    `,
  },
  {
    slug: 'managing-contractor-rates',
    title: 'Managing Contractor Pay Rates',
    category: 'team',
    description: 'How to set custom per-contractor pay rates per service type.',
    adminOnly: true,
    relatedArticles: ['inviting-team-members', 'configuring-services'],
    content: `
## Managing Contractor Pay Rates

MCA Manager supports custom pay rates per contractor per service type. This lets you give individual contractors different base pay, such as when a raise has been negotiated.

### Where to Find It

There are two places to manage contractor rates:

1. **Team > Rates tab** - A Pay Rate Matrix grid showing all contractors across all service types. You can see and edit every rate in one place.
2. **Team > [Member Name] > Rates tab** - The rates for a single contractor, listed by service type.

### How It Works

Each rate is a custom 30-minute base pay amount. When you set a rate for a contractor on a specific service type, that rate is used instead of the default calculated from the service type's pricing formula.

Rates are "baked-in raises." The number you enter already includes any raise. There is no separate rate history or adjustment record.

### Non-30-Minute Sessions

For sessions longer than 30 minutes, the contractor's pay is calculated as:

**Pay = Custom Rate + (Schedule Offset for Duration)**

The schedule offset comes from the service type's contractor pay schedule. For example, if the schedule shows 30 min = $38.50 and 60 min = $65.00, the offset for 60 minutes is $26.50. A contractor with a custom 30-min rate of $45.00 would earn $71.50 for a 60-minute session.

### Missing Rates Warning

The Dashboard shows a warning if any contractor has logged sessions for a service type without a configured pay rate. This helps you catch gaps before they affect payroll.

### Deleting a Rate

If you remove a custom rate, the system falls back to calculating contractor pay from the service type formula.
    `,
  },
  {
    slug: 'approving-sessions',
    title: 'Approving and Managing Sessions',
    category: 'sessions',
    description: 'How to review, approve, reject, and manage submitted sessions.',
    walkthrough: 'approve-sessions',
    adminOnly: true,
    relatedArticles: ['logging-a-session', 'generating-invoices'],
    content: `
## Approving and Managing Sessions

After a contractor submits a session, it enters a review queue. As an admin or owner, you decide whether to approve, reject, or otherwise handle each session.

### Where to Find Submitted Sessions

Go to the **Sessions** page and filter by status "Submitted." All sessions waiting for review will appear here.

### Available Actions

- **Approve** - Confirms the session. An invoice is automatically created for the client (unless the client is on a scholarship payment method).
- **Reject** - Returns the session to draft status with a reason. The contractor can see your note, make changes, and resubmit.
- **Mark No-Show** - Used when a client did not attend. A flat no-show fee is charged to the client, and the contractor still receives their normal session pay.
- **Cancel** - Removes the session from billing entirely. No invoice is created.
- **Delete** - Permanently removes the session. Use only when the session was logged in error.

### Bulk Approve

To approve multiple sessions at once:

1. Use the checkboxes on the Sessions list to select all submitted sessions.
2. Open the bulk actions menu.
3. Click **Approve**.

This is useful at the end of a pay period when all submissions are ready to process at once.

### After Rejection

Rejected sessions return to draft status and appear in the contractor's Sessions list with a rejection indicator and the reason you provided. The contractor edits the session and resubmits, at which point it returns to your review queue.

### After Approval

Once approved, the session status changes to "Approved" and an invoice is created automatically. If auto-send is enabled in Settings, the invoice is also sent to the client immediately.
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

All generated invoices start in **Pending** status. Review them before sending to make sure the details are correct. Once generated, batch invoices appear under the "Batch Invoices" section on the same tab.

### Scholarship Rate

The invoice amount is based on the flat scholarship rate configured on the service type, not the standard session rate. The rate is the same regardless of session duration. You can set this rate in **Settings > Services** when editing a service type.

### Contractor Pay

Contractors are paid based on normal pricing rules, not the scholarship rate. If the scholarship rate is lower than what the contractor would normally earn, the organization absorbs the difference. This means switching a client to scholarship does not affect contractor compensation.

### Auto-Generation

If you prefer to automate this process, go to **Settings > Customize and Automate > Automation** and enable auto-generate for scholarship invoices. You can set a day of the month (1-28) on which invoices are automatically created, covering the previous month's unbilled sessions. Generated invoices start in Pending status so you can review them before sending.

### Setting Up Scholarship Billing

1. **Configure a scholarship service type** - Go to Settings > Services, create or edit a service type, and check "Scholarship Service". Set the flat scholarship rate.
2. **Set client payment method** - Go to Clients, edit the client, and set their payment method to "Scholarship".
3. **Log sessions as usual** - Contractors log sessions normally. The system automatically routes scholarship sessions to batch invoicing.
4. **Generate invoices monthly** - Visit the Scholarship tab on Invoices and click Generate, or enable auto-generation in Settings.
    `,
  },
  {
    slug: 'analytics-and-reports',
    title: 'Analytics and Reports',
    category: 'analytics',
    description: 'How to use the Analytics section to review revenue, sessions, and payment status.',
    adminOnly: true,
    relatedArticles: ['payroll-and-payments'],
    content: `
## Analytics and Reports

The Analytics section gives owners and developers a financial and operational overview of the practice. It is not visible to contractors or standard admins.

### Where to Find It

Click **Analytics** in the sidebar. This item is visible only to owner and developer roles.

### Date Ranges

Use the date range selector at the top of the page to change the reporting period. Available options are:

- **3 Months** - The last three full months.
- **6 Months** - The last six full months.
- **12 Months** - The last twelve full months.
- **YTD** - The current calendar year to date.

### Summary Cards

At the top of the Analytics page, four summary cards give you a quick snapshot:

- **Total Revenue** - All amounts billed to clients in the selected period.
- **MCA Earnings** - The organization's share of revenue after contractor pay and rent.
- **Total Sessions** - The number of approved sessions in the period.
- **Active Clients** - Clients who had at least one session in the period.

### Charts

- **Revenue by Month** - A bar chart showing total billing per month. Useful for spotting seasonal patterns.
- **Sessions: Individual vs. Group** - A breakdown of session types over time.
- **Payment Status** - A pie chart showing the proportion of invoices that are paid, pending, overdue, or sent.

### Payment Summary Table

Below the charts, a table lists payment totals by payment method and status. This gives you a detailed view of where revenue is coming from and what is still outstanding.
    `,
  },
  {
    slug: 'payroll-and-payments',
    title: 'Payroll and Payments',
    category: 'analytics',
    description: 'How to track contractor pay, record payments, and reconcile Square invoices.',
    adminOnly: true,
    relatedArticles: ['analytics-and-reports', 'managing-contractor-rates'],
    content: `
## Payroll and Payments

The Payroll section is where you track what you owe contractors and record when they have been paid. It is available to owners and developers only.

### Where to Find It

Click **Billing > Payroll** in the sidebar.

### Payroll Hub Tab

The Payroll Hub lists all contractors who have approved, unpaid sessions. For each contractor, you can see:

- Total amount owed based on approved sessions.
- A breakdown by service type and session date.
- A button to **Mark as Paid**, which records the payment and removes those sessions from the unpaid queue.

Use this tab at the end of each pay period to process contractor payments.

### Payment History Tab

The Payment History tab shows a summary of all recorded payments per contractor. Each contractor's row can be expanded to see individual payment events with dates and amounts. This gives you a full audit trail of what has been paid and when.

### Invoice Reconciliation Tab

The Invoice Reconciliation tab tracks Square payment activity. It shows Square invoices, their status, and whether the corresponding MCA invoice has been marked as paid. Use this to catch any discrepancies between what Square has collected and what is recorded in MCA Manager.

### Connecting to Analytics

For a broader view of revenue and earnings trends, see the Analytics page. Payroll focuses on operational payment tracking, while Analytics focuses on financial reporting and charts.
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

Once the feature is enabled, you can invite individual clients:

1. Go to **Clients** and open the client's detail page.
2. Click **Send Portal Invite**.
3. The client receives an email with a secure access link.

The link is token-based, meaning no password is required. The client clicks the link and is taken directly to their portal. Links expire after a configurable number of days (set in Settings).

### What Clients See

- **Dashboard** - A summary of upcoming sessions, active goals, and pending to-do items.
- **Sessions** - A list of past and upcoming sessions. Clients can submit a session request with preferred dates.
- **Goals** - Therapy goals with progress tracking. Your team manages the goal entries; clients can view progress notes.
- **Resources** - Homework assignments, links, and files your team has shared with them.

### Session Requests

Clients can request a new session from the portal by submitting preferred dates and times. The request appears in your MCA Manager account for review. You can approve or decline and schedule accordingly.

### Token Expiry

Portal links expire after a set number of days. You can configure the expiry in **Settings > Business Rules > Sessions** tab, under the Client Portal section. After a link expires, you send a new invite to regenerate access.
    `,
  },
  {
    slug: 'automation-settings',
    title: 'Automation Settings',
    category: 'settings',
    description: 'How to configure automatic session approval, invoice sending, and scholarship billing.',
    adminOnly: true,
    relatedArticles: ['generating-invoices', 'scholarship-billing', 'configuring-services'],
    content: `
## Automation Settings

Automation settings let you reduce manual steps in your workflow by enabling automatic actions for common tasks.

### Where to Find It

Navigate to **Settings > Customize and Automate** and click the **Automation** tab.

### Auto-Approve Sessions

When enabled, submitted sessions are automatically approved without requiring manual review. This is useful if you have trusted contractors and want to speed up the invoicing process.

Caution: with auto-approval on, there is no human review step before an invoice is created.

### Auto-Send Invoice on Approval

When enabled, invoices are automatically sent to clients as soon as the corresponding session is approved (or auto-approved). You can choose to send by email or by Square.

This eliminates the step of manually opening each invoice and clicking Send.

### Auto-Generate Scholarship Invoices

When enabled, scholarship invoices are automatically generated on a configurable day of the month. The system looks at all approved, unbilled scholarship sessions from the previous month and creates invoices for each client.

You set the day of the month (for example, the 1st or 15th), and the system handles the rest. Generated invoices start in Pending status so you can review them before sending.

### Custom Lists Tab

Also on the Customize and Automate page, the **Custom Lists** tab lets you:

- Rename payment methods and billing methods to match the terminology your organization uses.
- Show or hide specific payment methods and billing methods from the client creation form.

This keeps the interface clean and avoids confusion from options that are not relevant to your practice.
    `,
  },
  {
    slug: 'view-as-mode',
    title: 'View As Mode',
    category: 'getting-started',
    description: 'How to simulate another role or contractor view to verify permissions and data.',
    adminOnly: true,
    relatedArticles: ['getting-started'],
    content: `
## View As Mode

View As mode lets owners simulate the experience of any other role or specific contractor in the system. This is useful for verifying what team members can see, checking their earnings data, or debugging permission issues.

### Where to Find It

Look for the **View As** button in the header bar at the top of the page. It appears next to the organization name and is available to owners and developers.

### How It Works

After clicking View As, a dropdown menu opens where you can choose to simulate:

- A specific **role** (Contractor, Admin) - shows a generic view of that permission level.
- A specific **team member** - shows exactly what that contractor sees, including their sessions, earnings, and navigation.

Once View As mode is active, all data, statistics, permissions, and navigation items change to match the selected role or contractor. You are effectively seeing the app through their eyes.

### Amber Indicator

When View As mode is active, an amber banner or indicator appears in the header. This reminds you that you are not looking at your own data. The indicator is always visible so you do not accidentally make decisions based on the simulated view.

### Returning to Your Own View

Click the **Back to Owner** button shown in the header or in the View As menu to exit simulation mode and return to your normal view. All data immediately returns to your own account's perspective.

### Common Use Cases

- Confirming that a contractor can only see their own sessions and not other contractors' data.
- Checking a contractor's earnings total matches what you expect to pay.
- Troubleshooting a report that a contractor cannot find a service type or session.
- Demonstrating the app to a new contractor before their account is set up.
    `,
  },
  {
    slug: 'my-earnings',
    title: 'My Earnings',
    category: 'analytics',
    description: 'How to track your earnings, view payment history, and understand your pay breakdown.',
    relatedArticles: ['logging-a-session', 'payroll-and-payments'],
    content: `
## My Earnings

The Earnings page is your personal financial dashboard as a contractor. It shows what you have earned, what has been paid, and what is still pending.

### Where to Find It

Click **Earnings** in the sidebar. This page is visible only to contractors (and to owners using View As mode).

### Summary Cards

At the top of the page, four cards give you a quick snapshot:

- **YTD Earnings** - Your total earnings since January 1st of the current year, with a count of how many sessions that covers.
- **Paid Out** - How much has actually been paid to you so far.
- **Pending** - Earnings from approved sessions that have not been paid yet.
- **This Month** - Your earnings for the current calendar month.

### Monthly Chart

A bar chart shows your earnings over the last six months, making it easy to see trends in your workload.

### Monthly Breakdown

Below the chart, each month is listed with the total number of sessions and your earnings for that period. This gives you a detailed, month-by-month record of your pay.

### How Pay Is Calculated

Your earnings are calculated from the service type pricing, your custom pay rate (if one has been set), and the session duration. If you have questions about how a specific amount was calculated, ask your admin to check the pricing breakdown on the session detail page.
    `,
  },
  {
    slug: 'profile-and-security',
    title: 'Profile & Security Settings',
    category: 'settings',
    description: 'How to update your profile, set up two-factor authentication, and configure security policies.',
    adminOnly: false,
    relatedArticles: ['getting-started'],
    content: `
## Profile & Security Settings

Manage your personal information and account security from the Profile & Security page.

### Where to Find It

Navigate to **Settings > Profile & Security**.

### Profile

Update your display name and phone number. These are visible to your team members and may appear on communications.

### Account Details

Your email, role, and organization are displayed for reference. These are read-only and can only be changed by an administrator.

### Two-Factor Authentication (MFA)

MFA adds an extra layer of security to your account by requiring a code from an authenticator app in addition to your password.

To set up MFA:

1. Open Profile & Security.
2. In the MFA Setup section, follow the prompts to link an authenticator app (such as Google Authenticator or Authy).
3. Scan the QR code with your app and enter the verification code to confirm.

Once enabled, you will be asked for a code each time you log in. If your organization has enforced MFA, you will be required to set it up before you can use the app.

### Security Policies (Owner Only)

Owners can configure organization-wide security settings:

- **Session Timeout** - How many minutes of inactivity before a user is automatically logged out (5 to 120 minutes, default 30).
- **Require Two-Factor Authentication** - When enabled, all users in the organization must set up MFA.
- **Max Login Attempts** - How many failed login attempts before an account is temporarily locked (3 to 10, default 5).
- **Lockout Duration** - How long a locked account stays locked, in minutes (5 to 60, default 15).
    `,
  },
  {
    slug: 'practice-branding',
    title: 'Practice & Branding',
    category: 'settings',
    description: 'How to customize your logo, brand colors, business details, and regional settings.',
    adminOnly: true,
    relatedArticles: ['getting-started', 'automation-settings'],
    content: `
## Practice & Branding

Customize how your practice appears on invoices, emails, and the client portal.

### Where to Find It

Navigate to **Settings > Practice & Branding**. This page is available to owners only.

### Organization Details

Set your practice name, email, phone, mailing address, and website. These appear on invoices and other communications sent to clients.

### Logo

Upload your practice logo. It will appear on invoices, email headers, and the client portal. If no logo is uploaded, your practice initials are displayed instead.

### Brand Colors

Choose a **primary color** and **secondary color** using the color pickers. These colors are used on invoice headers, email templates, and portal buttons to give your communications a consistent brand identity.

### Live Preview

As you make changes, a live preview panel shows how your branding looks across three contexts:

- **Invoice** - Header with your logo, name, and tagline.
- **Email** - Email template with branded header and action button.
- **Client Portal** - Portal header as clients will see it.

### Business Details

- **Tagline** - A short phrase that appears under your practice name on invoices and emails.
- **Business Description** - A brief description of your practice.
- **Tax ID / EIN** - Optional. If provided, it is printed on invoices.

### Regional Settings

- **Timezone** - Select your local timezone (US timezones are available).
- **Currency** - Choose your currency (USD, CAD, EUR, or GBP).

### Social Media

Optionally link your Facebook, Instagram, LinkedIn, YouTube, Twitter/X, and TikTok profiles. These may be displayed on your public-facing pages.
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
  {
    slug: 'appearance-and-dark-mode',
    title: 'Appearance & Dark Mode',
    category: 'getting-started',
    description: 'How to switch between light mode, dark mode, and system theme.',
    relatedArticles: ['getting-started'],
    content: `
## Appearance & Dark Mode

MCA Manager supports light and dark color themes so you can work comfortably in any lighting.

### How to Switch Themes

Click the **sun or moon icon** in the top-right corner of the header (next to your avatar). A dropdown menu appears with three options:

- **Light** - Always use the light theme.
- **Dark** - Always use the dark theme.
- **System** - Automatically match your device's theme setting. If your phone or computer switches to dark mode at night, MCA Manager follows along.

The active theme is labeled "Active" in the dropdown. Your preference is saved and persists across sessions.
    `,
  },
  {
    slug: 'exporting-data',
    title: 'Exporting Data',
    category: 'analytics',
    description: 'How to export sessions and invoices as CSV files for your records.',
    adminOnly: true,
    relatedArticles: ['analytics-and-reports', 'payroll-and-payments'],
    content: `
## Exporting Data

MCA Manager lets you export session and invoice data as CSV files for use in spreadsheets, accounting software, or your own records.

### Exporting Invoices

1. Go to **Invoices** in the sidebar.
2. Use the checkboxes to select the invoices you want to export.
3. A blue action bar appears at the top showing the count and total amount.
4. Click **Export CSV**.

The downloaded file includes columns for client name, service type, date, payment method, amount, and status.

### Exporting Sessions

Session data can be exported through the API at \`/api/sessions/export\`. Admins see all sessions; contractors see only their own. The export supports optional date range and client filters.

The CSV includes date, time, duration, status, service type, contractor, clients, group headcount, and session notes (automatically decrypted).

### Tips

- Use invoice export at the end of each month to reconcile with your accounting records.
- Filter by date range or client before exporting to narrow down the data you need.
    `,
  },
  {
    slug: 'audit-log',
    title: 'Audit Log',
    category: 'settings',
    description: 'How to use the audit log to track all data changes for compliance.',
    adminOnly: true,
    relatedArticles: ['profile-and-security'],
    content: `
## Audit Log

The audit log records every data change in the system, providing a complete compliance trail for HIPAA and business auditing purposes.

### Where to Find It

Navigate to **Settings > Audit Log**. This page is available to owners only.

### What Is Tracked

Every create, update, and delete action on the following tables is logged: sessions, invoices, clients, users, service types, session attendees, organizations, contractor rates, client goals, invites, portal tokens, session requests, and client resources.

Each log entry records the timestamp, the action performed, which table was affected, the record ID, and who made the change.

### Filtering the Log

Use the controls at the top to narrow down the log:

- **Search** - Find entries by user email or record ID.
- **Table filter** - Show only changes to a specific table (e.g., Sessions, Invoices, Clients).
- **Action filter** - Show only Created, Updated, or Deleted entries.

### Viewing Details

Click the **eye icon** on any log entry to open a detail view showing:

- For **updates**: which fields changed, with a side-by-side "before" and "after" comparison.
- For **creates**: the full record data as it was created.
- For **deletes**: the full record data as it existed before deletion.

### Pagination

The log shows 20 entries per page. Use the Previous and Next buttons to navigate through the history.
    `,
  },
]

export function getArticleBySlug(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find(article => article.slug === slug)
}

export function getArticlesByCategory(category: HelpCategory): HelpArticle[] {
  return HELP_ARTICLES.filter(article => article.category === category)
}

export type SearchResult = {
  article: HelpArticle
  score: number
  excerpt: string
  matchTerms: string[]
}

/** Strip markdown formatting for plain-text search and excerpts. */
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, '')       // headings
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1') // bold/italic
    .replace(/`([^`]+)`/g, '$1')     // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/^[-*]\s+/gm, '')       // list markers
    .replace(/^\d+\.\s+/gm, '')      // numbered list markers
    .replace(/\n{2,}/g, ' ')         // collapse blank lines
    .replace(/\n/g, ' ')             // newlines to spaces
    .trim()
}

/** Build excerpt (~150 chars) around the first match in content. */
function buildExcerpt(content: string, terms: string[]): string {
  const plain = stripMarkdown(content)
  const lower = plain.toLowerCase()

  // Find earliest match position
  let earliest = -1
  for (const term of terms) {
    const idx = lower.indexOf(term.toLowerCase())
    if (idx !== -1 && (earliest === -1 || idx < earliest)) {
      earliest = idx
    }
  }

  if (earliest === -1) return plain.slice(0, 150).trim() + '...'

  // Center the excerpt around the match
  const start = Math.max(0, earliest - 60)
  const end = Math.min(plain.length, earliest + 90)
  let excerpt = plain.slice(start, end).trim()

  if (start > 0) excerpt = '...' + excerpt
  if (end < plain.length) excerpt = excerpt + '...'

  return excerpt
}

/** Ranked search with scoring, fuzzy partial matching, and excerpts. */
export function searchArticlesRanked(query: string): SearchResult[] {
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0)
  if (terms.length === 0) return []

  const results: SearchResult[] = []

  for (const article of HELP_ARTICLES) {
    const titleLower = article.title.toLowerCase()
    const descLower = article.description.toLowerCase()
    const contentLower = article.content.toLowerCase()

    let score = 0
    const matchedTerms: string[] = []

    for (const term of terms) {
      let termMatched = false

      // Title scoring
      if (titleLower.includes(term)) {
        score += titleLower === term ? 10 : 5
        termMatched = true
      }

      // Description scoring
      if (descLower.includes(term)) {
        score += 3
        termMatched = true
      }

      // Content scoring
      if (contentLower.includes(term)) {
        score += 1
        termMatched = true
      }

      if (termMatched) {
        matchedTerms.push(term)
      }
    }

    // Bonus: all query terms matched
    if (matchedTerms.length === terms.length && terms.length > 1) {
      score += 3
    }

    if (score > 0) {
      results.push({
        article,
        score,
        excerpt: buildExcerpt(article.content, matchedTerms),
        matchTerms: matchedTerms,
      })
    }
  }

  return results.sort((a, b) => b.score - a.score)
}

/** Simple search (backwards-compatible). */
export function searchArticles(query: string): HelpArticle[] {
  return searchArticlesRanked(query).map(r => r.article)
}
