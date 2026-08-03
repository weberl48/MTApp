import type { Walkthrough } from '../walkthrough-types'
import { audienceAllows, type AudienceFlags } from '@/lib/walkthroughs/audience'

export const APP_OVERVIEW_WALKTHROUGH: Walkthrough = {
  id: 'app-overview',
  name: 'App Overview',
  description: 'Learn the basics of navigating MCA Manager',
  steps: [
    {
      title: 'Welcome to the Dashboard',
      description: 'This is your home base. The stats grid gives you a quick snapshot: sessions this month, total clients, recently approved sessions, and pending invoices with the total amount outstanding.',
      element: '[data-tour="dashboard-stats"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/dashboard/',
    },
    {
      title: 'Action Center',
      description: 'Below the stats you\'ll find action items ordered by urgency — overdue invoices first, then pending approvals, unsent invoices, unbilled scholarship sessions, and any configuration warnings. Cards only appear when there is something to act on — an empty Action Center means you\'re caught up.',
      // Admin-only step: the dashboard renders this container behind `stats.isAdmin`, and every
      // card in it (approvals, invoicing, scholarship batches) is work only an admin can do.
      audience: 'admin',
      element: '[data-tour="dashboard-action-center"]',
      popoverSide: 'top',
      ctaLabel: 'Next',
      href: '/dashboard/',
    },
    {
      title: 'Recent Sessions',
      description: 'A quick view of the latest session entries. Click any session\'s View button to see its full details, or head to the Sessions page for the complete list.',
      element: '[data-tour="dashboard-recent-sessions"]',
      popoverSide: 'top',
      ctaLabel: 'Next',
      href: '/dashboard/',
    },
    {
      title: 'Sessions',
      description: 'The Sessions page is where you log therapy sessions, track their status, and manage approvals. Use the sort and filter controls to find what you need.',
      element: 'nav a[href="/sessions/"]',
      popoverSide: 'right',
      ctaLabel: 'Next',
      href: '/dashboard/',
      mobileNav: true,
    },
    {
      title: 'Clients',
      description: 'Manage your client list, contact info, and payment methods. Each client\'s payment method determines how their invoices are generated.',
      audience: 'admin',
      element: 'nav a[href="/clients/"]',
      popoverSide: 'right',
      ctaLabel: 'Next',
      href: '/dashboard/',
      mobileNav: true,
    },
    {
      title: 'Invoices',
      description: 'Invoices live under the Billing menu. Track pending, sent, paid, and overdue invoices. Scholarship billing has its own tab for monthly batch invoicing.',
      audience: 'admin',
      element: 'nav a[href="/invoices/"], [data-tour="nav-billing"]',
      popoverSide: 'right',
      ctaLabel: 'Next',
      href: '/dashboard/',
      mobileNav: true,
    },
    {
      title: 'Earnings',
      description: 'The Earnings page shows your pay: year-to-date totals, what\'s been paid out, what\'s still pending, and your annual summary for taxes.',
      audience: 'contractor',
      element: 'nav a[href="/earnings/"]',
      popoverSide: 'right',
      ctaLabel: 'Next',
      href: '/dashboard/',
      mobileNav: true,
    },
    {
      title: 'Settings',
      description: 'Configure service types, pricing, team invites, branding, automation, and more. This is where you customize how your practice works. That\'s the tour! You\'ll find more guided tours any time under Help.',
      element: 'nav a[href="/settings/"]',
      popoverSide: 'right',
      ctaLabel: 'Finish',
      href: '/dashboard/',
      mobileNav: true,
    },
  ],
}

export const ADD_CLIENT_WALKTHROUGH: Walkthrough = {
  id: 'add-client',
  name: 'Add Your First Client',
  description: 'Learn how to add a client to your practice',
  audience: 'admin',
  steps: [
    {
      title: 'Navigate to Clients',
      description: 'The Clients page is where you manage everyone you bill for — contact info, payment setup, and portal access.',
      element: 'nav a[href="/clients/"]',
      popoverSide: 'right',
      ctaLabel: 'Next',
      href: '/clients/',
      mobileNav: true,
    },
    {
      title: 'Client Stats',
      description: 'These cards give you a quick count of your clients and flag any that are missing contact info, so incomplete records are easy to spot.',
      element: '[data-tour="clients-stats"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/clients/',
    },
    {
      title: 'Your Client List',
      description: 'This table shows all your clients with their contact info and payment method. Click any row to view or edit a client\'s details.',
      element: '[data-tour="clients-table"]',
      popoverSide: 'top',
      ctaLabel: 'Next',
      href: '/clients/',
    },
    {
      title: 'Click Add Client',
      description: 'This button opens the new-client form. Click it yourself, or press "Open the Form" below and we\'ll open it for you.',
      element: '[data-tour="clients-add-button"]',
      popoverSide: 'bottom',
      ctaLabel: 'Open the Form',
      href: '/clients/',
    },
    {
      title: 'Payment & Billing Setup',
      description: 'These fields drive all billing. Payment Method is who pays and how the session is classified (Scholarship clients are batch-invoiced monthly at the scholarship rate). Billing Method is how their invoice is delivered — Square payment link, emailed PDF, or a check you track by hand. Invoicing switches the client from per-session invoices to one monthly batch, and the Square-fee checkbox adds your processing fee when their invoices go through Square. For a new client with an email, you can also send a portal invite right from this form. Click "Add Client" to save — or press Esc to close without saving.',
      element: '[data-tour="client-billing-fields"]',
      // The fields live inside the Add Client dialog — open it for users who
      // pressed the button above (no-op if they already clicked it).
      preClick: '[data-tour="clients-add-button"] button',
      popoverSide: 'left',
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
      description: 'Click "New Session" on the Sessions page to open the session form. Press "Go to the Form" below and we\'ll take you straight there.',
      mobileDescription: 'On your phone, the floating + button opens quick session logging from any page. Press "Go to the Form" below and we\'ll take you to the full form.',
      element: '[data-tour="sessions-new-button"], [data-tour="quick-session-fab"]',
      popoverSide: 'bottom',
      ctaLabel: 'Go to the Form',
      href: '/sessions/',
    },
    {
      title: 'Date and Time',
      description: 'Set the date and time for the session. The date defaults to today and the time defaults to your last used value.',
      element: '[data-tour="session-form-datetime"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/sessions/new/',
    },
    {
      title: 'Duration',
      description: 'Choose the session length. This affects pricing — a 60-minute session bills at 2x the 30-minute rate. Your last used duration is remembered.',
      element: '[data-tour="session-form-duration"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/sessions/new/',
    },
    {
      title: 'Service Type',
      description: 'Choose the service type which determines pricing, contractor pay, and whether a client is required. Your last used service type is remembered.',
      element: '[data-tour="session-form-service-type"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/sessions/new/',
    },
    {
      title: 'Select Client',
      description: 'Search and select the client(s) who attended. For group services, you can add multiple clients. Some services like admin work skip this field.',
      element: '[data-tour="session-form-clients"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/sessions/new/',
    },
    {
      title: 'Session Notes',
      description: 'Add internal notes (only visible to your team) and client notes (visible in the client portal). Notes are encrypted for HIPAA compliance.',
      element: '#notes',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/sessions/new/',
    },
    {
      title: 'Submit or Save Draft',
      description: 'Choose "Submit for approval" to send the session for admin review, or "Save as draft" to finish later. After submitting, you can quickly "Log Another" session. You\'re ready — log a session any time.',
      element: '[data-tour="session-form-submit"]',
      popoverSide: 'top',
      ctaLabel: 'Finish',
      href: '/sessions/new/',
    },
  ],
}

export const INVITE_CONTRACTOR_WALKTHROUGH: Walkthrough = {
  id: 'invite-contractor',
  name: 'Invite a Contractor',
  description: 'Learn how to invite team members',
  audience: 'admin',
  steps: [
    {
      title: 'Go to Team',
      description: 'Team management is in the Team section of the sidebar.',
      element: 'nav a[href="/team/"]',
      popoverSide: 'right',
      ctaLabel: 'Next',
      href: '/team/',
      mobileNav: true,
    },
    {
      title: 'Team Summary',
      // Deliberately doesn't enumerate the pay card: it only renders for roles
      // allowed to see contractor pay, so naming it would describe missing UI
      // to an admin the owner hasn't granted that to.
      description: 'The summary cards give you a quick read on your team — how many members you have, how many sessions they have logged, and how many contractors are active.',
      element: '[data-tour="team-stats"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/team/',
    },
    {
      title: 'Team Members Table',
      description: 'View all team members with their roles, session counts, and earnings. Use the actions column to manage individual members.',
      element: '[data-tour="team-members-card"]',
      popoverSide: 'top',
      ctaLabel: 'Next',
      href: '/team/',
    },
    {
      title: 'Pay Rate Matrix',
      // Owner-only step: the Rates tab is hidden from admins (team:view-rates).
      audience: 'owner',
      description: 'Switch to the Rates tab to see a matrix of all contractor pay rates across service types at a glance. You can set custom per-contractor rates here.',
      element: '[data-tour="team-tab-rates"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/team/',
    },
    {
      title: 'Send an Invite',
      description: 'This button opens the invite form. Click it yourself, or press "Open the Invite Form" below and we\'ll open it for you.',
      element: '[data-tour="team-invite-button"]',
      popoverSide: 'bottom',
      ctaLabel: 'Open the Invite Form',
      href: '/team/',
    },
    {
      title: 'Choose a Role & Send',
      description: 'Contractors can log their own sessions and see their earnings. Admins can additionally review sessions, manage clients, and handle invoicing. Enter their email to send the invite, or generate a link to share directly — they\'ll create their own account from it. Press Esc when you\'re done to close the form.',
      element: '#invite_role',
      // The role selector lives inside the invite dialog — open it for users
      // who pressed the button above (no-op if they already clicked it).
      preClick: '[data-tour="team-invite-button"] button',
      popoverSide: 'left',
      ctaLabel: 'Finish',
      href: '/team/',
    },
  ],
}

export const CONFIGURE_SERVICES_WALKTHROUGH: Walkthrough = {
  id: 'configure-services',
  name: 'Configure Services',
  description: 'Learn how to set up service types and pricing',
  // Owner-only: the Services tab it tours carries contractor pay config.
  audience: 'owner',
  steps: [
    {
      title: 'Go to Settings',
      description: 'Service type configuration is in Settings > Business Rules.',
      element: 'nav a[href="/settings/"]',
      popoverSide: 'right',
      ctaLabel: 'Next',
      href: '/settings/business/',
      mobileNav: true,
    },
    {
      title: 'Service Types List',
      description: 'You\'ll see all your current service types with their pricing. Each row summarizes the base rate and key settings, with a badge for the location. Click the pencil on any service type to edit it.',
      element: '[data-tour="services-list"]',
      popoverSide: 'top',
      ctaLabel: 'Next',
      href: '/settings/business/',
    },
    {
      title: 'Add or Edit a Service',
      description: 'Click "Add Service Type" to create a new one, or edit an existing service. The form lets you set base rate, per-person rate (for groups), contractor cap, total cap, rent, scholarship rate, and more.',
      element: '[data-tour="services-add-button"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/settings/business/',
    },
    {
      title: 'Detailed Editing Walkthrough',
      description: 'For a step-by-step guide through every field in the service type form, take the "Edit a Service Type" tour — you\'ll find it in the Help Center\'s Guided Tours list. It highlights each field and explains what it does.',
      ctaLabel: 'Finish',
      href: '/settings/business/',
    },
  ],
}

export const APPROVE_SESSIONS_WALKTHROUGH: Walkthrough = {
  id: 'approve-sessions',
  name: 'Approve Sessions',
  description: 'Learn how to review and approve submitted sessions',
  audience: 'admin',
  steps: [
    {
      title: 'Sessions Page',
      description: 'Go to the Sessions page. Submitted sessions appear with a "Submitted" badge and are waiting for your review.',
      element: 'nav a[href="/sessions/"]',
      popoverSide: 'right',
      ctaLabel: 'Next',
      href: '/sessions/',
      mobileNav: true,
    },
    {
      title: 'Filter and Search',
      description: 'Use the search bar to find sessions by service type, client, or contractor name. The filter controls let you narrow by status, date range, and contractor.',
      element: '[data-tour="sessions-filters"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/sessions/',
    },
    {
      title: 'Session List',
      description: 'Each session card shows the date, service type, client, contractor, duration, and status badge. Click a session to view full details including notes and pricing breakdown.',
      element: '[data-tour="sessions-list"]',
      popoverSide: 'top',
      ctaLabel: 'Next',
      href: '/sessions/',
    },
    {
      title: 'Inline Approve',
      description: 'Submitted sessions carry Approve and Revise buttons right on the card (if the whole list is highlighted instead, nothing is waiting for review right now). Click Approve to confirm instantly, or Revise to send it back to the contractor with a note. You can try it right now — the tour will stay with you.',
      element: '[data-tour="session-approve-inline"], [data-tour="sessions-list"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/sessions/',
    },
    {
      title: 'Bulk Approve',
      description: 'Use the "Select all submitted" checkbox at the top of the list (or the checkboxes on each card) to select multiple sessions. A blue bar appears with an "Approve (N)" button that approves them all at once.',
      element: '[data-tour="sessions-select-all"], [data-tour="sessions-list"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/sessions/',
    },
    {
      title: 'Other Actions',
      description: 'From a session\'s detail page, you can also Request Revision (with a reason), Mark No-Show (charges the no-show fee), or Cancel. The session\'s invoice was already created when it was submitted — approving confirms the session so the invoice is ready to send.',
      ctaLabel: 'Finish',
      href: '/sessions/',
    },
  ],
}

export const SCHOLARSHIP_BILLING_WALKTHROUGH: Walkthrough = {
  id: 'scholarship-billing',
  name: 'Scholarship Billing',
  description: 'Learn how to generate monthly scholarship invoices',
  audience: 'admin',
  steps: [
    {
      title: 'Go to Invoices',
      description: 'Navigate to Invoices from the sidebar — it lives under the Billing menu.',
      element: 'nav a[href="/invoices/"], [data-tour="nav-billing"]',
      popoverSide: 'right',
      ctaLabel: 'Next',
      href: '/invoices/',
      mobileNav: true,
    },
    {
      title: 'Invoice Summary',
      description: 'The summary cards show your pending, awaiting payment, and overdue invoice totals at a glance.',
      element: '[data-tour="invoices-stats"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/invoices/',
    },
    {
      title: 'Invoice Tabs',
      description: 'Invoices are organized by status — Pending, Sent, Paid, and more. You can also filter by Self-Directed and Group Home payment types.',
      element: '[data-tour="invoices-card"]',
      popoverSide: 'top',
      ctaLabel: 'Next',
      href: '/invoices/',
    },
    {
      title: 'Open the Scholarship Tab',
      description: 'The purple "Scholarship" tab shows unbilled scholarship sessions grouped by client and month. Click it now — or press "Open the Tab" below and we\'ll switch for you. This tab only appears for admins.',
      element: '[data-tour="invoices-tab-scholarship"]',
      popoverSide: 'bottom',
      ctaLabel: 'Open the Tab',
      href: '/invoices/',
    },
    {
      title: 'Scholarship Content',
      description: 'The Scholarship tab shows unbilled sessions grouped by client and month, existing batch invoices, and unpaid scholarship invoices. Each group has a "Generate Invoice" button.',
      element: '[data-tour="invoices-scholarship-content"]',
      // The panel only mounts once the tab is active — open it for users who
      // pressed Next without clicking the tab themselves.
      preClick: '[data-tour="invoices-tab-scholarship"]',
      popoverSide: 'top',
      ctaLabel: 'Next',
      href: '/invoices/',
    },
    {
      title: 'Generate Invoices',
      description: 'Click "Generate Invoice" for each client/month group, or "Generate All" to create batch invoices for all unbilled sessions at once. Invoices are created as Pending so you can review before sending.',
      element: '[data-tour="scholarship-generate-all"], [data-tour="invoices-scholarship-content"]',
      popoverSide: 'bottom',
      ctaLabel: 'Finish',
      href: '/invoices/',
    },
  ],
}

export const EDIT_SERVICE_TYPE_WALKTHROUGH: Walkthrough = {
  id: 'edit-service-type',
  name: 'Edit a Service Type',
  description: 'Learn how to customize service type pricing, pay, and special behaviors',
  // Owner-only: the Services tab it tours carries contractor pay config.
  audience: 'owner',
  steps: [
    {
      title: 'Go to Settings',
      description: 'Service types are configured under Settings > Business Rules. This tour walks through every field in the service type form — it takes about 3 minutes.',
      element: 'nav a[href="/settings/"]',
      ctaLabel: 'Open a Service Type',
      href: '/settings/business/',
      mobileNav: true,
    },
    {
      title: 'Open a Service Type',
      description: 'We\'ve opened your first service type so you can see all the fields. We\'ll go through them one by one.',
      ctaLabel: 'Next',
      href: '/settings/business/?tour=edit-service',
    },
    {
      title: 'Service Name',
      description: 'The name appears on sessions, invoices, and payroll. Use something descriptive like "In-Home Individual Music Therapy" so contractors pick the right one quickly.',
      element: '#name',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/settings/business/?tour=edit-service',
    },
    {
      title: 'Category & Location',
      description: 'Category (Music/Art, Individual/Group) organizes your analytics and reports. Location tracks where the service happens — set it to Matt\'s Music when rent applies.',
      element: '[data-tour="category-location"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/settings/business/?tour=edit-service',
    },
    {
      title: 'Base Rate & Per-Person Rate',
      description: 'Base Rate is the total billed for a 30-minute session. It scales with duration (60 min = 2x, 90 min = 3x). Per-Person Rate adds an extra charge per attendee for group services — leave at $0 for individual sessions.',
      element: '[data-tour="pricing-rates"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/settings/business/?tour=edit-service',
    },
    {
      title: 'Contractor Cap',
      description: 'Optional maximum a contractor can earn per session. Even if the pricing formula calculates more, their pay is capped here. Leave empty for no limit.',
      element: '#contractor_cap',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/settings/business/?tour=edit-service',
    },
    {
      title: 'Total Cap',
      description: 'Optional ceiling on the total amount billed per session, regardless of headcount. Useful for large groups so the bill doesn\'t get too high. Leave empty for no limit.',
      element: '#total_cap',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/settings/business/?tour=edit-service',
    },
    {
      title: 'Rent Percentage',
      description: 'Percentage of the session total withheld for facility rent. Typically 10% for Matt\'s Music. Set to 0% for in-home or other locations where no rent applies.',
      element: '#rent_percentage',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/settings/business/?tour=edit-service',
    },
    {
      title: 'Scholarship Rate',
      description: 'A flat dollar amount billed to the scholarship fund per session, regardless of duration. The contractor still gets their normal pay — the organization absorbs any difference. Leave empty if this isn\'t a scholarship service.',
      element: '#scholarship_rate',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/settings/business/?tour=edit-service',
    },
    {
      title: 'Contractor Pay by Duration',
      description: 'Set exact contractor pay amounts for each session length instead of calculating from MCA %. The "auto" value shows what the formula would give. Fill in only the durations you want to override. This is the most precise way to control contractor pay.',
      element: '[data-tour="pay-schedule"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/settings/business/?tour=edit-service',
    },
    {
      title: 'Scholarship Service Toggle',
      description: 'When on, sessions using this service type are batch-invoiced monthly on the Scholarship tab instead of generating individual invoices. Pair this with the Scholarship Rate above.',
      element: '#is_scholarship',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/settings/business/?tour=edit-service',
    },
    {
      title: 'Requires Client Toggle',
      description: 'Turn this off for admin work or tasks that don\'t involve a client. The session form will skip client and notes fields and instead ask "Who did this work?" showing only admin-role team members.',
      element: '#requires_client',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/settings/business/?tour=edit-service',
    },
    {
      title: 'Restrict to Contractors',
      description: 'Limit which team members can use this service type. Check the contractors who should have access. If none are checked, everyone can use it. Admins and owners always see all service types.',
      element: '[data-tour="contractor-restrictions"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/settings/business/?tour=edit-service',
    },
    {
      title: 'Active Toggle',
      description: 'Turn this off to hide the service type from the session form. Existing sessions are not affected. Use this to retire old service types without deleting them.',
      element: '#is_active',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/settings/business/?tour=edit-service',
    },
    {
      title: 'Save and Test',
      description: 'Click "Save Changes" to apply. Changes only affect new sessions — existing records stay the same. Use View As mode to confirm contractors see the right options. You can close the form now.',
      ctaLabel: 'Finish',
      href: '/settings/business/',
    },
  ],
}

export const SEND_INVOICE_WALKTHROUGH: Walkthrough = {
  id: 'send-invoice',
  name: 'Send & Track Invoices',
  description: 'Learn the invoice workflow — from pending to sent to paid',
  audience: 'admin',
  steps: [
    {
      title: 'Go to Invoices',
      description: 'Invoices live under Billing. When a session is submitted, its invoice is created automatically as Pending — everything after that happens here.',
      element: 'nav a[href="/invoices/"], [data-tour="nav-billing"]',
      popoverSide: 'right',
      ctaLabel: 'Next',
      href: '/invoices/',
      mobileNav: true,
    },
    {
      title: 'The Invoice Lifecycle',
      description: 'Invoices move through three statuses: Pending (created, not yet delivered), Sent (delivered, awaiting payment), and Paid. Overdue isn\'t a status — it\'s computed from the due date, and an Overdue tab appears automatically when anything is past due.',
      element: '[data-tour="invoices-card"]',
      popoverSide: 'top',
      ctaLabel: 'Next',
      href: '/invoices/',
    },
    {
      title: 'Row Actions',
      description: 'Each row has quick actions: Send marks a pending invoice sent, Paid records payment on a sent one, and the menu holds more — email the PDF, create a Square invoice, or delete a pending invoice. Sent and paid invoices are financial records and can never be deleted.',
      element: '[data-tour="invoice-row-actions"], [data-tour="invoices-card"]',
      popoverSide: 'left',
      ctaLabel: 'Next',
      href: '/invoices/',
    },
    {
      title: 'Open an Invoice',
      description: 'Click any row to open the full invoice: download or email the PDF, send it through Square, or record a payment. Emailing uses the address on the client\'s profile.',
      ctaLabel: 'Next',
      href: '/invoices/',
    },
    {
      title: 'Bulk Actions',
      description: 'Use the checkboxes to select several invoices — a blue bar appears with Export CSV, Mark Sent, and Mark Paid so you can process a whole batch at once.',
      element: '[data-tour="invoices-select-all"], [data-tour="invoices-card"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/invoices/',
    },
    {
      title: 'Due Dates & Reminders',
      description: 'Due dates come from your invoice settings (30 days by default). If reminders are enabled, clients get automatic emails as the due date approaches — and anything unpaid past due shows up here in red. That\'s the invoice workflow!',
      element: '[data-tour="invoices-stats"]',
      popoverSide: 'bottom',
      ctaLabel: 'Finish',
      href: '/invoices/',
    },
  ],
}

export const PAYROLL_WALKTHROUGH: Walkthrough = {
  id: 'payroll',
  name: 'Run Payroll',
  description: 'Learn how to review unpaid sessions and record contractor payouts',
  audience: 'owner',
  steps: [
    {
      title: 'Go to Payroll',
      description: 'Payroll lives under Billing. This is where you see what contractors have earned and record payouts.',
      element: 'nav a[href="/payments/"], [data-tour="nav-billing"]',
      popoverSide: 'right',
      ctaLabel: 'Next',
      href: '/payments/',
      mobileNav: true,
    },
    {
      title: 'Payroll at a Glance',
      description: 'All-time contractor earnings, next to what\'s currently awaiting payout and how many sessions that covers.',
      element: '[data-tour="payroll-stats"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/payments/',
    },
    {
      title: 'Unpaid Sessions',
      description: 'The Payroll Hub groups unpaid sessions by contractor. Expand a contractor to review their sessions, use the date filter to work a pay period, and click Mark Paid to record the payout. Each session\'s pay is snapshotted at that moment, so later rate changes never rewrite history.',
      element: '[data-tour="payroll-hub"]',
      popoverSide: 'top',
      ctaLabel: 'Next',
      href: '/payments/',
    },
    {
      title: 'Payment History',
      description: 'The History tab summarizes every contractor — sessions logged, total earned, paid out, and still pending.',
      element: '[data-tour="payroll-tab-history"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/payments/',
    },
    {
      title: 'Invoice Reconciliation',
      description: 'Reconciliation cross-checks your invoices against Square, so what\'s recorded as paid matches what clients actually paid.',
      element: '[data-tour="payroll-tab-reconciliation"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/payments/',
    },
    {
      title: 'Tax Summaries',
      description: 'Tax Summaries builds cash-basis annual totals per contractor — a payment counts in the year it was paid, not when the session happened. Download the CSV or per-contractor PDFs at year end. That\'s payroll!',
      element: '[data-tour="payroll-tab-tax"]',
      popoverSide: 'bottom',
      ctaLabel: 'Finish',
      href: '/payments/',
    },
  ],
}

export const MY_EARNINGS_WALKTHROUGH: Walkthrough = {
  id: 'my-earnings',
  name: 'Track Your Earnings',
  description: 'Learn how your pay is tracked, from submission to payout',
  audience: 'contractor',
  steps: [
    {
      title: 'Your Earnings Page',
      description: 'Everything about your pay lives on the Earnings page.',
      element: 'nav a[href="/earnings/"]',
      popoverSide: 'right',
      ctaLabel: 'Next',
      href: '/earnings/',
      mobileNav: true,
    },
    {
      title: 'Earnings Summary',
      description: 'Year-to-date earnings, what\'s already been paid out, what\'s still pending, and this month at a glance. Sessions count toward earnings once you submit them — drafts don\'t.',
      element: '[data-tour="earnings-stats"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/earnings/',
    },
    {
      title: 'What Pending Means',
      description: 'After you submit a session it goes to review. Approved or not-yet-paid sessions show here as Pending until the practice records your payout — then they move to Paid Out. If a session is sent back for revision, fix and resubmit it from the Sessions page; it counts again the moment it\'s resubmitted.',
      ctaLabel: 'Next',
      href: '/earnings/',
    },
    {
      title: 'Monthly Breakdown',
      description: 'Your recent months side by side — sessions and earnings per month, with the chart above showing the trend.',
      element: '[data-tour="earnings-monthly"]',
      popoverSide: 'top',
      ctaLabel: 'Next',
      href: '/earnings/',
    },
    {
      title: 'Annual Summary for Taxes',
      description: 'At tax time, download your annual earnings summary PDF here. It\'s cash-basis: a payment counts in the year you were paid, not the year of the session. That\'s your earnings page!',
      element: '[data-tour="earnings-annual"]',
      popoverSide: 'top',
      ctaLabel: 'Finish',
      href: '/earnings/',
    },
  ],
}

export const AUTOMATION_WALKTHROUGH: Walkthrough = {
  id: 'automation',
  name: 'Automate Your Workflow',
  description: 'Learn the auto-approve, auto-send, and scholarship automation switches',
  audience: 'owner',
  steps: [
    {
      title: 'Customize & Automate',
      description: 'Automation lives in Settings, on the Customize & Automate page.',
      element: 'nav a[href="/settings/"]',
      popoverSide: 'right',
      ctaLabel: 'Next',
      href: '/settings/customize/',
      mobileNav: true,
    },
    {
      title: 'Open the Automation Tab',
      description: 'The Automation tab holds three switches that change how work flows through the app. Click it — or press "Open the Tab" and we\'ll switch for you.',
      element: '[data-tour="customize-tab-automation"]',
      popoverSide: 'bottom',
      ctaLabel: 'Open the Tab',
      href: '/settings/customize/',
    },
    {
      title: 'Auto-Approve Sessions',
      description: 'When on, submitted sessions are approved instantly — no review queue, and their invoices are created right away. Turn this on only once you trust what\'s being submitted.',
      element: '[data-tour="automation-sessions"]',
      preClick: '[data-tour="customize-tab-automation"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/settings/customize/',
    },
    {
      title: 'Auto-Send Invoices',
      description: 'When a session is approved (by you or by auto-approve), its invoice can go out immediately — by email or as a Square invoice. This applies to per-session billing; monthly-batch clients still get one statement at month end.',
      element: '[data-tour="automation-invoices"]',
      preClick: '[data-tour="customize-tab-automation"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/settings/customize/',
    },
    {
      title: 'Scholarship Auto-Generation',
      description: 'Generates the monthly scholarship batch invoices automatically on the day you pick (1–28), instead of pressing "Generate All" on the Scholarship tab yourself. Remember to click "Save Automation Settings" to apply any changes.',
      element: '[data-tour="automation-scholarship"]',
      preClick: '[data-tour="customize-tab-automation"]',
      popoverSide: 'top',
      ctaLabel: 'Finish',
      href: '/settings/customize/',
    },
  ],
}

export const CUSTOM_LISTS_WALKTHROUGH: Walkthrough = {
  id: 'custom-lists',
  name: 'Customize Lists & Labels',
  description: 'Learn how to rename or hide payment methods and billing methods',
  audience: 'owner',
  steps: [
    {
      title: 'Customize & Automate',
      description: 'Custom lists live in Settings, on the Customize & Automate page.',
      element: 'nav a[href="/settings/"]',
      popoverSide: 'right',
      ctaLabel: 'Next',
      href: '/settings/customize/',
      mobileNav: true,
    },
    {
      title: 'Payment Methods',
      description: 'Rename any payment method to match how you actually talk about it, or hide ones you never use — hidden options disappear from the client and session forms. The internal key in gray never changes, so existing data stays consistent.',
      element: '[data-tour="customize-payment-methods"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/settings/customize/',
    },
    {
      title: 'Billing Methods',
      description: 'The same controls for how invoices are delivered. Click "Save Custom Lists" when you\'re done.',
      element: '[data-tour="customize-billing-methods"]',
      popoverSide: 'top',
      ctaLabel: 'Finish',
      href: '/settings/customize/',
    },
  ],
}

export const CONTRACTOR_RATES_WALKTHROUGH: Walkthrough = {
  id: 'contractor-rates',
  name: 'Set Contractor Pay Rates',
  description: 'Learn how the pay rate matrix and custom per-contractor rates work',
  // Owner-only: the Rates tab this tour walks through is hidden from admins.
  audience: 'owner',
  steps: [
    {
      title: 'Go to Team',
      description: 'Custom pay rates live on the Team page.',
      element: 'nav a[href="/team/"]',
      popoverSide: 'right',
      ctaLabel: 'Next',
      href: '/team/',
      mobileNav: true,
    },
    {
      title: 'Open the Rates Tab',
      description: 'The Rates tab shows the full pay rate matrix. Click it — or press "Open the Tab" and we\'ll switch for you.',
      element: '[data-tour="team-tab-rates"]',
      popoverSide: 'bottom',
      ctaLabel: 'Open the Tab',
      href: '/team/',
    },
    {
      title: 'The Pay Rate Matrix',
      description: 'One row per service type, one column per contractor. Each cell is that contractor\'s pay for a 30-minute session of that service — blank cells fall back to the service type\'s pay schedule or formula.',
      element: '[data-tour="pay-rate-matrix"], [data-tour="team-members-card"]',
      preClick: '[data-tour="team-tab-rates"]',
      popoverSide: 'top',
      ctaLabel: 'Next',
      href: '/team/',
    },
    {
      title: 'Editing a Rate',
      description: 'Click the pencil in a cell to set a custom rate — raises are baked into the number you enter, and "Set all" fills a whole column at once (editing requires the owner). Use the duration tabs to check longer sessions: they add the service\'s pay-schedule offset on top of the 30-minute rate.',
      element: '[data-tour="pay-rate-matrix"], [data-tour="team-members-card"]',
      preClick: '[data-tour="team-tab-rates"]',
      popoverSide: 'top',
      ctaLabel: 'Next',
      href: '/team/',
    },
    {
      title: 'When Rates Apply',
      description: 'Rate changes affect sessions logged from then on — approved and paid sessions keep the pay they were priced at. To spot-check a contractor\'s pay on a real session, open any of their sessions and review the pricing breakdown.',
      ctaLabel: 'Finish',
      href: '/team/',
    },
  ],
}

export const ANALYTICS_WALKTHROUGH: Walkthrough = {
  id: 'analytics',
  name: 'Explore Analytics',
  description: 'Learn the revenue, session, and payment-status views',
  audience: 'owner',
  steps: [
    {
      title: 'Go to Analytics',
      description: 'Analytics gives you the business-wide picture — revenue, session volume, and payment status.',
      element: 'nav a[href="/analytics/"]',
      popoverSide: 'right',
      ctaLabel: 'Next',
      href: '/analytics/',
      mobileNav: true,
    },
    {
      title: 'Pick a Date Range',
      description: 'Everything on this page follows the selected range — the last 3, 6, or 12 months, or year to date.',
      element: '[data-tour="analytics-range"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/analytics/',
    },
    {
      title: 'Summary Cards',
      description: 'Total revenue billed in the range, your organization\'s share of it, session count, and active clients.',
      element: '[data-tour="analytics-stats"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/analytics/',
    },
    {
      title: 'Revenue & Sessions',
      description: 'Revenue by month, split into your share and contractor pay — next to session volume split individual vs group.',
      element: '[data-tour="analytics-charts"]',
      popoverSide: 'top',
      ctaLabel: 'Next',
      href: '/analytics/',
    },
    {
      title: 'Payment Status',
      description: 'How much of the billed revenue is collected, awaiting payment, or still pending review — with total outstanding at the bottom. For raw data, the Sessions page has a CSV export. That\'s analytics!',
      element: '[data-tour="analytics-payments"]',
      popoverSide: 'top',
      ctaLabel: 'Finish',
      href: '/analytics/',
    },
  ],
}

export const CLIENT_PORTAL_WALKTHROUGH: Walkthrough = {
  id: 'client-portal',
  name: 'Set Up Client Portal Access',
  description: 'Learn how to send portal invites and manage client portal links',
  audience: 'admin',
  steps: [
    {
      title: 'Go to Clients',
      description: 'Portal access is managed per client, from the Clients section.',
      element: 'nav a[href="/clients/"]',
      popoverSide: 'right',
      ctaLabel: 'Next',
      href: '/clients/',
      mobileNav: true,
    },
    {
      title: 'Open a Client',
      description: 'Each client\'s detail page has a Portal Access card. Click any client row now to open theirs — or press "Open a Client" below and we\'ll open the first one for you. (If the portal feature is turned off in Settings > Business Rules > Features, the card won\'t appear.)',
      element: '[data-tour="clients-table"]',
      popoverSide: 'top',
      ctaLabel: 'Open a Client',
      href: '/clients/',
    },
    {
      title: 'The Portal Access Card',
      description: 'This card manages the client\'s secure, no-password portal links. If the client has an email on file, "Send Portal Invite" emails them a fresh link. "Generate Portal Link" creates one without emailing it — the link is shown once with a Copy button, which is also how you handle clients without an email.',
      element: '[data-tour="portal-access-card"]',
      // The card lives on a client's detail page — if the user didn't open one
      // themselves, click the first row for them. Scoped to the list card so it
      // no-ops once we're on a detail page (the breadcrumb is outside it).
      preClick: '[data-tour="clients-table"] a[href^="/clients/"]',
      popoverSide: 'left',
      ctaLabel: 'Next',
      href: '/clients/',
    },
    {
      title: 'Links Are Shown Only Once',
      description: 'For security, the app stores portal links in a form it can\'t read back — so a link can only be copied at the moment it\'s created. When one is lost or about to expire, don\'t look for the old link: issue a new invite or a new link. Old links keep working until they expire, and "Revoke Access" invalidates all of them at once.',
      element: '[data-tour="portal-access-card"]',
      preClick: '[data-tour="clients-table"] a[href^="/clients/"]',
      popoverSide: 'left',
      ctaLabel: 'Next',
      href: '/clients/',
    },
    {
      title: 'What Clients See',
      description: 'Through their link, clients get a private view of their own sessions, goals, and shared resources, and they can request a session with preferred dates. Link lifetime comes from Settings > Business Rules > Sessions > Portal Link Expiry (90 days by default), and expired links offer clients a self-service "Get a New Link" flow. That\'s portal access!',
      ctaLabel: 'Finish',
      href: '/clients/',
    },
  ],
}

export const MFA_SETUP_WALKTHROUGH: Walkthrough = {
  id: 'mfa-setup',
  name: 'Secure Your Account',
  description: 'Learn your Profile & Security page — and set up two-factor authentication',
  steps: [
    {
      title: 'Profile & Security',
      description: 'Your personal and security settings live under Settings > Profile & Security. You can also get here any time from the avatar menu in the top-right corner.',
      element: 'nav a[href="/settings/"]',
      popoverSide: 'right',
      ctaLabel: 'Next',
      href: '/settings/profile/',
      mobileNav: true,
    },
    {
      title: 'Your Profile & Account',
      description: 'Update your display name and phone here — they\'re what teammates see. Below, the Account card shows your email, role, and organization for reference. To change your password, sign out and use "Forgot password?" on the login page.',
      element: '[data-tour="profile-card"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/settings/profile/',
    },
    {
      title: 'Session Security',
      // Owner-only: the card renders behind settings:edit.
      audience: 'owner',
      description: 'Organization-wide security policy: how long until an idle session is signed out, whether admins and owners must use two-factor authentication, and how many failed logins lock an account (and for how long).',
      element: '[data-tour="security-policies"]',
      popoverSide: 'top',
      ctaLabel: 'Next',
      href: '/settings/profile/',
    },
    {
      title: 'What Admins Can See',
      audience: 'owner',
      description: 'Four switches controlling how much of the money side your admins see — contractor pay & rates, margins, analytics, and payroll. All off by default; only you can change them.',
      element: '[data-tour="admin-visibility"]',
      popoverSide: 'top',
      ctaLabel: 'Next',
      href: '/settings/profile/',
    },
    {
      title: 'Two-Factor Authentication',
      description: 'This is the important one: click "Enable Two-Factor Authentication", scan the QR code with an authenticator app (Google Authenticator, Authy…), and enter the code to confirm. From then on, logins need your password plus a code. If your organization requires MFA, admins and owners must enroll before using the app.',
      element: '[data-tour="mfa-setup"]',
      popoverSide: 'top',
      ctaLabel: 'Finish',
      href: '/settings/profile/',
    },
  ],
}

export const VIEW_AS_WALKTHROUGH: Walkthrough = {
  id: 'view-as',
  name: 'Preview Other Roles (View As)',
  description: 'Learn how to see the app exactly as a contractor or admin sees it',
  // Owner-only: the switcher renders only for owners and developers.
  audience: 'owner',
  steps: [
    {
      title: 'The View As Switcher',
      description: 'This header button lets you simulate what another role sees — the safest way to verify permissions or troubleshoot what a contractor reports, without their login.',
      element: '[data-tour="view-as-switcher"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/dashboard/',
    },
    {
      title: 'Pick a Role or Person',
      description: 'Open it to choose a generic role (Admin, Contractor) or a specific team member. Everything — data, navigation, permissions — switches to their view, and it stays that way as you move between pages. While active, this button turns amber and shows who you\'re viewing as.',
      element: '[data-tour="view-as-switcher"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/dashboard/',
    },
    {
      title: 'Coming Back',
      description: 'To return to your own view, open the same menu and choose "Owner (actual)" at the top. Try it now if you like: switch to Contractor, look at the sidebar, and switch back. That\'s View As!',
      element: '[data-tour="view-as-switcher"]',
      popoverSide: 'bottom',
      ctaLabel: 'Finish',
      href: '/dashboard/',
    },
  ],
}

export const PRACTICE_BRANDING_WALKTHROUGH: Walkthrough = {
  id: 'practice-branding',
  name: 'Brand Your Practice',
  description: 'Learn how your logo, colors, and business details appear to clients',
  // Owner-only: the page itself is owner-only.
  audience: 'owner',
  steps: [
    {
      title: 'Practice & Branding',
      description: 'Everything clients see on invoices, emails, and the portal is configured under Settings > Practice & Branding.',
      element: 'nav a[href="/settings/"]',
      popoverSide: 'right',
      ctaLabel: 'Next',
      href: '/settings/practice/',
      mobileNav: true,
    },
    {
      title: 'Organization Details',
      description: 'Your practice name, email, phone, address, and website — these print on invoices and appear in client communications.',
      element: '[data-tour="practice-org-details"]',
      popoverSide: 'bottom',
      ctaLabel: 'Next',
      href: '/settings/practice/',
    },
    {
      title: 'Live Preview',
      description: 'As you change anything below, this panel shows exactly how it will look in the three places clients meet your brand: invoice headers, emails, and the client portal.',
      element: '[data-tour="practice-preview"]',
      popoverSide: 'top',
      ctaLabel: 'Next',
      href: '/settings/practice/',
    },
    {
      title: 'Logo & Brand Colors',
      description: 'Upload a logo (your initials are used until you do) and pick your primary and secondary colors — they carry through invoices, email templates, and portal buttons.',
      element: '[data-tour="practice-logo"]',
      popoverSide: 'top',
      ctaLabel: 'Next',
      href: '/settings/practice/',
    },
    {
      title: 'Business Details & Regional',
      description: 'A tagline and description for your paperwork, an optional Tax ID/EIN printed on invoices, plus your timezone and currency. Social media links are at the bottom. Remember to save each card after editing. That\'s branding!',
      element: '[data-tour="practice-business"]',
      popoverSide: 'top',
      ctaLabel: 'Finish',
      href: '/settings/practice/',
    },
  ],
}

export const ALL_WALKTHROUGHS: Walkthrough[] = [
  APP_OVERVIEW_WALKTHROUGH,
  ADD_CLIENT_WALKTHROUGH,
  LOG_SESSION_WALKTHROUGH,
  SEND_INVOICE_WALKTHROUGH,
  INVITE_CONTRACTOR_WALKTHROUGH,
  CONFIGURE_SERVICES_WALKTHROUGH,
  EDIT_SERVICE_TYPE_WALKTHROUGH,
  APPROVE_SESSIONS_WALKTHROUGH,
  SCHOLARSHIP_BILLING_WALKTHROUGH,
  PAYROLL_WALKTHROUGH,
  MY_EARNINGS_WALKTHROUGH,
  AUTOMATION_WALKTHROUGH,
  CUSTOM_LISTS_WALKTHROUGH,
  CONTRACTOR_RATES_WALKTHROUGH,
  ANALYTICS_WALKTHROUGH,
  CLIENT_PORTAL_WALKTHROUGH,
  MFA_SETUP_WALKTHROUGH,
  VIEW_AS_WALKTHROUGH,
  PRACTICE_BRANDING_WALKTHROUGH,
]

export function getWalkthroughById(id: string): Walkthrough | undefined {
  return ALL_WALKTHROUGHS.find(w => w.id === id)
}

/**
 * THE gate for offering/starting a tour by id — article pages, the Guided
 * Tours card, and next-tour chaining must all use this one predicate so a
 * gating-rule change can't leave one entry point behind.
 */
export function canStartWalkthrough(id: string | undefined, flags: AudienceFlags): boolean {
  if (!id) return false
  const walkthrough = getWalkthroughById(id)
  return !!walkthrough && audienceAllows(walkthrough.audience, flags)
}
