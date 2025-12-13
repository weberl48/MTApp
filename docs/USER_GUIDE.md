# May Creative Arts - Practice Management Guide

Welcome to the May Creative Arts practice management system. This guide will help you navigate the platform and manage your music therapy practice effectively.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Managing Sessions](#managing-sessions)
4. [Managing Clients](#managing-clients)
5. [Invoicing & Payments](#invoicing--payments)
6. [Contractor Payroll](#contractor-payroll)
7. [Team Management](#team-management)
8. [Settings & Configuration](#settings--configuration)
9. [Client Portal](#client-portal)
10. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

### Logging In
1. Navigate to the app URL
2. Enter your email and password
3. If you have two-factor authentication enabled, enter your verification code

### User Roles
- **Owner**: Full access to all features including organization settings and branding
- **Admin**: Can manage sessions, invoices, clients, and team members
- **Contractor**: Can log their own sessions and view their payment history

---

## Dashboard Overview

The dashboard is your home base, showing key metrics at a glance:

- **Sessions This Month**: Total sessions logged in the current month
- **Total Clients**: Active clients in your practice
- **Pending Invoices** (Admin/Owner): Invoices awaiting review or payment
- **Pending Payments** (Admin/Owner): Total amount awaiting collection

### Session Requests
If clients have portal access, their session requests appear here. You can approve or decline requests directly from the dashboard.

---

## Managing Sessions

### Logging a New Session

1. Click **Sessions** in the sidebar
2. Click **New Session**
3. Fill in the session details:
   - **Date & Time**: When the session occurred
   - **Duration**: Length of the session (30, 45, 60, or 90 minutes)
   - **Service Type**: Select the appropriate service (affects pricing)
   - **Clients**: Add one or more clients who attended

### Pricing Preview
As you fill in the form, you'll see a real-time pricing breakdown:
- Total amount
- Per-person cost (for group sessions)
- MCA commission
- Contractor pay
- Rent (if applicable)

### Duplicate Detection
The system will warn you if you're about to create a session that might be a duplicate (same client, same date, same service type). You can still proceed if needed.

### Recurring Sessions
For weekly sessions, enable **Repeat Weekly** and choose:
- Number of weeks (4, 6, 8, 10, or 12)
- Or a specific end date

This creates multiple sessions at once.

### Session Status
- **Draft**: Saved but not submitted for billing
- **Submitted**: Ready for invoice generation
- **Approved**: Verified by admin
- **Cancelled/No-Show**: Session didn't occur

---

## Managing Clients

### Adding a New Client

1. Click **Clients** in the sidebar
2. Click **Add Client**
3. Enter client information:
   - Name (required)
   - Email and phone
   - Address
   - Payment method
   - Notes

### Payment Methods
- **Private Pay**: Direct payment (cash, check, card)
- **Self-Directed**: Reimbursement programs (note: often slower to pay)
- **Group Home**: Billed to group home facility
- **Scholarship**: Covered by scholarship fund

### Client Portal Access
You can give clients access to a portal where they can:
- View upcoming and past sessions
- Request new sessions
- Access shared resources
- Track their goals

To enable portal access:
1. Go to the client's detail page
2. Find the **Portal Access** section
3. Click **Generate Access Link** or **Send Portal Invite**

---

## Invoicing & Payments

### Invoice Workflow

1. **Contractor logs session** → Invoice created automatically (status: Pending)
2. **Admin reviews** → Can send via Square or email
3. **Client pays** → Invoice marked as paid (manually or via Square webhook)

### Invoice Page Features

#### Status Tabs
- **Overdue**: Past due date (red highlight)
- **Pending**: Awaiting review/sending
- **Sent**: Sent to client, awaiting payment
- **Paid**: Payment received
- **All**: View everything

#### Payment Method Tabs
- **Self-Directed**: Filter to see all unpaid self-directed invoices (useful for follow-up)
- **Group Home**: Filter to see all unpaid group home invoices

### Bulk Actions
Select multiple invoices using checkboxes, then:
- **Export CSV**: Download for your records or accounting
- **Mark Sent**: Batch update status when sending invoices outside the system
- **Mark Paid**: Batch mark as paid when receiving payments

### Sending Invoices

**Via Square:**
1. Click the invoice actions menu (three dots)
2. Select **Send via Square**
3. Client receives professional invoice with payment link

**Via Email:**
1. Click the invoice actions menu
2. Select **Send via Email**
3. Client receives email with PDF attachment

---

## Contractor Payroll

Navigate to **Payments** in the sidebar.

### Payroll Hub Tab
Shows all unpaid contractor sessions grouped by contractor.

#### Date Range Filter
- **All**: Show all unpaid sessions
- **Range**: Filter by specific date range (useful for bi-weekly or monthly payroll)

#### Processing Payroll
1. Click **Mark Paid** next to a contractor
2. Confirm the sessions and amount
3. Set the payment date
4. Click **Confirm Payment**

This marks all their sessions as paid and records the payout date.

#### Export
Click **Export to Excel** to download:
- Summary sheet: Contractor names, session counts, amounts
- Detail sheet: Individual session breakdown

### Payment History Tab
View all-time payment history per contractor:
- Total earned
- Total paid out
- Pending balance

### Invoice Reconciliation Tab
Track Square payment integration status and match payments to invoices.

---

## Team Management

Navigate to **Team** in the sidebar.

### Inviting Team Members

1. Go to **Settings** > **Team** tab
2. Click **Generate Invite Link**
3. Copy the link and send to the new team member
4. They'll create an account linked to your organization

### Viewing Team Performance
The Team page shows:
- Each team member's session count
- Pending payment amounts
- Role badges

---

## Settings & Configuration

Navigate to **Settings** in the sidebar.

### Profile
Update your name and phone number.

### Security
- Set up two-factor authentication (recommended)
- Configure session timeout
- Set login attempt limits

### Organization (Owner only)
- Practice name
- Contact information
- Address

### Branding (Owner only)
- Upload your logo
- Set brand colors
- Add your tagline
- Social media links

### Services (Admin+)
Manage service types and pricing:
- Base rate
- Per-person rate (for groups)
- MCA commission percentage
- Contractor cap (if applicable)
- Rent percentage

### Invoices (Admin+)
- Default due days
- Footer text
- Payment instructions

### Sessions (Admin+)
- Default duration
- Notes requirements
- Reminder settings

### Notifications (Admin+)
- Email alerts for session submissions
- Payment notifications

---

## Client Portal

### What Clients See
When clients access their portal, they can view:
- **Home**: Welcome message and overview
- **Sessions**: Past and upcoming appointments
- **Resources**: Homework, files, and links you've shared
- **Goals**: Treatment goals and progress

### Session Requests
Clients can request new sessions by specifying:
- Preferred date and time
- Alternative date (optional)
- Desired duration
- Notes

You'll see these requests on your dashboard and can approve/decline them.

### Sharing Resources
From a client's detail page, you can share:
- **Homework**: Assignments with due dates
- **Files**: Documents, audio, video (up to 10MB)
- **Links**: External resources

---

## Tips & Best Practices

### Daily Tasks
1. Check the dashboard for session requests
2. Review any overdue invoices
3. Process new session submissions

### Weekly Tasks
1. Send unpaid invoice reminders
2. Review Self-Directed invoice tab for follow-ups
3. Check contractor payment status

### Monthly Tasks
1. Run payroll (use date range filter)
2. Export reports for accounting
3. Review analytics for trends

### Avoiding Duplicate Billing
- The system warns you about potential duplicate sessions
- Always check the warning before proceeding
- Use the link to view existing sessions

### Efficient Invoice Processing
- Use bulk actions to process multiple invoices at once
- Filter by payment method to focus on specific categories
- Export CSV for your accounting software

### Keeping Track of Slow Payers
- Self-Directed clients often have longer payment cycles
- Use the Self-Directed tab to monitor these invoices
- Set calendar reminders for follow-ups

---

## Need Help?

If you encounter issues or have questions:
1. Check this guide first
2. Contact your system administrator
3. Report bugs at the support channel

---

*Last updated: December 2024*
