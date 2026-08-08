import type { HelpFaq } from './types'

export const HELP_FAQS: HelpFaq[] = [
  {
    id: 'why-no-invoice',
    question: "Why didn't this client get an invoice?",
    answer: `Two billing setups skip the normal per-session invoice on purpose. If the client's **payment method** is Scholarship, or their **Invoicing** setting (on the client's edit form) is **Monthly batch**, their sessions don't get invoiced one at a time — they accumulate and get combined into a single invoice for the month instead.

You'll find those uninvoiced sessions on the **Invoices > Scholarship** tab, grouped by client. Click **Generate Invoice** on that client's card (or **Generate All** to batch everyone at once) to create the invoice. This applies even to non-scholarship clients who are simply set to monthly billing — they're billed at normal per-session pricing, just batched monthly.`,
    articleSlug: 'scholarship-billing',
    category: 'invoices',
    adminOnly: true,
  },
  {
    id: 'why-cant-delete-invoice',
    question: "Why can't I delete this invoice?",
    answer: `Only invoices still in **Pending** status can be deleted. Once an invoice has been sent to a client or marked paid, it's a financial record — deleting it would erase the payment history, so the delete option is intentionally unavailable for **Sent** and **Paid** invoices.

If a sent or paid invoice needs to be corrected, don't delete it — instead adjust the underlying session (which may prompt you to regenerate the invoice) or contact the client directly if payment details need to change.`,
    articleSlug: 'invoice-lifecycle',
    category: 'invoices',
    adminOnly: true,
  },
  {
    id: 'solo-group-price',
    question: 'Why is a group session billed less when only one person shows up?',
    answer: `Group service pricing normally adds a per-person rate on top of the base rate (Total = Base Rate + Per-Person Rate × Attendees). But when only 1 person actually attends a group session, that per-person charge is waived automatically — the client is billed just the base rate, the same as if the service were priced for a solo attendee.

This "solo exception" keeps a lightly-attended group session from being billed at the same total as a full group. The base rate is still scaled by duration as usual.`,
    articleSlug: 'pricing-deep-dive',
    category: 'invoices',
    adminOnly: true,
  },
  {
    id: 'contractor-pay-differs',
    question: "Why does a contractor's pay differ between services?",
    answer: `Contractor pay is resolved through a priority chain, and different services can be configured to use different rules. The app checks, in order: a **custom rate** set for that contractor on that specific service type (Team > Rates), then a **pay schedule** defined on the service type itself (flat amounts per duration), and finally falls back to a **formula** (Total Billed minus the service's MCA percentage, optionally capped).

Because each service type and each contractor can have its own settings at any of these levels, the same contractor can legitimately earn different amounts for different services — it's not an inconsistency, it's whichever rule is most specific for that combination.`,
    articleSlug: 'pricing-deep-dive',
    category: 'team',
    adminOnly: true,
  },
  {
    id: 'what-approve-does',
    question: 'What happens when I approve a session?',
    answer: `Approving moves the session's status from **Submitted** to **Approved** and records the timestamp automatically. Approved sessions become the source of truth for payroll — they're included as unpaid contractor work on the Payroll Hub until marked paid.

If your organization has **Auto-Send Invoice on Approval** turned on (Settings > Customize and Automate > Automation), approving also sends the client's invoice right away through whichever method matches their billing method (email or Square). If auto-send is off, the invoice stays in Pending status until you send it manually.`,
    articleSlug: 'session-workflow',
    category: 'sessions',
    adminOnly: true,
  },
  {
    id: 'invoice-overdue-how',
    question: 'How does an invoice become overdue?',
    answer: `Overdue isn't a status you set manually — it's calculated automatically. Every invoice gets a due date when it's first created (the session date plus your organization's **Default Due Days** setting), and once an invoice has been marked **Sent** but not yet **Paid**, that due date is compared against today. Once today's date passes the due date, the invoice shows an **Overdue** badge with a day count.

Because it's computed rather than stored, an overdue invoice returns to normal automatically the moment it's marked paid — there's nothing to "un-flag."`,
    articleSlug: 'invoice-lifecycle',
    category: 'invoices',
    adminOnly: true,
  },
  {
    id: 'change-no-show-fee',
    question: 'How do I change the no-show fee?',
    answer: `Go to **Settings > Business Rules > Sessions tab** and update the **No-Show Fee ($)** field. This is an organization-wide flat amount (the default is $60) — it's what gets billed to the client whenever a session is marked as a no-show, regardless of which service type or duration the session was scheduled for.

Changing this setting only affects no-shows recorded after the change; sessions already marked as no-shows keep the fee amount that was in effect when they were recorded.`,
    articleSlug: 'no-shows-and-cancellations',
    category: 'settings',
    adminOnly: true,
  },
  {
    id: 'no-show-pay',
    question: 'Does a contractor still get paid for a no-show?',
    answer: `Yes. When a session is marked as a no-show, the client is billed the flat no-show fee, but the contractor still receives their **normal 30-minute session pay** for that service, as if the session had happened. Your organization (MCA) keeps whatever is left over after the contractor is paid out of the no-show fee.

This is intentional — the contractor still set aside the time for the appointment, so their pay isn't reduced just because the client didn't show up.`,
    articleSlug: 'no-shows-and-cancellations',
    category: 'sessions',
    adminOnly: false,
  },
  {
    id: 'tax-year-rule',
    question: 'Which year does a payment count in for taxes?',
    answer: `Tax summaries use **cash-basis accounting** — a session's pay counts toward the tax year in which the contractor was actually **paid**, not the year the session took place. If a session happened in December but the contractor wasn't paid out until January, it counts toward the following year's totals.

This is why the Tax Summaries tab and the annual CSV export are driven off the payroll "paid date," not the session date. Sessions that have never been marked paid don't appear in any tax year's totals yet.`,
    articleSlug: 'tax-summaries',
    category: 'analytics',
    adminOnly: false,
  },
  {
    id: 'portal-link-expired',
    question: "A client's portal link expired — how do I send a new one?",
    answer: `Open the client's detail page and find the **Portal Access** card. If their link has expired, the card won't show an Active badge anymore — click **Send Portal Invite** to email them a fresh link (if they have an email on file), or **Generate Portal Link** to create one that's shown once with a Copy button so you can share it yourself. Issuing a new link doesn't cut off older ones; if you need to invalidate everything previously sent, use **Revoke Access**. Clients with an email can also request a fresh link themselves from the "This Link Has Expired" screen.

How long a new link stays valid is controlled by **Settings > Business Rules > Sessions tab > Portal Link Expiry (days)** (default 90 days).`,
    articleSlug: 'client-portal',
    category: 'clients',
    adminOnly: true,
  },
  {
    id: 'contractor-cant-see',
    question: "Why can't a contractor see other people's sessions?",
    answer: `This is by design. The **contractor** role does not have the \`session:view-all\` permission, so the Sessions page automatically filters to only that contractor's own sessions — they can't browse or search other contractors' work, clients, or earnings.

Only **admin**, **owner**, and **developer** roles can see every session across the organization. Owners and developers can use **View As** to simulate a specific contractor's account rather than granting broader access; the View As switcher doesn't appear for admins, so if you're an admin, ask your owner to check.`,
    articleSlug: 'inviting-team-members',
    category: 'team',
    adminOnly: true,
  },
  {
    id: 'turn-off-mfa',
    question: 'How do I turn off two-factor for someone?',
    answer: `Two-factor (MFA) has two layers, and both live at **Settings > Profile & Security**. The organization-wide **Require Two-Factor Authentication** switch sits in the Session Security card there (owners only). When it's on, **admin and owner accounts** must enroll before they can use the rest of the app — contractor accounts are never blocked by it, though anyone can enroll voluntarily.

A person's own MFA factors (their authenticator app enrollment) are managed on that same page, in the **Two-Factor Authentication** card — that's where each user enables or disables their own second factor. If MFA is org-required, an individual admin or owner can't be exempted: the requirement applies to every admin and owner account until the org-wide switch is turned off.`,
    articleSlug: 'profile-and-security',
    category: 'settings',
    adminOnly: true,
  },
  {
    id: 'change-password',
    question: 'How do I change or reset my password?',
    answer: `Use the password reset flow: from the login page, click **Forgot password?**, enter your account email, and you'll receive a reset link — follow it to choose a new password. If you're currently signed in, sign out first (avatar menu > Sign out). The same flow covers both a forgotten password and a routine change, and it works for accounts with two-factor authentication enabled.

If the email doesn't arrive, check your spam folder and confirm you used the address your account is registered under (shown at **Settings > Profile & Security** in the Account card). Note that repeated failed login attempts temporarily lock the account — if you've just been locked out, wait for the lockout to pass (15 minutes by default), then reset.`,
    articleSlug: 'profile-and-security',
    category: 'settings',
    adminOnly: false,
  },
  {
    id: 'edit-approved-session',
    question: 'What happens if I edit an approved session?',
    answer: `Admins and owners can edit sessions in any status, including approved ones (contractors can only edit their own drafts). If your edit changes the price and the session already has a linked invoice, you'll be prompted to choose: leave the invoice as-is, **Regenerate only** (updates the invoice's amounts and resets it to Pending so you can review and re-send it), or **Regenerate & send** (updates the invoice and emails it to the client immediately).

The session's approval status itself isn't automatically reverted — editing doesn't send it back through admin review. It's the linked invoice, not the session status, that needs your decision when pricing changes.`,
    articleSlug: 'session-workflow',
    category: 'sessions',
    adminOnly: true,
  },
  {
    id: 'square-marks-paid',
    question: 'How does an invoice get marked paid automatically?',
    answer: `When an invoice is sent via **Square**, the client gets a payment link by email. Once they pay, Square sends the app a webhook notification, and the invoice is automatically updated to **Paid** — no manual step required.

That status update is deliberately **forward-only**: Square doesn't guarantee webhook delivery order and sometimes retries events, so the app will never let an out-of-order or stale webhook "un-pay" an invoice that's already marked paid (for example, one paid by check). Once an invoice shows Paid, it stays Paid unless someone changes it manually.`,
    articleSlug: 'square-integration',
    category: 'invoices',
    adminOnly: true,
  },
  {
    id: 'square-fee-client',
    question: 'Can I pass the Square processing fee to just some clients?',
    answer: `Yes. Your organization has a default Square processing fee setting (Settings > Business Rules > Invoices tab), but each client also has their own **"Add Square processing fee to invoices"** checkbox on their client form — check or uncheck it to override the org default for that client specifically. It only applies the fee when that client's invoice is sent via Square, and you can still remove it from an individual invoice before sending.

Whatever was in effect at the time is locked into the invoice when it's created, so changing the org default or a client's setting later won't retroactively change fees on invoices that already exist.`,
    articleSlug: 'client-billing-controls',
    category: 'clients',
    adminOnly: true,
  },
  {
    id: 'monthly-vs-per-session',
    question: "What's the difference between monthly and per-session billing?",
    answer: `Most clients are billed **per-session** — each session they attend generates its own invoice right after it's submitted. A client can instead be set to **Monthly batch** billing on their edit form, in which case their sessions don't get individual invoices at all. Instead, they accumulate and are combined into a single invoice once a month, at normal (non-discounted) pricing.

Monthly-billed clients show up alongside scholarship clients on the **Invoices > Scholarship** tab, where you generate their batch invoice manually or let it happen automatically if the scholarship batch automation is enabled.`,
    articleSlug: 'client-billing-controls',
    category: 'clients',
    adminOnly: true,
  },
  {
    id: 'scholarship-generate-all',
    question: 'When should I run "Generate All" for scholarships?',
    answer: `Run **Generate All** on the **Invoices > Scholarship** tab after a calendar month has ended, once all of that month's sessions for scholarship and monthly-billed clients have been logged and submitted. It creates one batch invoice per client covering every uninvoiced session from that month, with each session listed as its own line item.

If your organization has **Auto-Generate Scholarship Invoices** enabled (Settings > Customize and Automate > Automation tab), this happens automatically on a configured day each month — Generate All is there for running it manually, or for catching sessions that were logged late.`,
    articleSlug: 'scholarship-billing',
    category: 'invoices',
    adminOnly: true,
  },
  {
    id: 'classroom-options',
    question: 'How do I make sessions record a classroom or location?',
    answer: `Turn on **Requires Classroom** on a service type (Settings > Business Rules > Services) to require a free-text **Classroom** field on every session that uses it — useful for in-school group sessions where you want to know which room a group met in.

For a specific client or agency instead — for example OLV or People Inc — check **Require a session location** on the client (Clients > Add/Edit Client). That shows a required free-text **Location** field on any session involving that client, including when they're the group "Bill To" agency. If both flags apply to the same session, the field is labeled Classroom. Either way it's free text with no list to maintain, and the recorded value prints on the invoice automatically.`,
    articleSlug: 'configuring-services',
    category: 'settings',
    adminOnly: true,
  },
  {
    id: 'add-payment-method',
    question: 'Can I rename or hide a payment method?',
    answer: `Yes. Go to **Settings > Customize and Automate > Custom Lists tab**, where both **Payment Methods** and **Billing Methods** are listed. Each entry can be given a custom display label, and any method you don't use can be hidden so it no longer appears in dropdowns throughout the app.

The underlying method types themselves (Private Pay, Self-Directed, Group Home, Scholarship, Venmo for payment methods; Square, Email, Check, Other for billing methods) can't be added to or removed — only relabeled and shown or hidden.`,
    articleSlug: 'custom-lists',
    category: 'settings',
    adminOnly: true,
  },
  {
    id: 'session-reminder-email',
    question: "Why did/didn't a session reminder email go out?",
    answer: `Session reminders are controlled by **Settings > Business Rules > Sessions tab** — the **Send Session Reminders** toggle turns the feature on or off, and **Reminder Lead Time** sets how many hours before the session the email goes out. Reminders are only queued for sessions with recipients who have an email address on file; if a client has no email, no reminder email can be sent for their session.

If reminders are enabled but one didn't arrive, check that the client's contact email is filled in and that the session was created far enough in advance for the reminder's lead time to have already passed.`,
    articleSlug: 'notifications-and-reminders',
    category: 'settings',
    adminOnly: true,
  },
  {
    id: 'invoice-reminder-days',
    question: 'When do invoice payment reminders send?',
    answer: `Payment reminders go out automatically for any **Sent** invoice that hasn't been paid yet, on the schedule set in **Settings > Business Rules > Invoices tab > Reminder Days Before Due** (a comma-separated list of day counts — the default is 7 days and 1 day before the due date). A daily automated check sends any reminder that's due.

Each reminder day is only ever sent once per invoice, so you won't get duplicates even if the check runs more than once. Reminders require the client to have an email on file, and the **Send Payment Reminders** toggle on that same settings tab must be on.`,
    articleSlug: 'notifications-and-reminders',
    category: 'settings',
    adminOnly: true,
  },
  {
    id: 'install-phone',
    question: 'Can I use the app on my phone?',
    answer: `Yes — MCA Manager is a Progressive Web App (PWA), so you install it straight from your phone's browser without an app store. On iPhone, open the site in Safari, tap the Share button, then **Add to Home Screen**. On Android, open the site in Chrome, tap the menu (three dots), then **Add to Home Screen**.

Once installed, it behaves like a native app with its own icon, and a service worker caches pages so recently viewed content is still reachable if you briefly lose connection.`,
    articleSlug: 'installing-the-app',
    category: 'getting-started',
    adminOnly: false,
  },
  {
    id: 'contractor-earnings-where',
    question: 'Where do I see what I\'ve earned?',
    answer: `Go to the **Earnings** page. It shows your year-to-date total, how much has already been paid out, and how much is still pending, with a monthly breakdown and per-session detail. "Pending" includes any session that's been submitted, approved, or marked as a no-show but not yet marked paid by your organization — the same set of statuses the Payroll Hub uses to decide who's owed money.

Once your organization marks a batch of sessions as paid, they move from pending to paid on this page and count toward that payment date's tax year.`,
    articleSlug: 'my-earnings',
    category: 'analytics',
    adminOnly: false,
  },
  {
    id: 'mark-contractors-paid',
    question: 'How do I record that I paid a contractor?',
    answer: `Go to **Payments > Payroll Hub tab**, find the contractor's row (it shows their unpaid session count and total owed), and click **Mark Paid**. A dialog lets you confirm the session count, total amount, and pick the payment date.

This action is atomic — it updates every one of that contractor's unpaid sessions in a single step, snapshotting the amount actually paid for each one, and it only touches sessions that weren't already marked paid, so running it twice or paying two contractors around the same time can't double-pay or corrupt anyone's totals.`,
    articleSlug: 'payroll-and-payments',
    category: 'analytics',
    adminOnly: true,
  },
  {
    id: 'session-request-flow',
    question: 'What happens when a client requests a session from the portal?',
    answer: `Clients can request a new session from their portal by submitting preferred (and optional alternative) dates and times, plus notes. The request is recorded, and staff notes stay private and encrypted — but as of now there's no dashboard screen that lists these requests for staff to review. If a client mentions they've submitted one, check with the practice owner or administrator directly. A staff-facing review screen is planned for a future update.

Behind the scenes, approving a request sends the client a confirmation email and — when the reviewer supplies a date, service type, and contractor — can also create the session directly in **approved** status, with its invoice, skipping the draft/submit queue. Declining sends the client a decline notice. Either way a request can only be acted on once.`,
    articleSlug: 'session-requests',
    category: 'sessions',
    adminOnly: true,
  },
  {
    id: 'view-as-testing',
    question: 'How do I see the app the way a contractor sees it?',
    answer: `Use **View As** mode. Look for the **View As** button in the header bar (available to owners and developers) and choose either a generic role (like Contractor) or a specific team member to simulate exactly what they see — their sessions, earnings, and navigation. While a simulation is active, the View As button turns amber and shows who you're viewing as, so you can't mistake the simulated view for your own data.

To exit, open the same **View As** menu again and choose **Owner (actual)** at the top — everything returns to your normal view. This is the safest way to verify permissions or troubleshoot what a contractor is reporting, without needing their login credentials.`,
    articleSlug: 'view-as-mode',
    category: 'getting-started',
    adminOnly: true,
  },
  {
    id: 'ask-the-ai',
    question: 'What can the AI helper answer?',
    answer: `The AI helper answers questions about how MCA Manager works — pricing, invoicing, payroll, settings — using the Help Center documentation and your organization's own configuration, and it links to the articles it relied on. It has no access to client, session, or team data, so keep client names and health details out of your questions.`,
    articleSlug: 'ai-helper',
    category: 'getting-started',
    adminOnly: false,
  },
  {
    id: 'rate-change-not-applied',
    question: "I changed a rate, but my sessions still show the old price. Why?",
    answer: `Session pricing is written down when the session is saved and then kept, so changing a service rate or a contractor rate only affects sessions logged **after** the change. This includes sessions sitting in your approvals queue — approving one does not re-price it, so it gets approved at the price it was saved with.

If you were correcting a mistake and want already-logged sessions moved onto the new pricing, go to **Sessions**, tick the ones you want, and click **Recalculate pricing**. You will see every old and new figure before anything is saved. Sessions whose invoice has already been sent or paid are deliberately left alone.`,
    articleSlug: 'recalculating-pricing',
    category: 'sessions',
    adminOnly: true,
  },
  {
    id: 'how-to-report-a-bug',
    question: 'Something is broken — how do I report it?',
    answer: `Open the **avatar menu** in the top-right corner and choose **Report a Bug**. Describe what you were trying to do and what happened instead. If a page has crashed outright, use the **Report this** button on the error screen instead — it attaches a reference code that points straight at the failure.

You don't need to explain your setup. The page you were on, your browser, the app version, and any errors your browser recorded are all attached automatically. A screenshot is optional but usually the fastest way to show a visual problem — note that a screenshot of most pages will include client information, so it's stored securely and deleted after 90 days.`,
    articleSlug: 'reporting-a-bug',
    category: 'getting-started',
    adminOnly: false,
  },
]
