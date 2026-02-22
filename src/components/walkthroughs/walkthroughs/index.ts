import type { Walkthrough } from '../walkthrough-types'

export const APP_OVERVIEW_WALKTHROUGH: Walkthrough = {
  id: 'app-overview',
  name: 'App Overview',
  description: 'Learn the basics of navigating MCA Manager',
  steps: [
    {
      title: 'Welcome to the Dashboard',
      description: 'This is your home base. You\'ll see quick stats about sessions, earnings, recent activity, and action items that need your attention.',
      element: '[data-tour="dashboard-stats"]',
      ctaLabel: 'View Dashboard',
      href: '/dashboard/',
    },
    {
      title: 'Sessions',
      description: 'Log therapy sessions, track their status, and manage approvals. Use the sort and filter controls to find what you need.',
      element: 'nav a[href="/sessions/"]',
      ctaLabel: 'View Sessions',
      href: '/sessions/',
    },
    {
      title: 'Settings',
      description: 'Configure service types, pricing, team invites, branding, automation, and more.',
      element: 'nav a[href="/settings/"]',
      ctaLabel: 'View Settings',
      href: '/settings/',
    },
  ],
}

export const ADD_CLIENT_WALKTHROUGH: Walkthrough = {
  id: 'add-client',
  name: 'Add Your First Client',
  description: 'Learn how to add a client to your practice',
  steps: [
    {
      title: 'Navigate to Clients',
      description: 'The Clients page shows all your clients. From here you can add new clients, view their details, and manage their records.',
      element: 'nav a[href="/clients/"]',
      ctaLabel: 'Go to Clients',
      href: '/clients/',
    },
    {
      title: 'Click Add Client',
      description: 'Click the "Add Client" button in the top right corner. Fill in the client\'s name, email (optional), phone, and payment method.',
      ctaLabel: 'Stay on Clients',
      href: '/clients/',
    },
    {
      title: 'Choose Payment and Billing Methods',
      description: 'Select how this client pays (Private Pay, Self-Directed, Group Home, Scholarship, or Venmo) and how you bill them (Square, Check, Email, or Other). This affects how invoices are generated and tracked.',
      ctaLabel: 'Finish',
      href: '/clients/',
    },
  ],
}

export const LOG_SESSION_WALKTHROUGH: Walkthrough = {
  id: 'log-session',
  name: 'Log a Session',
  description: 'Learn how to log a therapy session',
  steps: [
    {
      title: 'Start a New Session',
      description: 'Navigate to Sessions and click "New Session" to begin. On mobile, you can also use the floating + button at the bottom of the screen.',
      ctaLabel: 'Go to New Session',
      href: '/sessions/new/',
    },
    {
      title: 'Select Service Type and Client',
      description: 'Choose the service type (which determines pricing) and the client who attended. Some services like admin work don\'t require a client.',
      ctaLabel: 'Stay on Form',
      href: '/sessions/new/',
    },
    {
      title: 'Add Session Details',
      description: 'Enter the date, time, duration, and session notes. Your time, duration, and service type are remembered for next time. Notes are encrypted for HIPAA compliance.',
      ctaLabel: 'Stay on Form',
      href: '/sessions/new/',
    },
    {
      title: 'Submit the Session',
      description: 'Click "Submit Session" to send for review, or "Save Draft" to finish later. After submitting, you can quickly "Log Another" session.',
      ctaLabel: 'Finish',
      href: '/sessions/',
    },
  ],
}

export const INVITE_CONTRACTOR_WALKTHROUGH: Walkthrough = {
  id: 'invite-contractor',
  name: 'Invite a Contractor',
  description: 'Learn how to invite team members',
  steps: [
    {
      title: 'Go to Team',
      description: 'Team management is in the Team section of the sidebar.',
      element: 'nav a[href="/team/"]',
      ctaLabel: 'Go to Team',
      href: '/team/',
    },
    {
      title: 'View Your Team',
      description: 'You\'ll see all current team members with their roles, session counts, and earnings. The Pay Rate Matrix tab shows rates for all contractors at a glance.',
      ctaLabel: 'Stay on Team',
      href: '/team/',
    },
    {
      title: 'Send an Invite',
      description: 'Click "Invite Team Member", enter their email, and select their role (Contractor, Admin, or Owner). They\'ll receive an email with a link to create their account.',
      ctaLabel: 'Finish',
      href: '/team/',
    },
  ],
}

export const CONFIGURE_SERVICES_WALKTHROUGH: Walkthrough = {
  id: 'configure-services',
  name: 'Configure Services',
  description: 'Learn how to set up service types and pricing',
  steps: [
    {
      title: 'Go to Settings',
      description: 'Service type configuration is in Settings > Business Rules.',
      element: 'nav a[href="/settings/"]',
      ctaLabel: 'Go to Settings',
      href: '/settings/business/',
    },
    {
      title: 'Open the Services Tab',
      description: 'Click on the "Services" tab to see your current service types and their pricing configuration.',
      ctaLabel: 'Stay on Settings',
      href: '/settings/business/',
    },
    {
      title: 'Add or Edit a Service',
      description: 'Click "Add Service Type" or edit an existing one. Set the base rate, per-person rate (for groups), MCA percentage, contractor cap, total cap, and other options like "Requires Client" and contractor restrictions.',
      ctaLabel: 'Finish',
      href: '/settings/business/',
    },
  ],
}

export const APPROVE_SESSIONS_WALKTHROUGH: Walkthrough = {
  id: 'approve-sessions',
  name: 'Approve Sessions',
  description: 'Learn how to review and approve submitted sessions',
  steps: [
    {
      title: 'View Submitted Sessions',
      description: 'Go to the Sessions page. Submitted sessions appear with a "Submitted" badge and are waiting for your review.',
      ctaLabel: 'Go to Sessions',
      href: '/sessions/',
    },
    {
      title: 'Review Session Details',
      description: 'Click on a submitted session to see the full details including service type, client, duration, notes, and pricing breakdown.',
      ctaLabel: 'Stay on Sessions',
      href: '/sessions/',
    },
    {
      title: 'Approve or Take Action',
      description: 'Click "Approve" to confirm the session and auto-generate an invoice. You can also Reject (with a reason), Mark No-Show, or Cancel. Use bulk select to approve multiple sessions at once.',
      ctaLabel: 'Finish',
      href: '/sessions/',
    },
  ],
}

export const SCHOLARSHIP_BILLING_WALKTHROUGH: Walkthrough = {
  id: 'scholarship-billing',
  name: 'Scholarship Billing',
  description: 'Learn how to generate monthly scholarship invoices',
  steps: [
    {
      title: 'Go to Invoices',
      description: 'Navigate to the Invoices page from the sidebar.',
      element: 'nav a[href="/invoices/"]',
      ctaLabel: 'Go to Invoices',
      href: '/invoices/',
    },
    {
      title: 'Open the Scholarship Tab',
      description: 'Click the "Scholarship" tab to see unbilled scholarship sessions grouped by client and month.',
      ctaLabel: 'Stay on Invoices',
      href: '/invoices/',
    },
    {
      title: 'Generate Monthly Invoices',
      description: 'Click "Generate Invoice" for each client/month group, or "Generate All" to create batch invoices for all unbilled scholarship sessions. Invoices are created as Pending so you can review before sending.',
      ctaLabel: 'Finish',
      href: '/invoices/',
    },
  ],
}

export const ALL_WALKTHROUGHS: Walkthrough[] = [
  APP_OVERVIEW_WALKTHROUGH,
  ADD_CLIENT_WALKTHROUGH,
  LOG_SESSION_WALKTHROUGH,
  INVITE_CONTRACTOR_WALKTHROUGH,
  CONFIGURE_SERVICES_WALKTHROUGH,
  APPROVE_SESSIONS_WALKTHROUGH,
  SCHOLARSHIP_BILLING_WALKTHROUGH,
]

export function getWalkthroughById(id: string): Walkthrough | undefined {
  return ALL_WALKTHROUGHS.find(w => w.id === id)
}
