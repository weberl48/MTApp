import type { HelpArticle } from '../types'

export const SESSIONS_ARTICLES: HelpArticle[] = [
  {
    slug: 'logging-a-session',
    title: 'Logging a Session',
    category: 'sessions',
    description: 'How to log a therapy session, including the pricing preview and submission workflow.',
    walkthrough: 'log-session',
    relatedArticles: ['group-sessions', 'approving-sessions'],
    keywords: ['log', 'new session', 'classroom', 'location', 'site', 'room', 'where', 'notes', 'duration', 'quick log'],
    content: `
## Logging a Session

Every session you provide should be logged in MCA Manager. Logged sessions flow into invoicing and contractor pay tracking automatically.

### Steps to Log a Session

1. Click **Sessions** in the sidebar, then click **New Session**. On mobile, tap the floating action button at the bottom of the screen.
2. Fill in the session details:
   - **Date** - The date the session took place.
   - **Time** - Session start time.
   - **Duration** - Select the session length. The default options are 30, 45, 60, or 90 minutes (your organization can customize this list).
   - **Service Type** - The type of therapy provided. Only service types you are authorized for will appear.
   - **Client(s)** - Select the client. For group sessions, you can select multiple clients.
   - **Classroom / Location** - Appears when the service type has **Requires Classroom** turned on, or any selected client (or the group's "Bill To" agency) has **Require a session location** checked. It's a free-text field, always required when shown, labeled "Classroom" if the service type flag applies (otherwise "Location"). Configure these flags on the service type form or the client dialog.
   - **Internal Notes** - Notes for your team. These are encrypted and never visible to clients.
   - **Client Notes** - Notes that may be shared with the client through the portal.
3. Under **Save as**, choose **Submit for approval** or **Save as draft**, then click the button at the bottom (it reads **Submit Session** or **Save Draft** to match your choice).

Drafts are not billed — the invoice is created automatically when the session is submitted for approval (whether you submit right away or open the draft later and submit it then).

### Service Types and Restrictions

Service types are configured by your organization. Some types are restricted to specific contractors, so you may not see all available service types. Admin-only work types (such as administrative tasks) may not require a client.

### Remembered Defaults

The session form remembers your last-used time and duration. These are pre-filled the next time you open the form to speed up repeat entries. The service type is **not** remembered — you always choose it fresh to avoid accidentally logging under the wrong type.

### Quick Session on Mobile

On mobile devices, contractors see a floating action button that opens a simplified quick-log drawer at the bottom of the screen. The quick-log drawer remembers your full previous settings (including service type) so you can re-log the same session in seconds.

### Pricing Preview

After selecting a service type and client, a pricing summary appears below the form. Contractors and admins see their expected earnings ("Your Earnings"). Only owners see the full financial breakdown including total, MCA cut, contractor pay, and any rent.

### After Submitting

Once submitted, a session goes to an admin for review. You can view its status on the Sessions page. If a revision is requested, you will see the reason and can edit and resubmit.

If you want to log another session right away, click the **Log Another** button that appears on the success screen. The form resets the date, service type, clients, and notes, but keeps your time and duration from the previous entry.
    `,
  },
  {
    slug: 'group-sessions',
    title: 'Group Sessions',
    category: 'sessions',
    description: 'How group session pricing works, including the solo exception and total cap.',
    relatedArticles: ['logging-a-session', 'configuring-services'],
    keywords: ['group', 'per-person rate', 'headcount', 'solo exception', 'classroom'],
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

For most group services, contractor pay scales based on the MCA percentage formula or the pay schedule (the same way it works for individual sessions).

However, the owner can also set up a **headcount-based pay matrix** for any group service type. When configured, the contractor's pay is looked up based on both the **number of clients** and the **session duration**. For example, a 30-minute group session might pay $40 for 1 client, $49 for 2, $63 for 3, and so on up to a "6+" cap.

If a headcount/duration combination is not defined in the matrix, the system falls back to the normal pay schedule or formula. This feature is configured in **Settings > Business Rules > Services** when editing a group service type.

### Session Location

A **Classroom** or **Location** field appears on the session form when it's needed: **Classroom** shows up when the session's service type has **Requires Classroom** turned on (set on the service type form); **Location** shows up when any client on the session — including the "Bill To" agency for a group billed to one — has **Require a session location** checked (set in the client add/edit dialog). If both flags apply to the same session, the field is labeled Classroom.

The field is free text and always required when it appears. Whatever the contractor enters is recorded on the session, included in data exports, and automatically printed on the client's invoice.

### Separate Invoices

Even though it is one session, a separate invoice is generated for each client who attended. Each client's invoice reflects their portion of the session cost.
    `,
  },
  {
    slug: 'approving-sessions',
    title: 'Approving and Managing Sessions',
    category: 'sessions',
    description: 'How to review, approve, request revisions on, and manage submitted sessions.',
    walkthrough: 'approve-sessions',
    adminOnly: true,
    relatedArticles: ['logging-a-session', 'generating-invoices', 'session-workflow'],
    keywords: ['approve', 'revision', 'bulk approve', 'reject', 'review queue', 'dashboard', 'amount'],
    content: `
## Approving and Managing Sessions

After a contractor submits a session, it enters a review queue. As an admin or owner, you decide whether to approve, request a revision, or otherwise handle each session.

### Where to Find Submitted Sessions

Two places, and both let you approve without opening the session:

- The **Pending Approvals** card on your Dashboard lists everything awaiting review, newest first.
- The **Sessions** page filtered by status "Submitted" shows the same queue with the full set of filters and search.

Each row shows the service, date, duration, contractor, clients, and the session total, so you can check the amount is right and approve straight from the list. The total is visible to owners; admins see it only if the owner has enabled **Session & invoice margins** under Settings > Profile & Security > What Admins Can See. A total shown as "—" means the session has no recorded amount yet - open it to check.

### Available Actions

- **Approve** - Confirms the session. Its invoice was already created automatically when the contractor submitted the session (scholarship and monthly-billed clients don't get a per-session invoice).
- **Request Revision** (called **Revise** on the sessions list) - Sends the session back to draft status with a reason. The session is flagged **Needs Revision**, the contractor can see your note, make changes, and resubmit. Any pending invoice for the session is removed at this point and recreated automatically when the contractor resubmits.
- **Mark No-Show** - Used when a client did not attend. A flat no-show fee is charged to the client, and the contractor still receives their normal session pay.
- **Cancel** - Removes the session from billing entirely. No invoice is created.
- **Delete** - Permanently removes the session. Use only when the session was logged in error.

### Bulk Approve

To approve multiple sessions at once:

1. On the Sessions list, tick the checkboxes on individual session cards, or use **Select all submitted** at the top of the list.
2. A blue bar appears showing how many sessions are selected.
3. Click **Approve (N)** in that bar to approve them all at once.

The Dashboard's Pending Approvals card works the same way: tick rows or use **Select all**, then click **Approve (N)** in the card header.

This is useful at the end of a pay period when all submissions are ready to process at once.

### After Requesting a Revision

Sessions sent back for revision return to draft status and appear in the contractor's Sessions list with a **Needs Revision** badge and the reason you provided. The contractor edits the session and resubmits, at which point it returns to your review queue. Resubmitting also recreates the session's invoice automatically, so nothing goes unbilled.

### After Approval

Once approved, the session status changes to "Approved". If auto-send is enabled in Settings, the invoice (already created when the session was submitted) is sent to the client immediately.
    `,
  },
  {
    slug: 'session-workflow',
    title: 'Session Status Workflow',
    category: 'sessions',
    description: 'How a session moves from draft through submitted and approved, and what each status change triggers for billing.',
    adminOnly: true,
    relatedArticles: ['logging-a-session', 'approving-sessions', 'no-shows-and-cancellations'],
    keywords: ['draft', 'submitted', 'approved', 'status', 'resubmit', 'reject'],
    content: `
## Session Status Workflow

Every session moves through a small set of statuses on its way from being logged to being paid. Knowing the workflow tells you who can act on a session and exactly when billing happens.

### The Statuses

- **Draft** - Saved but not yet submitted. Not billed. Only the contractor who logged it (or an admin/owner) can edit it.
- **Submitted** - Sent for review. This is the point where the per-session invoice is created for each attending client (scholarship and monthly-billed clients are held for batch invoicing instead - see Client Billing Controls).
- **Approved** - Reviewed and confirmed by an admin or owner. The approval timestamp is stamped automatically, and if auto-send is enabled the invoice goes out to the client right away.
- **Cancelled** - Removed from billing entirely. No invoice is created or kept.
- **No-Show** - The client didn't attend; a flat no-show fee is billed instead of the normal session total. See No-Shows and Cancellations for the pricing details.

### Who Can Do What

- **Contractors** can create sessions and edit their own **draft** sessions, including sessions sent back to them for revision. They cannot edit a session once it has been submitted or approved.
- **Admins and owners** can edit any active session regardless of status, and are the only roles who can approve, request a revision, cancel, mark a no-show, or delete a session.

### What Submitting Triggers

Submitting a session - whether right away or from an open draft - creates the per-session invoice for each attending client in **Pending** status. If **Auto-Approve Sessions** is enabled in Settings, a session you submit is approved immediately instead of waiting in the review queue.

### What Approving Triggers

Approving a submitted session records when it was approved and, if **Auto-Send Invoice on Approval** is enabled (Settings > Customize and Automate > Automation), sends the already-created invoice to the client by email or Square immediately - no manual step required. Bulk-approving from the Sessions list runs the same checks for every selected session.

### Requesting a Revision

Instead of approving, an admin can send a submitted session back with **Request Revision** (labeled **Revise** on the sessions list) and a note explaining what needs to change. This resets the session to **draft** status with a **Needs Revision** badge and removes its pending invoice. The contractor edits the session and resubmits it, which recreates the invoice and returns the session to the review queue.

### Editing an Approved Session

Admins and owners can also edit a session after it has been approved - for example, to fix the duration or attendee list. If the session already has a linked invoice, saving the change prompts you to choose: leave the existing invoice as-is, regenerate it to match the new total (which resets it to Pending so it can be re-sent), or regenerate and send it in one step. An invoice that has already been paid is a financial record and is never deleted by these flows.

### See Also

For how to log a session, see **Logging a Session**. For the day-to-day review queue - approve, revise, bulk-approve - see **Approving and Managing Sessions**.
    `,
  },
  {
    slug: 'no-shows-and-cancellations',
    title: 'No-Shows and Cancellations',
    category: 'sessions',
    description: 'The difference between cancelling a session and marking it a no-show, and how each affects billing and contractor pay.',
    adminOnly: false,
    relatedArticles: ['session-workflow', 'approving-sessions', 'logging-a-session'],
    keywords: ['no-show', 'no show fee', 'cancel', 'missed session', "didn't show"],
    content: `
## No-Shows and Cancellations

Sometimes a scheduled session doesn't happen - a client cancels ahead of time, or simply doesn't show up. MCA Manager treats these two situations differently because they have different billing consequences.

### Cancel vs. No-Show

- **Cancel** removes the session from billing entirely. No invoice is created, and there is no charge to the client or pay for the contractor. Use Cancel when a session was logged in error or called off with enough notice that it isn't billable.
- **No-Show** is for a session where the contractor showed up as scheduled but the client didn't. The client is still billed - just at a flat no-show fee instead of the session's normal price.

Both actions are performed by an admin or owner from the session's detail page. A contractor can't cancel a session or mark it as a no-show themselves, but the outcome - and what it means for their pay - is explained below.

### The No-Show Fee

When a session is marked as a no-show, the client is charged a flat fee - **$60 by default** - regardless of what the session's normal rate would have been. The contractor still receives their **normal 30-minute session pay** for that service type, as if the missed session had happened. MCA keeps whatever is left of the no-show fee after contractor pay is deducted.

In other words, a no-show doesn't cost the contractor anything - the practice absorbs the difference between the flat fee and what a full session would normally bill.

> **Where to configure:** the no-show fee amount is set in **Settings > Business Rules > Sessions**, under **No-Show Fee ($)**. Changing it only affects sessions marked as no-shows going forward - past no-shows keep the fee that applied at the time.

### Invoice Consequences

- **Cancelling** a session removes its pending invoice, if one exists. An invoice that has already been sent or paid is a financial record and is left untouched - cancelling the session won't delete it.
- **Marking a no-show** re-prices any pending invoice(s) for the session to the no-show fee, split evenly across clients if more than one was on the session. Invoices that have already been sent or paid are not changed automatically and would need to be handled manually.

### See Also

For the full status workflow a session goes through, see **Session Status Workflow**. For how a submitted session is reviewed day-to-day, see **Approving and Managing Sessions**.
    `,
  },
  {
    slug: 'session-requests',
    title: 'Session Requests',
    category: 'sessions',
    description: 'How clients request sessions from the portal, what information is captured, and how requests are approved or declined.',
    adminOnly: true,
    relatedArticles: ['client-portal', 'logging-a-session', 'session-workflow'],
    keywords: ['request', 'portal request', 'approve request', 'decline', 'pending request'],
    content: `
## Session Requests

Clients with portal access can ask for a new session without calling or emailing your office. The portal includes a **Request a Session** form where they submit their preferred date and time, an optional alternative date and time, the duration they'd like, and a note describing what they need.

A session request is not a scheduled session by itself - it's a request that a staff member reviews and turns into an actual session (or declines). Nothing is billed and no session appears on the Sessions list until a request has been acted on.

### What Gets Captured

Each request records:

- **Preferred date/time** and an optional **alternative date/time**, in case the first choice doesn't work.
- **Duration** (defaults to 30 minutes).
- **Notes** from the client describing what they're requesting.

The notes are treated as PHI and stored encrypted, the same as session notes. They are only decrypted for staff who read the request directly - never logged or shown in plain text elsewhere.

### Current Status

Every request starts out **pending**. As of this writing, MCA Manager does not yet have a dashboard screen where staff can browse the list of pending session requests day-to-day - the same gap noted in the Client Portal article. If a client mentions they've submitted a request, check with your practice owner or developer directly rather than looking for a review queue in the app; a staff-facing review screen is planned for a future update.

### How Approving and Declining Work

The underlying system already supports resolving a request:

- **Approving** a request can create a session directly, in **approved** status, using the service type, contractor, date, and time chosen by the reviewer - it does not go through the normal draft/submit review queue. The session is priced immediately, an invoice is created the same way any other approved session's invoice is, and the client is emailed that their request was approved.
- **Declining** a request marks it as declined and emails the client a decline notice, optionally with a note explaining why.

A request can only be acted on once - after it's approved or declined, its status is locked and it drops out of the pending list. Approving or declining requires the same permission as approving a regular session (admin or owner); a contractor cannot act on a session request, even one from their own client.

### See Also

For the client-facing side of requesting a session, see **Client Portal**.
    `,
  },
]
