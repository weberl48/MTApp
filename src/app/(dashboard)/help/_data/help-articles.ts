export type HelpCategory =
  | 'getting-started'
  | 'clients'
  | 'sessions'
  | 'invoices'
  | 'settings'

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
  { id: 'clients', name: 'Clients', description: 'Managing your client list' },
  { id: 'sessions', name: 'Sessions', description: 'Logging and tracking sessions' },
  { id: 'invoices', name: 'Invoices', description: 'Billing and payments' },
  { id: 'settings', name: 'Settings', description: 'Configuration and preferences' },
]

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: 'getting-started',
    title: 'Getting Started with MCA Manager',
    category: 'getting-started',
    description: 'An overview of the app and how to navigate its main features.',
    walkthrough: 'app-overview',
    content: `
## Welcome to MCA Manager

MCA Manager helps you track sessions, manage clients, and handle invoicing for your music/art therapy practice.

### Main Sections

- **Dashboard** - Your home base with quick stats and recent activity
- **Sessions** - Log therapy sessions and track their status
- **Clients** - Manage your client list (admins only)
- **Invoices** - View and send invoices (admins only)
- **Settings** - Configure your account and organization

### Quick Tips

1. **Log sessions regularly** - Sessions are the foundation of everything. Log them as soon as possible after they happen.
2. **Check invoice status** - Invoices are automatically generated from approved sessions. Keep an eye on which ones are pending payment.
3. **Use the mobile app** - Add MCA Manager to your home screen for quick access on the go.

### For Contractors

As a contractor, you'll primarily use:
- **Dashboard** to see your earnings summary
- **Sessions** to log your therapy sessions
- **Earnings** to track your pay periods

### For Admins/Owners

You have additional access to:
- **Clients** management
- **Invoices** and billing
- **Team** management
- **Analytics** and reporting
- **Payments** for contractor payroll
    `,
  },
  {
    slug: 'adding-a-client',
    title: 'Adding a Client',
    category: 'clients',
    description: 'How to add a new client to your practice.',
    walkthrough: 'add-client',
    adminOnly: true,
    relatedArticles: ['logging-a-session'],
    content: `
## Adding a New Client

Clients are the foundation of your practice management. Before you can log sessions, you need to add your clients.

### Steps to Add a Client

1. Navigate to **Clients** in the sidebar
2. Click the **Add Client** button in the top right
3. Fill in the client details:
   - **Name** - The client's full name
   - **Email** (optional) - For sending invoices directly
   - **Phone** (optional) - Contact number
   - **Payment Method** - How this client pays (Private Pay, Self-Directed, Group Home, Scholarship)
4. Click **Save** to create the client

### Payment Methods Explained

- **Private Pay** - Client pays directly
- **Self-Directed** - Client is reimbursed (often slower payments)
- **Group Home** - Facility billing
- **Scholarship** - Paid through scholarship fund

### Tips

- You can edit client details anytime by clicking on their name
- Archive clients who are no longer active instead of deleting them
- The payment method affects how invoices are generated and tracked
    `,
  },
  {
    slug: 'logging-a-session',
    title: 'Logging a Session',
    category: 'sessions',
    description: 'How to log a therapy session.',
    walkthrough: 'log-session',
    relatedArticles: ['group-sessions', 'adding-a-client'],
    content: `
## Logging a Session

Sessions are the core of MCA Manager. Every session you log creates records for billing and contractor payments.

### Steps to Log a Session

1. Click **Sessions** in the sidebar, then **New Session** (or use the + button on mobile)
2. Select the **Client** from the dropdown
3. Choose the **Service Type** (e.g., Individual Music Therapy, Group Session)
4. Set the **Date and Time** of the session
5. Enter the **Duration** in minutes
6. Optionally add **Notes** about the session
7. Click **Save as Draft** or **Submit**

### Session Status Workflow

- **Draft** - Work in progress, not yet submitted
- **Submitted** - Ready for admin review
- **Approved** - Confirmed and ready for invoicing
- **Invoiced** - An invoice has been generated

### Tips

- Save as draft if you need to add details later
- Submit sessions promptly for faster invoicing
- Session notes are encrypted for HIPAA compliance
    `,
  },
  {
    slug: 'group-sessions',
    title: 'Group Sessions',
    category: 'sessions',
    description: 'How to log sessions with multiple attendees.',
    relatedArticles: ['logging-a-session'],
    content: `
## Logging Group Sessions

Group sessions allow you to log one session with multiple clients attending.

### How Group Pricing Works

- The base rate applies to the first attendee
- Each additional attendee adds the **per-person rate** defined in the service type
- Separate invoices are generated for each attendee

### Steps to Log a Group Session

1. Start creating a new session as usual
2. Select a **Service Type** that supports groups (has a per-person rate)
3. Click **Add Attendee** to add more clients
4. Select each client who attended
5. The pricing preview will update to show the total and per-client breakdown
6. Submit the session

### Example

If your "Group Music Therapy" service has:
- Base rate: $80
- Per-person rate: $20

A session with 3 attendees would be:
- Total: $80 + $20 + $20 = $120
- Each client's invoice: $40

### Tips

- All attendees share the same session notes
- You can remove attendees before submitting if someone didn't attend
- Group sessions appear once in your session list but generate multiple invoices
    `,
  },
  {
    slug: 'generating-invoices',
    title: 'How Invoices are Generated',
    category: 'invoices',
    description: 'Understanding how invoices are created from sessions.',
    adminOnly: true,
    relatedArticles: ['sending-invoices', 'logging-a-session'],
    content: `
## How Invoices are Generated

Invoices in MCA Manager are automatically created from approved sessions. You don't need to manually create invoices.

### The Invoice Generation Process

1. A contractor logs and submits a session
2. An admin reviews and approves the session
3. The system automatically creates an invoice for the client
4. The invoice appears in the Invoices section with "Pending" status

### What's on an Invoice

- Client name and contact info
- Session date and service type
- Duration and rate
- Total amount due
- Payment instructions (if configured)

### Invoice Statuses

- **Pending** - Generated but not yet sent
- **Sent** - Emailed to the client
- **Paid** - Payment received
- **Overdue** - Past the due date and unpaid

### Tips

- Invoices are tied to sessions - you can't edit the amount directly
- To fix an invoice amount, you need to edit the underlying session
- Use the bulk actions to send multiple invoices at once
    `,
  },
  {
    slug: 'sending-invoices',
    title: 'Sending Invoices',
    category: 'invoices',
    description: 'How to send invoices to clients via email or Square.',
    adminOnly: true,
    relatedArticles: ['generating-invoices'],
    content: `
## Sending Invoices

Once an invoice is generated, you can send it to clients via email or through Square for online payment.

### Sending via Email

1. Navigate to **Invoices**
2. Click on the invoice you want to send
3. Click **Send Invoice**
4. Confirm the client's email address
5. Click **Send**

The client will receive an email with the invoice PDF attached.

### Sending via Square

If Square integration is enabled:

1. Open the invoice
2. Click **Send via Square**
3. The invoice is created in Square and the client receives a payment link
4. When they pay, the invoice is automatically marked as paid

### Bulk Sending

To send multiple invoices at once:

1. Go to the Invoices list
2. Check the boxes next to the invoices you want to send
3. Click **Send Selected**
4. Confirm and send

### Tips

- Clients need an email address to receive invoices
- Square invoices can accept card payments online
- You can resend an invoice if the client didn't receive it
    `,
  },
  {
    slug: 'inviting-team-members',
    title: 'Inviting Team Members',
    category: 'settings',
    description: 'How to invite contractors to join your organization.',
    walkthrough: 'invite-contractor',
    adminOnly: true,
    relatedArticles: ['configuring-services'],
    content: `
## Inviting Team Members

Add contractors to your organization so they can log their own sessions.

### Steps to Invite a Contractor

1. Navigate to **Settings**
2. Click the **Team** tab
3. Click **Invite Team Member**
4. Enter their email address
5. Select their role (usually "Contractor")
6. Click **Send Invite**

The contractor will receive an email with a link to create their account.

### Roles Explained

- **Contractor** - Can log sessions and view their own earnings
- **Admin** - Can manage clients, invoices, and team (but not payments/analytics)
- **Owner** - Full access including payments and analytics

### Managing Team Members

- Click on a team member to view their profile
- You can change their role or deactivate their account
- Deactivated users can't log in but their historical data is preserved

### Tips

- Contractors can only see their own sessions and earnings
- Set up service types before inviting contractors so they can log sessions immediately
- You can resend an invite if they didn't receive it
    `,
  },
  {
    slug: 'configuring-services',
    title: 'Configuring Service Types',
    category: 'settings',
    description: 'How to set up service types and pricing.',
    walkthrough: 'configure-services',
    adminOnly: true,
    relatedArticles: ['inviting-team-members', 'logging-a-session'],
    content: `
## Configuring Service Types

Service types define what services you offer and how they're priced.

### Creating a Service Type

1. Navigate to **Settings**
2. Click the **Services** tab
3. Click **Add Service Type**
4. Fill in the details:
   - **Name** - e.g., "Individual Music Therapy"
   - **Base Rate** - Price for a 30-minute session
   - **Per-Person Rate** - Additional cost per person (for groups, 0 for individual)
   - **MCA Percentage** - Organization's cut (typically 20-30%)
   - **Contractor Cap** - Maximum contractor pay (optional)
5. Click **Save**

### Pricing Formula

For each session:
- **Client pays**: Base rate × (duration / 30) + (per-person rate × additional attendees)
- **MCA receives**: Total × MCA percentage
- **Contractor receives**: Total - MCA cut (up to cap if set)

### Example

"Individual Music Therapy" with:
- Base rate: $100
- MCA percentage: 25%

A 60-minute session:
- Client pays: $100 × 2 = $200
- MCA receives: $200 × 25% = $50
- Contractor receives: $200 - $50 = $150

### Tips

- Duration scales from the 30-minute base rate
- Use contractor caps for high-value sessions to control costs
- You can edit service types anytime - changes apply to new sessions only
    `,
  },
]

export function getArticleBySlug(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find(article => article.slug === slug)
}

export function getArticlesByCategory(category: HelpCategory): HelpArticle[] {
  return HELP_ARTICLES.filter(article => article.category === category)
}

export function searchArticles(query: string): HelpArticle[] {
  const lowerQuery = query.toLowerCase()
  return HELP_ARTICLES.filter(article =>
    article.title.toLowerCase().includes(lowerQuery) ||
    article.description.toLowerCase().includes(lowerQuery) ||
    article.content.toLowerCase().includes(lowerQuery)
  )
}
