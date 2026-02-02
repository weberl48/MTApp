import type { Walkthrough } from '../walkthrough-types'

export const APP_OVERVIEW_WALKTHROUGH: Walkthrough = {
  id: 'app-overview',
  name: 'App Overview',
  description: 'Learn the basics of navigating MCA Manager',
  steps: [
    {
      title: 'Welcome to the Dashboard',
      description: 'This is your home base. You\'ll see quick stats about sessions, earnings, and recent activity.',
      ctaLabel: 'View Dashboard',
      href: '/dashboard',
    },
    {
      title: 'Sessions',
      description: 'This is where you log therapy sessions. Every session you log creates records for billing.',
      ctaLabel: 'View Sessions',
      href: '/sessions',
    },
    {
      title: 'Settings',
      description: 'Configure your account, organization settings, and preferences here.',
      ctaLabel: 'View Settings',
      href: '/settings',
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
      description: 'The Clients page shows all your clients. From here you can add new clients and manage existing ones.',
      ctaLabel: 'Go to Clients',
      href: '/clients',
    },
    {
      title: 'Click Add Client',
      description: 'Click the "Add Client" button in the top right corner. Fill in the client\'s name, email (optional), and payment method.',
      ctaLabel: 'Stay on Clients',
      href: '/clients',
    },
    {
      title: 'Choose a Payment Method',
      description: 'Select how this client pays: Private Pay, Self-Directed, Group Home, or Scholarship. This affects how invoices are tracked.',
      ctaLabel: 'Finish',
      href: '/clients',
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
      description: 'Navigate to Sessions and click "New Session" to begin logging a therapy session.',
      ctaLabel: 'Go to New Session',
      href: '/sessions/new',
    },
    {
      title: 'Select Client and Service',
      description: 'Choose the client who attended and the type of service provided. The pricing will be calculated automatically.',
      ctaLabel: 'Stay on Form',
      href: '/sessions/new',
    },
    {
      title: 'Add Session Details',
      description: 'Enter the date, time, duration, and any notes about the session. Notes are encrypted for HIPAA compliance.',
      ctaLabel: 'Stay on Form',
      href: '/sessions/new',
    },
    {
      title: 'Submit the Session',
      description: 'Click "Submit" to send the session for review, or "Save as Draft" if you need to add more details later.',
      ctaLabel: 'Finish',
      href: '/sessions',
    },
  ],
}

export const INVITE_CONTRACTOR_WALKTHROUGH: Walkthrough = {
  id: 'invite-contractor',
  name: 'Invite a Contractor',
  description: 'Learn how to invite team members',
  steps: [
    {
      title: 'Go to Settings',
      description: 'Team management is found in the Settings area.',
      ctaLabel: 'Go to Settings',
      href: '/settings',
    },
    {
      title: 'Open the Team Tab',
      description: 'Click on the "Team" tab to see your current team members and invite new ones.',
      ctaLabel: 'Stay on Settings',
      href: '/settings',
    },
    {
      title: 'Send an Invite',
      description: 'Click "Invite Team Member", enter their email, select their role (Contractor, Admin, or Owner), and send the invite.',
      ctaLabel: 'Finish',
      href: '/settings',
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
      description: 'Service type configuration is found in Settings.',
      ctaLabel: 'Go to Settings',
      href: '/settings',
    },
    {
      title: 'Open the Services Tab',
      description: 'Click on the "Services" tab to see your current service types and their pricing.',
      ctaLabel: 'Stay on Settings',
      href: '/settings',
    },
    {
      title: 'Add or Edit a Service',
      description: 'Click "Add Service Type" to create a new service, or click an existing one to edit it. Set the base rate, per-person rate, and MCA percentage.',
      ctaLabel: 'Finish',
      href: '/settings',
    },
  ],
}

export const ALL_WALKTHROUGHS: Walkthrough[] = [
  APP_OVERVIEW_WALKTHROUGH,
  ADD_CLIENT_WALKTHROUGH,
  LOG_SESSION_WALKTHROUGH,
  INVITE_CONTRACTOR_WALKTHROUGH,
  CONFIGURE_SERVICES_WALKTHROUGH,
]

export function getWalkthroughById(id: string): Walkthrough | undefined {
  return ALL_WALKTHROUGHS.find(w => w.id === id)
}
