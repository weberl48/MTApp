import type { HelpArticle } from '../types'

export const GETTING_STARTED_ARTICLES: HelpArticle[] = [
  {
    slug: 'getting-started',
    title: 'Getting Started with MCA Manager',
    category: 'getting-started',
    description: 'An overview of the app and how to navigate its main features.',
    walkthrough: 'app-overview',
    relatedArticles: ['logging-a-session', 'view-as-mode', 'installing-the-app'],
    keywords: ['overview', 'navigation', 'dashboard', 'roles', 'mobile', 'help center', 'walkthrough', 'guided tour', 'setup wizard', 'onboarding'],
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

### The Owner Setup Wizard

New owners see a short **setup wizard** the first time they sign in — six steps that walk through the essentials in order: inviting your team, adding your first client, configuring service types, logging a session, and reviewing the invoices it creates. You can complete it, skip individual steps, or close it and come back: until it's finished or dismissed, a floating **getting started** button stays on screen to reopen it where you left off. Finishing the wizard offers to start the App Overview guided tour described below.

### Guided Tours

The Help Center includes interactive **guided tours** that walk you through real screens step by step, highlighting each button as you go. The **Guided tours** card on the Help Center home page lists them in the recommended order for new team members and tracks which ones you've finished (checkmarks are per-device). When you complete a tour, the app suggests the next one in the sequence. You can retake any tour at any time.

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
    walkthrough: 'view-as',
    keywords: ['simulate role', 'impersonate', 'debugging permissions', 'amber banner', 'back to owner'],
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

When View As mode is active, the **View As** button in the header turns amber and shows who you are viewing as (for example "As Contractor" or "As Jane Doe"). This reminds you that you are not looking at your own data. The indicator stays visible on every page so you do not accidentally make decisions based on the simulated view.

### Returning to Your Own View

Open the **View As** menu again and choose **Owner (actual)** at the top (developers see **Developer (actual)**) to exit simulation mode. All data immediately returns to your own account's perspective. The simulation persists across page navigation until you exit it this way.

### Common Use Cases

- Confirming that a contractor can only see their own sessions and not other contractors' data.
- Checking a contractor's earnings total matches what you expect to pay.
- Troubleshooting a report that a contractor cannot find a service type or session.
- Demonstrating the app to a new contractor before their account is set up.
    `,
  },
  {
    slug: 'appearance-and-dark-mode',
    title: 'Appearance: Themes & Dark Mode',
    category: 'getting-started',
    description: 'How to pick a color theme and switch between light mode, dark mode, and system.',
    relatedArticles: ['getting-started'],
    keywords: ['theme', 'light mode', 'dark mode', 'system theme', 'appearance', 'colors', 'personalize'],
    content: `
## Appearance: Themes & Dark Mode

MCA Manager lets you personalize how the app looks. Click the **palette icon** in the top-right corner of the header (next to your avatar) to open the Appearance menu. It has two sections: **Mode** and **Theme**.

### Mode: Light, Dark, or System

- **Light** - Always use the light mode.
- **Dark** - Always use the dark mode.
- **System** - Automatically match your device's setting. If your phone or computer switches to dark mode at night, MCA Manager follows along.

### Theme: Pick Your Look

Themes change the app's colors, fonts, and overall feel. Every theme works in both light and dark mode, so you can combine any theme with any mode. Choose from:

- **Classic** - The original neutral look (the default).
- **Ocean** - Calm teal-blue, soft and rounded.
- **Forest** - Sage and moss greens, easy on the eyes.
- **Lavender** - Gentle violet, extra round and airy.
- **Sunset** - Warm terracotta with elegant serif headings.
- **Slate** - Dark sidebar with an indigo accent, compact and sharp.
- **Blossom** - Soft rose, warm and nurturing.
- **Sonata** - Sheet-music inspired: paper, ink, and classical type.

### Good to Know

- Your theme is a **personal preference** - it only changes what you see, not what your teammates see.
- It's saved in your browser, so each device remembers its own choice.
- Clients always see your practice's branding in the client portal, no matter which theme you pick.
    `,
  },
  {
    slug: 'installing-the-app',
    title: 'Installing the App on Your Phone or Desktop',
    category: 'getting-started',
    description: 'How to add MCA Manager to your home screen on iPhone, Android, or desktop, and what works offline.',
    adminOnly: false,
    relatedArticles: ['getting-started', 'view-as-mode'],
    keywords: ['install', 'phone', 'mobile', 'iphone', 'android', 'home screen', 'app store'],
    content: `
## Installing the App on Your Phone or Desktop

MCA Manager is a Progressive Web App (PWA). That means you install it directly from your browser — there's no App Store or Play Store listing, no separate download, and no update to approve. It's the same web app you already use, just launched from an icon instead of a browser tab.

### Installing on iPhone (Safari)

1. Open the site in **Safari** (installing from Chrome or another browser on iOS does not offer this option — it must be Safari).
2. Tap the **Share** button (the square with an arrow pointing up), usually at the bottom of the screen.
3. Scroll down and tap **Add to Home Screen**.
4. Confirm the name and tap **Add** in the top-right corner.

An MCA icon now appears on your home screen like any other app.

### Installing on Android (Chrome)

1. Open the site in **Chrome**.
2. You may see an **Install** banner appear automatically at the bottom of the screen — tap it.
3. If you don't see the banner, tap the **three-dot menu** in the top-right corner and choose **Add to Home Screen** or **Install App**.
4. Confirm the prompt.

### Installing on Desktop

Most desktop browsers (Chrome, Edge) show an install icon in the address bar when you visit the site — look for a small monitor-with-arrow icon. Click it, then click **Install**. The app opens in its own window, separate from your regular browser tabs.

### What Happens After You Install

Once installed, the app opens in **standalone mode** — no browser address bar or tabs, just the app itself, exactly like a native app. It uses the same login and the same data as visiting the site in a browser; installing doesn't create a separate account or a separate copy of anything.

### Offline Behavior

A service worker caches pages you've already visited, so pages you've recently viewed can still open without a live internet connection. This is meant for brief connectivity gaps (like a spotty connection at a client's home), not for extended offline use — actions that need to reach the server, like submitting a new session or loading data you haven't viewed before, still require an internet connection.

### Do I Need to Update It?

No manual update step is required. The next time you open the installed app with an internet connection, it automatically loads the latest version. There's nothing to download from a store and nothing to approve.

### Uninstalling

Uninstalling works the same as any other app on your device — long-press the icon on iPhone or Android and remove it, or uninstall it from your desktop's app list. This only removes the shortcut and cached pages; your account and data live on the server and are unaffected.
    `,
  },
  {
    slug: 'ai-helper',
    title: 'The AI Helper',
    category: 'getting-started',
    description: 'What the AI help assistant can answer, where it lives, and what it can and cannot see.',
    adminOnly: false,
    relatedArticles: ['getting-started'],
    keywords: ['ai', 'assistant', 'chatbot', 'ask', 'chat', 'helper', 'bot'],
    content: `
## The AI Helper

The AI helper is a chat assistant that answers questions about how MCA Manager works. Instead of searching the Help Center and reading through articles, you can ask in your own words — "how do scholarship invoices work?", "where do I change the no-show fee?" — and get a short, practical answer.

You'll find it in two places:

- On the **Help Center** page, as the **Ask the AI helper** panel at the top.
- On every other page, as the round sparkle button in the bottom-right corner, which opens the chat in a side panel.

### What it knows

The helper answers from two sources only:

- **The Help Center documentation** — the same articles and FAQs you can read yourself. Every answer ends with links to the articles it relied on, so you can read the full details.
- **Your organization's configuration** — things like your no-show fee, invoice due days, service types and rates, and which features are turned on. That means it can answer "what is *our* no-show fee?" rather than just quoting defaults.

### What it can't see

The helper has **no access to client, session, invoice, or team data**. It cannot tell you why a specific client's invoice looks wrong or what happened in yesterday's session — for those, check the relevant screen directly. This is a deliberate privacy boundary: nothing about your clients ever leaves the app.

For the same reason, **don't include client names or health details in your questions**. The helper doesn't need them, and questions should stay free of private information.

### Limits and settings

- Each person can ask up to 20 questions per hour.
- Answers come from the documentation — if something isn't documented, the helper says so rather than guessing.
- Owners can turn the helper off for the whole organization at **Settings > Business Rules > Features** with the **AI help assistant** toggle.

### Your questions improve the docs

The question text you ask (and any Help Center search that finds nothing) is recorded so the practice owner can see what people are looking for and fill documentation gaps — owners see this as the **Help gaps** card on the Help Center page. That's one more reason to keep client names and health details out of your questions: they'd end up in that log.
    `,
  },
]
