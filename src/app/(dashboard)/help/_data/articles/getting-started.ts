import type { HelpArticle } from '../types'

export const GETTING_STARTED_ARTICLES: HelpArticle[] = [
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

- **Clients** - Add, edit, and manage your full client list. Send a portal invite when adding a new client, and view session/invoice history per client.
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
]
