import type { HelpArticle } from '../types'

export const ANALYTICS_ARTICLES: HelpArticle[] = [
  {
    slug: 'analytics-and-reports',
    title: 'Analytics and Reports',
    category: 'analytics',
    description: 'How to use the Analytics section to review revenue, sessions, and payment status.',
    adminOnly: true,
    relatedArticles: ['payroll-and-payments'],
    keywords: ['revenue', 'charts', 'date range', 'summary cards', 'invoice status'],
    content: `
## Analytics and Reports

The Analytics section gives owners and developers a financial and operational overview of the practice. It is not visible to contractors or standard admins.

### Where to Find It

Click **Analytics** in the sidebar. This item is visible only to owner and developer roles.

### Date Ranges

Use the date range selector at the top of the page to change the reporting period. Available options are:

- **3 Months** - The last three full months.
- **6 Months** - The last six full months.
- **12 Months** - The last twelve full months.
- **YTD** - The current calendar year to date.

### Summary Cards

At the top of the Analytics page, four summary cards give you a quick snapshot:

- **Total Revenue** - All amounts billed to clients in the selected period.
- **MCA Earnings** - The organization's share of revenue after contractor pay and rent.
- **Total Sessions** - The number of sessions in the period.
- **Active Clients** - The total number of clients on your roster.

### Charts

- **Revenue Overview** - A monthly revenue chart. Useful for spotting seasonal patterns.
- **Sessions by Type** - A bar chart breaking sessions down into Individual vs. Group per month.
- **Invoice Status** - A donut chart showing the proportion of invoices that are pending, sent, or paid.

### Payment Summary

Next to the invoice status chart, the Payment Summary card totals what has been **Collected**, what is **Awaiting Payment**, what is still **Pending Review**, and the overall **Total Outstanding**.
    `,
  },
  {
    slug: 'payroll-and-payments',
    title: 'Payroll and Payments',
    category: 'analytics',
    description: 'How to track contractor pay, record payments, and reconcile Square invoices.',
    adminOnly: true,
    relatedArticles: ['analytics-and-reports', 'managing-contractor-rates', 'tax-summaries'],
    keywords: ['payroll hub', 'mark paid', 'unpaid sessions', 'payment history', 'square reconciliation', 'tax summaries'],
    content: `
## Payroll and Payments

The Payroll section is where you track what you owe contractors and record when they have been paid. It is available to owners and developers only.

### Where to Find It

Click **Billing > Payroll** in the sidebar.

### Payroll Hub Tab

The Payroll Hub lists all contractors with unpaid work — sessions that are submitted, approved, or marked no-show but not yet paid out. For each contractor, you can see:

- The number of unpaid sessions and total amount pending.
- An expandable breakdown showing each session's service type and date.
- A **Mark Paid** button, which records the payment and removes those sessions from the unpaid queue.

Use this tab at the end of each pay period to process contractor payments.

### Payment History Tab

The Payment History tab shows a summary of all recorded payments per contractor. Each contractor's row can be expanded to see individual payment events with dates and amounts. This gives you a full audit trail of what has been paid and when.

### Invoice Reconciliation Tab

The Invoice Reconciliation tab tracks Square payment activity. It shows Square invoices, their status, and whether the corresponding MCA invoice has been marked as paid. Use this to catch any discrepancies between what Square has collected and what is recorded in MCA Manager.

### Connecting to Analytics

For a broader view of revenue and earnings trends, see the Analytics page. Payroll focuses on operational payment tracking, while Analytics focuses on financial reporting and charts.

### Tax Summaries

The **Tax Summaries** tab shows cash-basis annual totals per contractor — everything paid out during a calendar year, grouped by the date the payment was recorded (not the session date). This matches how 1099-NEC amounts are reported.

- Pick a tax year from the dropdown to see each contractor's paid session count and total.
- **Summary CSV** downloads one row per contractor — hand this to your bookkeeper for 1099 preparation.
- **Detail CSV** downloads one row per paid session (paid date, session date, service type, duration, amount) for your records.
- Contractors can download their own annual summary PDF from **My Earnings** — you don't need to send them anything manually.

These exports are informal records to support tax preparation — they are not official tax documents.
    `,
  },
  {
    slug: 'my-earnings',
    title: 'My Earnings',
    category: 'analytics',
    description: 'How to track your earnings, view payment history, and understand your pay breakdown.',
    relatedArticles: ['logging-a-session', 'payroll-and-payments', 'tax-summaries'],
    keywords: ['pay stub', 'paycheck', 'earnings', 'pay', 'ytd', 'annual summary'],
    content: `
## My Earnings

The Earnings page is your personal financial dashboard as a contractor. It shows what you have earned, what has been paid, and what is still pending.

### Where to Find It

Click **Earnings** in the sidebar. This page is visible only to contractors (and to owners using View As mode).

### Summary Cards

At the top of the page, four cards give you a quick snapshot:

- **YTD Earnings** - Your total earnings since January 1st of the current year, with a count of how many sessions that covers.
- **Paid Out** - How much has actually been paid to you so far.
- **Pending** - Earnings from approved sessions that have not been paid yet.
- **This Month** - Your earnings for the current calendar month.

### Monthly Chart

A bar chart shows your earnings over the last six months, making it easy to see trends in your workload.

### Monthly Breakdown

Below the chart, each month is listed with the total number of sessions and your earnings for that period. This gives you a detailed, month-by-month record of your pay.

### How Pay Is Calculated

Your earnings are calculated from the service type pricing, your custom pay rate (if one has been set), and the session duration. If you have questions about how a specific amount was calculated, ask your admin to check the pricing breakdown on the session detail page.

### Annual Summary

The **Annual Summary** card shows your total payments received per calendar year — useful at tax time. Pick a year and download a PDF summary of what you were paid, broken down by month and service type.

The summary is cash-basis: a session counts toward the year its payment was recorded, not the year the session happened. It's an informal record, not an official tax document (not a 1099) — your 1099, if applicable, comes from the practice owner.
    `,
  },
  {
    slug: 'exporting-data',
    title: 'Exporting Data',
    category: 'analytics',
    description: 'How to export sessions and invoices as CSV files for your records.',
    adminOnly: true,
    relatedArticles: ['analytics-and-reports', 'payroll-and-payments'],
    keywords: ['csv export', 'download sessions', 'download invoices', 'accounting', 'spreadsheet'],
    content: `
## Exporting Data

MCA Manager lets you export session and invoice data as CSV files for use in spreadsheets, accounting software, or your own records.

### Exporting Invoices

1. Go to **Invoices** in the sidebar.
2. Use the checkboxes to select the invoices you want to export.
3. A blue action bar appears at the top showing the count and total amount.
4. Click **Export CSV**.

The downloaded file includes columns for client name, service type, date, payment method, amount, and status.

### Exporting Sessions

1. Go to the **Sessions** page.
2. Click the **Export Sessions** button.
3. In the dialog, optionally pick a client and a start/end date range.
4. Click **Export CSV** to download the file.

Admins see all clients in the picker and export all matching sessions; contractors only see clients they've had sessions with and only export their own sessions. A dedicated API endpoint (\`/api/sessions/export\`) powers the download behind the scenes.

The CSV includes date, time, duration, status, service type, contractor, clients, group headcount, and session notes (automatically decrypted).

### Tips

- Use invoice export at the end of each month to reconcile with your accounting records.
- Filter by date range or client before exporting to narrow down the data you need.
    `,
  },
  {
    slug: 'tax-summaries',
    title: 'Tax Summaries: Cash-Basis Contractor Totals',
    category: 'analytics',
    description: 'How annual contractor tax summaries work, the cash-basis rule behind them, and how to download the PDF and CSV exports.',
    adminOnly: false,
    relatedArticles: ['payroll-and-payments', 'my-earnings', 'exporting-data'],
    keywords: ['taxes', '1099', 'tax year', 'annual summary', 'csv', 'cash basis'],
    content: `
## Tax Summaries: Cash-Basis Contractor Totals

Tax Summaries give contractors and owners a year-by-year record of contractor pay, built on the same cash-basis rule accountants use for 1099-NEC reporting.

### The Cash-Basis Rule

A paid session counts toward a tax year based on **when the contractor was paid**, not when the session happened. If a session took place on December 28th but the contractor wasn't marked paid until January 3rd, it counts toward the following year's total — not the year the session occurred.

Concretely, a session is included in tax year Y if its payment date falls between January 1 and December 31 of that year. Sessions that have never been marked paid don't appear in any tax year.

Amounts use the exact dollar figure recorded at the time of payment (the snapshot taken when a contractor's sessions were marked paid), so later changes to a service type's pricing never retroactively change a past year's totals.

### Two Views

- **Owners and developers**: **Payments > Payroll Hub > Tax Summaries** tab shows every contractor's paid session count and total for a selected year, with **Summary CSV** (one row per contractor) and **Detail CSV** (one row per paid session, including paid date, session date, service type, duration, and amount) downloads. Hand the Summary CSV to your bookkeeper for 1099 preparation.
- **Contractors**: the **Annual Summary** card on the **My Earnings** page lets you pick a year and download your own annual summary as a PDF, broken down by month and service type. You don't need to ask an owner for this — it's self-service.

Owners can also download any contractor's annual summary PDF (not just their own) from the Payroll section by specifying the contractor.

### What's Included (and What Isn't)

These exports are built for tax preparation, so they intentionally include zero PHI: no client names, no session notes, and no medical or identifying information. You'll only see dates, service type, duration, and dollar amounts.

They are informal records to support tax preparation, not official tax documents — they are not a substitute for a 1099-NEC. If your practice issues 1099s, that's still a separate step your bookkeeper or accountant handles using these totals as source data.

### Why It Might Look Empty

If a contractor has approved or submitted sessions but no tax summary activity shows up for the current year, check whether those sessions have actually been marked paid yet. Sessions sitting in "approved" or "submitted" status haven't been paid, so they won't appear in any tax year until an owner processes payment through the Payroll Hub.

### Where to Find It

- Owners/developers: **Payments > Payroll Hub > Tax Summaries** tab.
- Contractors: **Earnings > Annual Summary** card.
    `,
  },
]
