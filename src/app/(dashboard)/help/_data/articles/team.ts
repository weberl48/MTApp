import type { HelpArticle } from '../types'

export const TEAM_ARTICLES: HelpArticle[] = [
  {
    slug: 'inviting-team-members',
    title: 'Inviting Team Members',
    category: 'team',
    description: 'How to invite contractors and admins to your organization.',
    walkthrough: 'invite-contractor',
    adminOnly: true,
    relatedArticles: ['managing-contractor-rates', 'configuring-services'],
    keywords: ['invite', 'invite link', 'roles', 'contractor', 'admin', 'remove member'],
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
- **Admin** - Can manage clients, review and approve sessions, send invoices, and view the team list. Cannot access payroll, analytics, contractor pay rates, or sensitive financial reporting.
- **Owner** - Full access to everything, including payroll, analytics, settings, and billing configuration.

### Viewing the Team List

The Team page shows all active team members with their name, role, total sessions logged, total earnings, and amount of pending pay. Click on any team member to open their detail view.

### Team Member Detail

From a team member's detail page, you can view their stats and see their recent sessions and invoices. Owners also get a **Rates** tab there for that contractor's custom pay rates per service type; admins do not see it.

### Removing a Team Member

When someone leaves, you can remove them from a team member's detail menu using **Remove Member**. This is a permanent action — it deletes the person's account and login, and cannot be undone. Only owners (and developers) can remove any member; admins can only remove contractors.

Removal is blocked if the member has ever logged a session — you'll see a message like "Cannot remove: has N session(s)." This protects their historical session and payment records, which must be preserved for accurate financial reporting. In that case, simply stop assigning them new work instead of trying to remove them.
    `,
  },
  {
    slug: 'managing-contractor-rates',
    title: 'Managing Contractor Pay Rates',
    category: 'team',
    description: 'How to set custom per-contractor pay rates per service type.',
    adminOnly: true,
    walkthrough: 'contractor-rates',
    relatedArticles: ['inviting-team-members', 'configuring-services'],
    keywords: ['pay rate', 'custom rate', 'rate matrix', 'raise', 'contractor pay'],
    content: `
## Managing Contractor Pay Rates

MCA Manager supports custom pay rates per contractor per service type. This lets you give individual contractors different base pay, such as when a raise has been negotiated.

### Who Can See Rates

Pay rates are owner-only. Admins can review sessions, manage clients, and handle invoicing, but the Rates tabs described below do not appear for them at all — so contractor pay stays between the contractor and the owner.

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
]
