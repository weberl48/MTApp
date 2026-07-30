import type { HelpArticle } from '../types'

export const SESSIONS_ARTICLES: HelpArticle[] = [
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
   - **Duration** - Select the session length. The default options are 30, 45, 60, or 90 minutes (your organization can customize this list).
   - **Service Type** - The type of therapy provided. Only service types you are authorized for will appear.
   - **Client(s)** - Select the client. For group sessions, you can select multiple clients.
   - **Classroom / Program** - Appears when the billed client/agency has a classroom or program list configured (e.g., schools, day habs, group homes), or for scholarship group sessions using the general classroom list. Pick where the session took place.
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

### Classroom Selection

For scholarship group sessions, a **Classroom** dropdown appears on the session form. This lets contractors indicate which classroom the session took place in. The list of classrooms is configurable by the owner in **Settings > Business Rules > Sessions**. The classroom is recorded on the session and included in data exports.

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
    relatedArticles: ['logging-a-session', 'generating-invoices'],
    content: `
## Approving and Managing Sessions

After a contractor submits a session, it enters a review queue. As an admin or owner, you decide whether to approve, request a revision, or otherwise handle each session.

### Where to Find Submitted Sessions

Go to the **Sessions** page and filter by status "Submitted." All sessions waiting for review will appear here.

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

This is useful at the end of a pay period when all submissions are ready to process at once.

### After Requesting a Revision

Sessions sent back for revision return to draft status and appear in the contractor's Sessions list with a **Needs Revision** badge and the reason you provided. The contractor edits the session and resubmits, at which point it returns to your review queue. Resubmitting also recreates the session's invoice automatically, so nothing goes unbilled.

### After Approval

Once approved, the session status changes to "Approved". If auto-send is enabled in Settings, the invoice (already created when the session was submitted) is sent to the client immediately.
    `,
  },
]
