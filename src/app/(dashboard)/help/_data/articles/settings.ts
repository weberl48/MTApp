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
    content: `
## Configuring Service Types

Service types define what your organization offers and how each service is priced. They control both what clients are billed and what contractors are paid.

### Where to Find It

Navigate to **Settings > Business Rules > Services** tab.

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
    content: `
## Editing Service Types: A Complete Guide

Service types are the single most powerful tool you have as an owner to customize how your practice runs. Every session that gets logged, every invoice that gets generated, and every contractor payment that gets calculated flows through the service type configuration. This guide walks through each field and shows you how to use them together.

### Getting There

1. Go to **Settings** in the sidebar.
2. Click the **Business Rules** tab, then the **Services** sub-tab.
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
    relatedArticles: ['generating-invoices', 'scholarship-billing', 'configuring-services'],
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
    content: `
## Profile & Security Settings

Manage your personal information and account security from the Profile & Security page.

### Where to Find It

Navigate to **Settings > Profile & Security**.

### Profile

Update your display name and phone number. These are visible to your team members and may appear on communications.

### Account Details

Your email, role, and organization are displayed for reference. These are read-only and can only be changed by an administrator.

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
    `,
  },
  {
    slug: 'practice-branding',
    title: 'Practice & Branding',
    category: 'settings',
    description: 'How to customize your logo, brand colors, business details, and regional settings.',
    adminOnly: true,
    relatedArticles: ['getting-started', 'automation-settings'],
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
]
