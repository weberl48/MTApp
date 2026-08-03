import type { HelpArticle } from '../types'

export const SETTINGS_ARTICLES: HelpArticle[] = [
  {
    slug: 'configuring-services',
    title: 'Configuring Service Types',
    category: 'settings',
    description: 'How to set up service types, pricing fields, and contractor restrictions.',
    walkthrough: 'configure-services',
    adminOnly: true,
    relatedArticles: ['editing-service-types', 'group-sessions', 'managing-contractor-rates', 'scholarship-billing'],
    keywords: ['service type', 'pricing', 'base rate', 'mca percentage', 'contractor cap', 'rent percentage'],
    content: `
## Configuring Service Types

Service types define what your organization offers and how each service is priced. They control both what clients are billed and what contractors are paid.

### Where to Find It

Navigate to **Settings > Business Rules > Services** tab. The Services tab is owner-only — it sets contractor pay, so admins do not see it. Admins still get the Invoices, Sessions, and Notifications tabs.

### Fields When Creating or Editing a Service Type

- **Name** - A descriptive label shown on sessions and invoices (e.g., "Individual Music Therapy").
- **Base Rate** - The price for a standard 30-minute session.
- **Per-Person Rate** - Additional amount per attendee for group services. Set to 0 for individual services.
- **MCA Percentage** - The percentage of the total that stays with the organization.
- **Contractor Cap** - Optional maximum amount a contractor can earn per session.
- **Total Cap** - Optional maximum total that can be billed, regardless of headcount.
- **Rent Percentage** - Percentage withheld for location rent (e.g., Matt's Music).
- **Location** - The facility where this service is provided.
- **Requires Client** - Turn this off for administrative tasks that do not involve a specific client.
- **Restrict to Contractors** - Limit which contractors can select this service type when logging sessions.
- **Scholarship Service** - Mark this type as a scholarship service and set a flat scholarship rate per session.
- **Requires Classroom** - When on, any session using this service type shows a required free-text **Classroom** field (for example, an in-school group session). The recorded value prints on the invoice automatically.
- **Contractor Pay Schedule** - A duration-to-pay mapping (e.g., 30 min = $38.50, 45 min = $54.00) used for precise contractor pay calculations.

### Notes on Pricing

Duration scales from the base rate, which is defined for 30 minutes. A 60-minute session is twice the base rate, a 90-minute session is three times the base rate.

For scholarship services, the total billed is the flat scholarship rate regardless of duration. The contractor is still paid based on normal pricing rules, and the organization absorbs any difference.

### Learn More

For a detailed walkthrough of how to use each field to customize your practice, see **Editing Service Types: A Complete Guide**.
    `,
  },
  {
    slug: 'editing-service-types',
    title: 'Editing Service Types: A Complete Guide',
    category: 'settings',
    description: 'A deep dive into every service type field and how to use them to customize pricing, pay, and workflows for your practice.',
    walkthrough: 'edit-service-type',
    adminOnly: true,
    relatedArticles: ['configuring-services', 'managing-contractor-rates', 'group-sessions', 'scholarship-billing'],
    keywords: ['service type', 'pricing formula', 'contractor pay', 'duration', 'scholarship rate', 'group pay matrix'],
    content: `
## Editing Service Types: A Complete Guide

Service types are the single most powerful tool you have as an owner to customize how your practice runs. Every session that gets logged, every invoice that gets generated, and every contractor payment that gets calculated flows through the service type configuration. This guide walks through each field and shows you how to use them together.

### Getting There

1. Go to **Settings** in the sidebar.
2. Click the **Business Rules** tab, then the **Services** sub-tab (owner-only — these fields set contractor pay).
3. Click any existing service type to edit it, or click **Add Service Type** to create a new one.

Changes you make to a service type only affect new sessions going forward. Existing sessions and invoices keep their original pricing.

---

## The Basics

### Service Name

The name appears everywhere: the session form dropdown, invoices, the payroll hub, and analytics. Choose something clear and specific.

Good examples:
- "In-Home Individual Music Therapy"
- "Group Art Therapy (Matt's Music)"
- "Admin Work"

Avoid vague names like "Session" or "Standard" since contractors need to pick the right one quickly.

### Category

Categories organize your service types and appear in analytics breakdowns. The available categories are:

- **Music - Individual**
- **Music - Group**
- **Art - Individual**
- **Art - Group**

Pick the category that best matches the service. This does not affect pricing, only reporting.

### Location

Where the service takes place. Options are **In-Home**, **Matt's Music**, or **Other**. The location is shown on session records and can help you track which services happen at which facility. When Matt's Music is selected, you will typically pair it with a rent percentage (see below).

---

## Pricing Fields

These fields control what clients are billed. All amounts are based on a 30-minute session and scale up proportionally for longer durations.

### Base Rate

The total amount billed for a single-client, 30-minute session. This is the starting point for all pricing calculations.

For example, if your base rate is $80:
- A 30-minute session bills $80
- A 45-minute session bills $120 (1.5x)
- A 60-minute session bills $160 (2x)
- A 90-minute session bills $240 (3x)

### Per-Person Rate

Used for group services. This is the additional amount charged per attendee on top of the base rate.

- Set to **$0** for individual (one-on-one) services.
- Set to a dollar amount for group services.

For example, with a base rate of $50 and a per-person rate of $20 with 4 attendees:
- Total = $50 + ($20 x 4) = $130

If only one person shows up, the per-person rate is not charged (the "solo exception"). The total is just the base rate.

### Total Cap

An optional ceiling on the total billed amount, regardless of how many people attend. This protects clients from unexpectedly high bills in large groups.

For example, with a base rate of $50, per-person rate of $20, and a total cap of $150:
- 4 attendees: $50 + ($20 x 4) = $130 (under cap, billed normally)
- 8 attendees: $50 + ($20 x 8) = $210, but capped at **$150**

Leave this empty if you do not need a maximum.

---

## Organization and Contractor Pay

### MCA Percentage

The percentage of the total session amount that stays with the organization. The remainder (after rent, if applicable) goes to the contractor.

For example, with a $100 session total and 20% MCA percentage:
- MCA keeps $20
- Contractor receives $80 (before rent)

Set this to **0%** for services where the contractor keeps the full amount (common for certain group arrangements).

### Contractor Cap

An optional maximum on what the contractor can earn per session. Even if the formula would pay them more, their pay is capped at this amount.

This is useful when you want the session total to scale with headcount for billing purposes, but do not want the contractor's pay to scale the same way.

Leave empty if you do not need a ceiling on contractor pay.

### Contractor Pay by Duration

This is the most precise way to control contractor pay. Instead of relying on the formula (total minus MCA percentage), you set exact dollar amounts for each session duration.

For example:
- 30 min = $38.50
- 45 min = $54.00
- 60 min = $65.00
- 90 min = $90.00

When a pay schedule is set, the system uses these values as the baseline contractor pay. If a contractor also has a custom rate (set in Team > Rates), their custom rate is combined with the schedule to calculate the final pay for non-30-minute sessions.

The form shows an "auto" value next to each duration so you can see what the formula would calculate. Fill in only the durations you want to override. Leave a duration empty to use the automatic calculation.

### Group Contractor Pay by Headcount

This section only appears when the per-person rate is greater than zero (i.e., the service is a group service). It lets you set exact contractor pay amounts based on both the **number of clients** and the **session duration**.

The table has rows for 1 through 6+ clients and columns for each configured duration (e.g., 30, 45, 60, 90 minutes). Fill in the dollar amount for each combination.

For example, a contractor agreement might specify:
- 1 client, 30 min = $40
- 2 clients, 30 min = $49
- 3 clients, 30 min = $63
- 6+ clients, 30 min = $105

The **6+ row** acts as a cap. If 8 clients attend, the system uses the 6+ amount. Leave cells empty to fall back to the normal pay schedule or MCA percentage formula for that combination.

This is the most precise way to match contractor agreements that specify different pay rates for different group sizes.

### Rent Percentage

The percentage of the session total withheld for facility rent. This is subtracted after the MCA cut and before contractor pay.

Common setup: set this to **10%** for services at Matt's Music. Set to **0%** for in-home or other locations where no rent applies.

---

## Special Behaviors

### Requires Client

When turned **on** (the default), the session form requires selecting a client before the session can be submitted. This is the normal behavior for therapy sessions.

When turned **off**, the session form skips the client selection and notes fields, and instead shows a "Who did this work?" dropdown for selecting which admin-role team member performed the task. Use this for administrative work, paperwork, meetings, or other tasks that are not client-facing but still need to be tracked for pay.

Sessions logged with "Requires Client" off still flow through the same approval and payroll process as regular sessions.

### Scholarship Service

When toggled on, two things happen:

1. A **Scholarship Rate** field appears where you set a flat dollar amount per session. This is the amount billed to the scholarship fund, regardless of session duration.
2. Sessions using this service type are routed to **monthly batch invoicing** on the Invoices > Scholarship tab instead of generating a per-session invoice.

The contractor is still paid based on normal pricing rules. The organization absorbs any difference between the scholarship rate and what the contractor earns. This means switching a client to scholarship does not reduce their therapist's pay.

### Restrict to Contractors

By default, every contractor in your organization can select any active service type when logging sessions. Use this field to limit a service type to specific team members.

Check the boxes next to the contractors who should have access. When at least one contractor is checked, only those contractors will see this service type in their session form. Admins and owners can always see all service types regardless of restrictions.

Common uses:
- Restrict art therapy service types to art therapists only
- Limit a specialized service to the one contractor trained for it
- Keep the admin work type visible only to administrators

### Active Toggle

When turned **off**, the service type no longer appears in the session form dropdown. Existing sessions that used this service type are not affected. Use this to retire old service types without deleting them, preserving historical data.

---

## Putting It All Together

### Example: Standard Individual Music Therapy

- **Name**: In-Home Individual Music Therapy
- **Category**: Music - Individual
- **Location**: In-Home
- **Base Rate**: $80
- **Per-Person Rate**: $0
- **MCA Percentage**: 20%
- **Rent Percentage**: 0%
- **Requires Client**: On

Result: A 30-min session bills $80. MCA keeps $16, contractor earns $64. A 60-min session bills $160, MCA keeps $32, contractor earns $128.

### Example: Group Music at Matt's Music

- **Name**: Group Music Therapy (Matt's Music)
- **Category**: Music - Group
- **Location**: Matt's Music
- **Base Rate**: $60
- **Per-Person Rate**: $15
- **MCA Percentage**: 25%
- **Total Cap**: $150
- **Rent Percentage**: 10%
- **Requires Client**: On

Result: With 5 attendees, total = $60 + ($15 x 5) = $135. MCA takes $33.75, rent is $13.50, contractor gets $87.75.

### Example: Scholarship Individual Therapy

- **Name**: Scholarship Music Therapy
- **Category**: Music - Individual
- **Scholarship Service**: On
- **Scholarship Rate**: $60
- **MCA Percentage**: 20%
- **Contractor Pay Schedule**: 30 min = $38.50, 60 min = $65.00

Result: Client is billed $60 flat regardless of duration. Contractor gets $38.50 for 30 min or $65 for 60 min. MCA absorbs the gap between what the contractor earns and the $60 scholarship rate.

### Example: Admin Work

- **Name**: Admin Work
- **Category**: Music - Individual
- **Base Rate**: $25
- **MCA Percentage**: 0%
- **Requires Client**: Off
- **Restrict to Contractors**: Check only admin-role team members

Result: When logging a session, the form asks "Who did this work?" instead of asking for a client. The admin earns $25 for 30 minutes of work, $50 for 60 minutes, and so on. No invoice is generated since there is no client.

---

## Tips

- **Start simple**: set the base rate and MCA percentage first. You can always add caps, schedules, and restrictions later.
- **Use the pricing preview**: when creating or editing a service type, the form shows an "auto" calculation next to each duration in the pay schedule. Use this to verify the numbers make sense before saving.
- **Changes are forward-only**: editing a service type does not retroactively change existing sessions or invoices. You can safely adjust rates without worrying about past records.
- **Combine with custom rates**: service type pricing sets the default. Per-contractor custom rates (Team > Rates) override the default for individual contractors. Both systems work together.
- **Test with View As**: after making changes, use View As mode to simulate a contractor's experience and confirm they see the right service types and pricing.
    `,
  },
  {
    slug: 'automation-settings',
    title: 'Automation Settings',
    category: 'settings',
    description: 'How to configure automatic session approval, invoice sending, and scholarship billing.',
    adminOnly: true,
    walkthrough: 'automation',
    relatedArticles: ['generating-invoices', 'scholarship-billing', 'configuring-services', 'custom-lists'],
    keywords: ['auto-approve', 'auto-send invoice', 'scholarship batch', 'automation', 'custom lists'],
    content: `
## Automation Settings

Automation settings let you reduce manual steps in your workflow by enabling automatic actions for common tasks.

### Where to Find It

Navigate to **Settings > Customize and Automate** and click the **Automation** tab.

### Auto-Approve Sessions

When enabled, submitted sessions are automatically approved without requiring manual review. This is useful if you have trusted contractors and want to speed up the invoicing process.

Caution: with auto-approval on, there is no human review step before an invoice is created.

### Auto-Send Invoice on Approval

When enabled, invoices are automatically sent to clients as soon as the corresponding session is approved (or auto-approved). You can choose to send by email or by Square.

This eliminates the step of manually opening each invoice and clicking Send.

### Auto-Generate Scholarship Invoices

When enabled, scholarship invoices are automatically generated on a configurable day of the month. The system looks at all approved, unbilled scholarship sessions from the previous month and creates invoices for each client.

You set the day of the month (for example, the 1st or 15th), and the system handles the rest. Generated invoices start in Pending status so you can review them before sending.

### Custom Lists Tab

Also on the Customize and Automate page, the **Custom Lists** tab lets you:

- Rename payment methods and billing methods to match the terminology your organization uses.
- Show or hide specific payment methods and billing methods from the client creation form.

This keeps the interface clean and avoids confusion from options that are not relevant to your practice.
    `,
  },
  {
    slug: 'profile-and-security',
    title: 'Profile & Security Settings',
    category: 'settings',
    description: 'How to update your profile, set up two-factor authentication, and configure security policies.',
    adminOnly: false,
    relatedArticles: ['getting-started'],
    walkthrough: 'mfa-setup',
    keywords: ['mfa', 'two-factor authentication', 'password', 'password reset', 'forgot password', 'change password', 'security', 'lockout', 'session timeout'],
    content: `
## Profile & Security Settings

Manage your personal information and account security from the Profile & Security page.

### Where to Find It

Navigate to **Settings > Profile & Security**.

### Profile

Update your display name and phone number. These are visible to your team members and may appear on communications.

### Account Details

Your email, role, and organization are displayed for reference. These are read-only and can only be changed by an administrator.

### Changing Your Password

Password changes go through the reset flow: sign out (avatar menu > **Sign out**), then click **Forgot password?** on the login page and enter your account email. You'll receive a link to choose a new password. The same flow covers a forgotten password and a routine change alike, and it works for accounts with two-factor authentication enabled.

### Two-Factor Authentication (MFA)

MFA adds an extra layer of security to your account by requiring a code from an authenticator app in addition to your password.

To set up MFA:

1. Open Profile & Security.
2. In the MFA Setup section, follow the prompts to link an authenticator app (such as Google Authenticator or Authy).
3. Scan the QR code with your app and enter the verification code to confirm.

Once enabled, you will be asked for a code each time you log in. If your organization has enforced MFA, admins and owners will be required to set it up before they can use the rest of the app (contractors are not blocked by this setting, though everyone can still set up MFA voluntarily).

### Security Policies (Owner Only)

Owners can configure organization-wide security settings:

- **Session Timeout** - How many minutes of inactivity before a user is automatically logged out (5 to 120 minutes, default 30).
- **Require Two-Factor Authentication** - When enabled, admin, owner, and developer accounts must set up MFA before they can use the app. Contractor accounts are not blocked by this setting.
- **Max Login Attempts** - How many failed login attempts before an account is temporarily locked (3 to 10, default 5).
- **Lockout Duration** - How long a locked account stays locked, in minutes (5 to 60, default 15).

### What Admins Can See (Owner Only)

Administrators run sessions, clients and billing. By default they see none of the money side — not what any contractor earns, not pay rates, not margins, payroll or analytics. Owners decide how much to open up with four switches, all off by default:

- **Contractor pay & rates** - what each contractor earns, the Team page's earnings columns, and the Rates tabs.
- **Session & invoice margins** - pricing breakdowns on sessions and the Financial Breakdown on invoices.
- **Analytics & revenue** - the Analytics page and the dashboard revenue summary.
- **Payroll** - the Payroll page, contractor payouts, and the tax summary exports.

These only ever affect administrators. Contractors are never granted access this way, and owners always see everything. Only an owner can change them: an admin who tries to save these switches has the change discarded, so admins cannot grant themselves visibility.
    `,
  },
  {
    slug: 'practice-branding',
    title: 'Practice & Branding',
    category: 'settings',
    description: 'How to customize your logo, brand colors, business details, and regional settings.',
    adminOnly: true,
    relatedArticles: ['getting-started', 'automation-settings'],
    walkthrough: 'practice-branding',
    keywords: ['logo', 'brand colors', 'timezone', 'currency', 'invoice header', 'tax id'],
    content: `
## Practice & Branding

Customize how your practice appears on invoices, emails, and the client portal.

### Where to Find It

Navigate to **Settings > Practice & Branding**. This page is available to owners only.

### Organization Details

Set your practice name, email, phone, mailing address, and website. These appear on invoices and other communications sent to clients.

### Logo

Upload your practice logo. It will appear on invoices, email headers, and the client portal. If no logo is uploaded, your practice initials are displayed instead.

### Brand Colors

Choose a **primary color** and **secondary color** using the color pickers. These colors are used on invoice headers, email templates, and portal buttons to give your communications a consistent brand identity.

### Live Preview

As you make changes, a live preview panel shows how your branding looks across three contexts:

- **Invoice** - Header with your logo, name, and tagline.
- **Email** - Email template with branded header and action button.
- **Client Portal** - Portal header as clients will see it.

### Business Details

- **Tagline** - A short phrase that appears under your practice name on invoices and emails.
- **Business Description** - A brief description of your practice.
- **Tax ID / EIN** - Optional. If provided, it is printed on invoices.

### Regional Settings

- **Timezone** - Select your local timezone (US timezones are available).
- **Currency** - Choose your currency (USD, CAD, EUR, or GBP).

### Social Media

Optionally link your Facebook, Instagram, LinkedIn, YouTube, Twitter/X, and TikTok profiles. These may be displayed on your public-facing pages.
    `,
  },
  {
    slug: 'audit-log',
    title: 'Audit Log',
    category: 'settings',
    description: 'How to use the audit log to track all data changes for compliance.',
    adminOnly: true,
    relatedArticles: ['profile-and-security'],
    keywords: ['audit trail', 'compliance', 'hipaa', 'change history', 'who changed what'],
    content: `
## Audit Log

The audit log records every data change in the system, providing a complete compliance trail for HIPAA and business auditing purposes.

### Where to Find It

Navigate to **Settings > Audit Log**. This page is available to owners only.

### What Is Tracked

Every create, update, and delete action on the following tables is logged: sessions, invoices, clients, users, service types, session attendees, organizations, contractor rates, client goals, invites, portal tokens, session requests, and client resources.

Each log entry records the timestamp, the action performed, which table was affected, the record ID, and who made the change.

### Filtering the Log

Use the controls at the top to narrow down the log:

- **Search** - Find entries by user email or record ID.
- **Table filter** - Show only changes to a specific table (e.g., Sessions, Invoices, Clients).
- **Action filter** - Show only Created, Updated, or Deleted entries.

### Viewing Details

Click the **eye icon** on any log entry to open a detail view showing:

- For **updates**: which fields changed, with a side-by-side "before" and "after" comparison.
- For **creates**: the full record data as it was created.
- For **deletes**: the full record data as it existed before deletion.

### Pagination

The log shows 20 entries per page. Use the Previous and Next buttons to navigate through the history.
    `,
  },
  {
    slug: 'pricing-deep-dive',
    title: 'Pricing Deep Dive: How Session Amounts Are Calculated',
    category: 'settings',
    description: 'A full walkthrough of the pricing formula — duration scaling, group pricing, caps, and the contractor pay priority chain.',
    adminOnly: true,
    relatedArticles: ['configuring-services', 'editing-service-types', 'managing-contractor-rates', 'scholarship-billing', 'group-sessions'],
    keywords: ['price', 'rate', 'duration', 'multiplier', 'group price', 'contractor pay', 'formula'],
    content: `
## Pricing Deep Dive: How Session Amounts Are Calculated

Every dollar amount you see on a session, invoice, or paycheck comes from a small set of rules applied in a fixed order. This article walks through the full formula so you can predict exactly what a session will bill and pay before you save a service type.

### Step 1: The Base Amount

Every service type has a **Base Rate**, defined for a 30-minute session. For group services, a **Per-Person Rate** is added for each attendee.

> **Total (before duration scaling) = Base Rate + (Per-Person Rate x Attendees)**

**Solo exception:** if only 1 person attends a group service, the per-person charge is skipped entirely — they're billed just the base rate, the same as an individual session.

With a $60 base rate and $20 per-person rate:

| Attendees | Calculation | Total |
|-----------|-------------|-------|
| 1 | $60 (solo exception, per-person waived) | $60 |
| 3 | $60 + ($20 x 3) | $120 |
| 6 | $60 + ($20 x 6) | $180 |

### Step 2: Duration Scaling

The base amount is defined for a 30-minute session (configurable via **Duration Base**) and scales by a multiplier for other durations:

| Duration | Multiplier | Example ($80 base) |
|----------|-----------|---------------------|
| 30 min | 1x | $80 |
| 45 min | 1.5x | $120 |
| 60 min | 2x | $160 |
| 90 min | 3x | $240 |

Group totals scale the same way — the per-person portion is included before the multiplier is applied.

### Step 3: Total Cap

A service type can set an optional **Total Cap** — a ceiling on the billed amount no matter how many people attend. If the formula produces more than the cap, the client is billed the cap instead.

Example: base rate $50, per-person rate $20, total cap $150. With 8 attendees the formula gives $50 + ($20 x 8) = $210, but the client is billed **$150**.

### Contractor Pay: The Priority Chain

Contractor pay is calculated separately from the client bill, using the most specific rule that applies. The system checks these in order and stops at the first match:

1. **Group Contractor Pay Matrix** *(group services only)* — an exact dollar grid by headcount and duration, set on the service type. If headcount exceeds the largest defined row (e.g. "6+"), that row's amount is used.
2. **Custom Contractor Rate** — a per-contractor 30-minute base rate set in Team > Rates. For other durations it's combined with either an explicit per-15-minute increment (if one is set for that contractor) or the service type's pay schedule offset for that duration.
3. **Contractor Pay Schedule** — a duration-to-pay mapping set directly on the service type (e.g. 30 min = $38.50, 60 min = $65.00), used when the contractor has no custom rate.
4. **Percentage Formula** — the fallback: **Contractor Pay = Total Billed - (Total x MCA%)**. If a **Contractor Cap** is set, pay is capped there and the excess goes to MCA instead.

Whichever rule wins, the leftover after contractor pay (and rent, if the location has a rent percentage) stays with the organization as MCA's cut.

### Scholarship Pricing

Scholarship services (or scholarship-payment-method clients) are billed a **flat Scholarship Rate** per session regardless of duration — contractor pay is still calculated normally from the chain above, and MCA absorbs the difference between what the contractor earns and the flat rate charged. Scholarship pricing never reduces what a contractor takes home.

### Where Each Knob Lives

- Base rate, per-person rate, total cap, MCA percentage, contractor cap, rent percentage, pay schedule, group pay matrix, scholarship rate → **Settings > Business Rules > Services tab > Edit a service type**
- Duration base minutes and no-show fee → **Settings > Business Rules > Sessions tab**
- Per-contractor custom rates and increments → **Team > Rates tab** or a contractor's own **Rates** sub-tab

See **Editing Service Types: A Complete Guide** for a field-by-field walkthrough with more worked examples.
    `,
  },
  {
    slug: 'custom-lists',
    title: 'Custom Lists: Payment Methods & Billing Methods',
    category: 'settings',
    description: 'How to rename or hide payment and billing methods.',
    adminOnly: true,
    walkthrough: 'custom-lists',
    relatedArticles: ['configuring-services', 'automation-settings', 'client-billing-controls', 'client-details'],
    keywords: ['payment methods', 'billing methods', 'dropdown', 'rename', 'hide'],
    content: `
## Custom Lists: Payment Methods & Billing Methods

MCA Manager ships with a default set of payment methods and billing methods, but every organization uses different terminology. Custom Lists let you rename, hide, and extend these lists without any code changes.

### Payment Methods and Billing Methods

**Payment methods** describe how a client's care is funded: Private Pay, Self-Directed, Group Home, Scholarship, and Venmo by default. **Billing methods** describe how you invoice a client: Square, Check, Email, and Other by default.

For each entry in both lists, you can:

- **Rename** it to match your organization's language (for example, renaming "Group Home" to "Facility Billing").
- **Show or hide** it from the client creation and edit forms. Hiding an option doesn't affect existing clients already using it — it only removes it from the picker for new selections.

> **Where to find it:** Navigate to **Settings > Customize and Automate > Custom Lists** tab. Payment methods and billing methods each have their own editable list, with a **Save Custom Lists** button to apply changes.

### Why This Matters

Keeping these lists accurate avoids confusion on the session and client forms — contractors only see options that are relevant to your practice, in language your team already uses. If you rename "Self-Directed" to something your organization actually calls it, that label appears everywhere the payment method is shown: the client form, session form, invoices, and reports.

### Tips

- Hiding an option is safer than deleting data — existing clients keep their assigned payment or billing method even if it's hidden from new selections.
- Changes save immediately across the organization; there's no per-user override.
    `,
  },
  {
    slug: 'notifications-and-reminders',
    title: 'Notifications and Reminders',
    category: 'settings',
    description: 'How to configure admin email alerts, invoice payment reminders, and session reminder emails.',
    adminOnly: true,
    relatedArticles: ['automation-settings', 'generating-invoices', 'sending-invoices', 'session-workflow', 'client-details'],
    keywords: ['email', 'reminder', 'notification', "didn't get email", 'admin email'],
    content: `
## Notifications and Reminders

MCA Manager sends three kinds of automatic emails: an admin alert when something happens, a nudge to clients with unpaid invoices, and a heads-up to clients before their upcoming session. Each is independently configurable.

### Admin Notification Emails

Two toggles control emails sent to your practice's admin inbox:

- **Session Submitted** — sends an email when a contractor submits a session for approval.
- **Invoice Paid** — sends an email when an invoice is marked as paid.

Both go to the **Admin Notification Email** address you set on the same page — this can be different from any individual user's login email, so you can route notifications to a shared inbox.

> **Where to find it:** Navigate to **Settings > Business Rules > Notifications** tab.

### Invoice Payment Reminders

For unpaid invoices, the system can automatically email clients before the invoice due date. Configure:

- **Send Payment Reminders** — toggle the feature on or off.
- **Reminder Days Before Due** — a comma-separated list of how many days before the due date to send a reminder (default: 7 and 1 day before due).

A daily cron job checks all sent, unpaid invoices and sends any reminders that are due. Each reminder day is only sent once per invoice — the invoice's \`reminder_sent_days\` record tracks which reminders have already gone out, so clients won't get duplicate emails if the cron runs more than once.

> **Where to find it:** Navigate to **Settings > Business Rules > Invoices** tab.

### Session Reminders

Contractors' upcoming sessions can trigger a reminder email to the client before the session happens:

- **Session Reminders** toggle — turn the feature on or off.
- **Reminder Lead Time (hours)** — how many hours before the scheduled session the reminder should go out (1 to 72 hours, default 24).

Session reminders require the client to have an email address on file — if a client has no email, no reminder is scheduled for their sessions.

> **Where to find it:** Navigate to **Settings > Business Rules > Sessions** tab.

### Troubleshooting: "I didn't get an email"

- Check that the relevant toggle is turned on in Settings.
- Confirm the client (for session or invoice reminders) or the admin notification address has a valid email on file.
- Reminders are sent by a scheduled job, not instantly — invoice reminders run once daily, so there can be up to a day's delay from when the threshold is crossed.
- Ask an owner to check the **Audit Log** or server logs if an email should have gone out but didn't — emails require the practice's email service to be configured.
    `,
  },
]
