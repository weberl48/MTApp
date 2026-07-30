# MCA App Guide — Pricing, Invoicing & Configuration

*A reference for how the MCA App handles pricing, invoicing, and contractor pay — and where to adjust everything.*

---

## 1. Logging a Session

When a contractor logs a session, they fill out:

- **Date** and **Time**
- **Duration** — chosen from a dropdown (e.g., 30, 45, 60, 90 minutes)
- **Service Type** — determines pricing rules (e.g., "In-Home Individual Music Therapy")
- **Client(s)** — one client for individual sessions, or a headcount for groups
- **Classroom** — only appears for scholarship group sessions (if classrooms are configured)
- **Internal Notes** — not visible to the client
- **Client Notes** — visible to the client in their portal

Owners see a full **Pricing Preview** (total, per-person, MCA cut, contractor pay). Admins and contractors see a simpler "Your Earnings" line.

After submitting, the session enters the approval workflow (submitted → approved), and an invoice is created for each attending client.

> **Where to configure:**
> - Default duration, duration options → **Settings > Business Rules > Sessions tab**
> - Require notes toggle → same tab, **"Require Session Notes"**
> - Auto-submit toggle → same tab, **"Auto-Submit Sessions"**
> - Classroom options → same tab, **"Classroom Options"** field (comma-separated list)

---

## 2. How Pricing Works

### Individual Sessions

Billing starts with the service's **base rate** (set for 30 minutes) and scales by duration:

| Duration | Multiplier | Example ($80 base) |
|----------|-----------|---------------------|
| 30 min   | 1×        | $80                 |
| 45 min   | 1.5×      | $120                |
| 60 min   | 2×        | $160                |
| 90 min   | 3×        | $240                |

### Group Sessions

Group services add a **per-person rate** on top of the base rate:

> **Total = Base Rate + (Per-Person Rate × Attendees)**

**Solo exception:** If only 1 person shows up, the per-person charge is waived — they're billed just the base rate.

| Attendees | Example ($60 base, $20/person) | Total |
|-----------|-------------------------------|-------|
| 1         | $60 (solo exception)          | $60   |
| 3         | $60 + ($20 × 3)              | $120  |
| 6         | $60 + ($20 × 6)              | $180  |

Group totals are also scaled by duration.

### Total Cap

A service can have a **maximum billing amount**. If the formula would produce $210 but the cap is $150, the client is billed $150.

> **Where to configure:**
> - Base rate, per-person rate, total cap → **Settings > Business Rules > Services tab > Edit a service type**

---

## 3. Scholarship Pricing

Scholarship clients are billed at a **flat rate per session** regardless of duration. If the scholarship rate is $60, both a 30-minute and a 60-minute session are billed at $60.

The contractor still gets their full normal pay — MCA absorbs the difference.

Scholarship clients don't get per-session invoices. Instead, their sessions accumulate and are batch-invoiced once a month (see Section 9).

A service type can also be marked as a **Scholarship Service**, meaning *all* sessions of that type are batch-invoiced on the Scholarship tab regardless of the client's payment method.

> **Where to configure:**
> - Scholarship rate → **Settings > Business Rules > Services tab > Edit service type > "Scholarship Rate ($)"**
> - Scholarship service toggle → same form, **"Scholarship Service"** toggle

---

## 4. No-Shows

When a session is marked as a no-show, the client is charged a **flat no-show fee** (default: $60). The contractor still gets their normal 30-minute session pay. MCA keeps whatever is left over.

> **Where to configure:**
> - No-show fee → **Settings > Business Rules > Sessions tab > "No-Show Fee ($)"**

---

## 5. How Contractor Pay Is Determined

Contractor pay follows a priority chain — the most specific rule wins:

### Priority 1: Group Pay Matrix *(group services only)*

A grid of exact dollar amounts for every combination of group size and duration:

|            | 30 min | 45 min | 60 min |
|------------|--------|--------|--------|
| 1 client   | $40    | —      | —      |
| 2 clients  | $49    | $55    | $60    |
| 3 clients  | $63    | $74    | $85    |
| 4 clients  | $77    | $94    | $111   |
| 5 clients  | $91    | $113   | $136   |
| 6+ clients | $105   | $133   | $161   |

If 8 clients attend, the 6+ row applies. If a cell is blank, the next rule kicks in.

> **Where to configure:** Edit a group service type → **"Group Contractor Pay by Headcount"** matrix

### Priority 2: Custom Contractor Rate

Each contractor can have a **custom pay rate** (a 30-minute base) for any service type. For longer sessions, it scales using a **per-15-minute increment**.

Example — Sarah has $41.50 base with $13.50/15min increment:

| Duration | Calculation | Pay |
|----------|-------------|-----|
| 30 min   | $41.50 | $41.50 |
| 45 min   | $41.50 + $13.50 | $55.00 |
| 60 min   | $41.50 + ($13.50 × 2) | $68.50 |
| 90 min   | $41.50 + ($13.50 × 4) | $95.50 |

> **Where to configure:**
> - Per-contractor rates → **Team > [Contractor Name] > Rates tab** (set "Custom Pay" and "Increment" per service type)
> - Or use the matrix view → **Team > Rates tab** (grid of all contractors × service types)

### Priority 3: Pay Schedule *(individual services)*

Flat contractor pay amounts set directly on the service type for each duration:

| Duration | Pay |
|----------|-----|
| 30 min   | $38.50 |
| 45 min   | $54.00 |
| 60 min   | $75.00 |

> **Where to configure:** Edit an individual service type → **"Contractor Pay by Duration"** fields

### Priority 4: Percentage Formula

If none of the above apply:

> **Contractor Pay = Total Billed − (Total × MCA%)**

Example: $100 session at 23% MCA → Contractor gets $77, MCA keeps $23.

If a **contractor cap** exists, pay is capped at that amount and the excess goes to MCA.

> **Where to configure:**
> - MCA percentage → **Edit service type > "MCA Percentage"** (or shown as part of the service pricing)
> - Contractor cap → **Edit service type > "Contractor Cap ($)"**

### Key Rule: Scholarship Never Reduces Contractor Pay

No matter how contractor pay is calculated, scholarship pricing never reduces it. If a $100 session normally pays the contractor $77 and the scholarship rate drops the bill to $60, the contractor still gets $77. MCA absorbs the $17 difference.

---

## 6. Invoicing

### How Invoices Are Created

When a session is submitted, one invoice is created per attending client. Group session with 4 clients = 4 invoices. Scholarship clients are skipped (they're batch-invoiced monthly).

### Sending Invoices

There are two ways to deliver an invoice:

**Email** — A PDF is generated and emailed to the client. On the Invoices page, use the **"..."** menu on any invoice → **"Send via Email"**.

**Square** — A Square invoice is created with an online payment link. The client gets an email from Square. When they pay, the invoice is automatically marked as paid. Use the **"..."** menu → **"Send via Square"**.

You can also use quick actions on the Invoices list:
- **"Send"** button → marks the invoice as sent
- **"Paid"** button → marks it as paid

Or use **bulk actions** — select multiple invoices with checkboxes, then use **"Mark Sent"** or **"Mark Paid"** in the action bar.

### Square Processing Fee

Square charges a processing fee for online payments. MCA can pass this to the client as a service charge on the Square invoice:

- **Fixed fee** — a flat dollar amount (e.g., $2.50)
- **Percentage fee** — a percentage of the total, optionally plus a flat amount (e.g., 2.9% + $0.30)

The fee increases what the client pays but does not affect contractor pay.

> **Where to configure:**
> - Invoice due days, footer text, payment instructions → **Settings > Business Rules > Invoices tab**
> - Square processing fee → same tab, **"Square Processing Fee"** section (toggle on, choose Fixed or Percentage, set amounts)

---

## 7. Automatic Workflows

Three things can be automated:

### Auto-Approve Sessions
Sessions go straight from "submitted" to "approved" — no admin review needed.

### Auto-Send Invoice on Approval
When a session is approved, the invoice is automatically sent via the chosen method (email or Square). The invoice is only sent to clients whose **billing method** matches — e.g., if auto-send is set to Square, only clients with billing method "Square" get auto-sent.

### Auto-Generate Scholarship Batches
On a set day each month, batch invoices are generated for all scholarship clients with uninvoiced sessions.

> **Where to configure — all three:**
> - **Settings > Customize & Automate > Automation tab**
>   - **"Auto-Approve Sessions"** toggle
>   - **"Auto-Send Invoice on Approval"** toggle + **"Send Method"** dropdown (Email or Square)
>   - **"Auto-Generate Scholarship Invoices"** toggle + **"Day of Month"** (1–28)

---

## 8. Invoice Reminders

For unpaid invoices, the system sends automatic email reminders before the due date. By default, reminders go out **7 days** and **1 day** before due. Each reminder is sent only once.

> **Where to configure:**
> - **Settings > Business Rules > Invoices tab**
>   - **"Send Payment Reminders"** toggle
>   - **"Reminder Days Before Due"** — comma-separated list (e.g., "7, 1")

---

## 9. Scholarship Batch Invoicing

Scholarship clients follow a different invoicing path:

1. **Sessions accumulate** — No per-session invoice is created
2. **Monthly batch** — All uninvoiced sessions are grouped by client and calendar month
3. **One invoice per client per month** — Each batch invoice lists every session as a line item (date, service, duration, amount)
4. **Scholarship rate applied per session** — e.g., $60 each, then summed for the batch total

### Generating Batches Manually

Go to **Invoices > Scholarship tab**:
- **"Generate All (N)"** button — creates batch invoices for all clients with unbilled sessions
- Or click **"Generate Invoice"** on an individual client's card to batch just their sessions

### Generating Batches Automatically

See Section 7 — enable "Auto-Generate Scholarship Invoices" and set the day of month.

---

## 10. Payroll

After sessions are submitted, contractors need to be paid.

### Payroll Hub

Go to **Payments > Payroll Hub tab**. This shows all unpaid sessions grouped by contractor. Each row shows the contractor's name, number of unpaid sessions, and total pending amount.

Click the arrow to expand a contractor's row and see each individual session (date, service, clients, amount).

### Marking as Paid

Click **"Mark Paid"** on a contractor's row. A dialog shows the session count, total amount, and a date picker. Confirm to mark all their unpaid sessions as paid at once.

### Contractor View

Contractors can see their own earnings on the **Earnings** page:
- Year-to-date total earnings
- Amount paid out
- Amount still pending
- Monthly breakdown

---

## 11. Payment Methods vs. Billing Methods

Each client has two separate settings:

### Payment Method — *who pays / how the session is classified*

| Method | Meaning |
|--------|---------|
| **Private Pay** | Client pays directly |
| **Self-Directed** | Client is reimbursed |
| **Group Home** | Facility or agency is billed |
| **Scholarship** | Scholarship fund pays (triggers batch invoicing + flat rate) |
| **Venmo** | Payment via Venmo |

### Billing Method — *how the invoice is delivered*

| Method | Meaning |
|--------|---------|
| **Square** | Square invoice with online payment link |
| **Email** | PDF invoice emailed |
| **Check** | Manual / mailed |
| **Other** | Other arrangement |

The **payment method** affects **how much** is billed (scholarship vs. normal). The **billing method** affects **how** the invoice is delivered and whether auto-send applies.

> **Where to configure (rename/show/hide these lists):**
> - **Settings > Customize & Automate > Custom Lists tab**
> - Each method can be renamed or hidden. Hidden methods won't appear in any dropdown.

---

## 12. Contractor Restrictions & Classrooms

### Contractor Restrictions

A service type can be limited to specific contractors. If restrictions are set, only those contractors will see that service type when logging a session.

> **Where to configure:** Edit a service type → **"Restrict to Contractors"** checklist at the bottom of the form

### Classrooms

For scholarship group sessions, contractors can select a classroom from a dropdown. The options are configured as a comma-separated list.

> **Where to configure:** **Settings > Business Rules > Sessions tab > "Classroom Options"**

---

## 13. Quick Reference — Every Configurable Setting

| What | Where in the App | Field Name |
|------|-----------------|------------|
| **Service type pricing** (base rate, per-person, MCA %) | Settings > Business Rules > Services > Edit | Base Rate, Per Person Rate |
| **Total cap** | Settings > Business Rules > Services > Edit | Total Cap ($) |
| **Contractor cap** | Settings > Business Rules > Services > Edit | Contractor Cap ($) |
| **Scholarship rate** | Settings > Business Rules > Services > Edit | Scholarship Rate ($) |
| **Scholarship service toggle** | Settings > Business Rules > Services > Edit | Scholarship Service |
| **Pay schedule (by duration)** | Settings > Business Rules > Services > Edit (individual) | Contractor Pay by Duration |
| **Group pay matrix** | Settings > Business Rules > Services > Edit (group) | Group Contractor Pay by Headcount |
| **Contractor restrictions** | Settings > Business Rules > Services > Edit | Restrict to Contractors |
| **Active/inactive service** | Settings > Business Rules > Services > Edit | Active |
| **Custom contractor rates** | Team > [Contractor] > Rates tab | Custom Pay + Increment |
| **Custom contractor rates (matrix)** | Team > Rates tab | Click any cell to edit |
| **No-show fee** | Settings > Business Rules > Sessions tab | No-Show Fee ($) |
| **Default duration** | Settings > Business Rules > Sessions tab | Default Duration (minutes) |
| **Duration options** | Settings > Business Rules > Sessions tab | Duration Options |
| **Require session notes** | Settings > Business Rules > Sessions tab | Require Session Notes |
| **Auto-submit sessions** | Settings > Business Rules > Sessions tab | Auto-Submit Sessions |
| **Session reminders** | Settings > Business Rules > Sessions tab | Send Session Reminders + Reminder Lead Time |
| **Base duration for rate scaling** | Settings > Business Rules > Sessions tab | Base Duration for Rate Scaling |
| **Classroom options** | Settings > Business Rules > Sessions tab | Classroom Options |
| **Invoice due days** | Settings > Business Rules > Invoices tab | Default Due Days |
| **Invoice footer** | Settings > Business Rules > Invoices tab | Invoice Footer Text |
| **Payment instructions** | Settings > Business Rules > Invoices tab | Payment Instructions |
| **Payment reminders** | Settings > Business Rules > Invoices tab | Send Payment Reminders + Reminder Days Before Due |
| **Square processing fee** | Settings > Business Rules > Invoices tab | Square Processing Fee section |
| **Admin notification email** | Settings > Business Rules > Notifications tab | Admin Notification Email |
| **Email on session submit** | Settings > Business Rules > Notifications tab | Email on Session Submit |
| **Email on invoice paid** | Settings > Business Rules > Notifications tab | Email on Invoice Paid |
| **Auto-approve sessions** | Settings > Customize & Automate > Automation tab | Auto-Approve Sessions |
| **Auto-send invoices** | Settings > Customize & Automate > Automation tab | Auto-Send Invoice on Approval + Send Method |
| **Auto-generate scholarship batches** | Settings > Customize & Automate > Automation tab | Auto-Generate Scholarship Invoices + Day of Month |
| **Payment method labels/visibility** | Settings > Customize & Automate > Custom Lists tab | Payment Methods list |
| **Billing method labels/visibility** | Settings > Customize & Automate > Custom Lists tab | Billing Methods list |
| **Client portal toggle** | Settings > Business Rules > Features tab | Client Portal |
| **Portal link expiry** | Settings > Business Rules > Sessions tab | Portal Link Expiry (days) |
