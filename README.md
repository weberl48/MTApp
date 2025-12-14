# May Creative Arts App

A mobile-first practice management system for May Creative Arts (MCA). This application handles session tracking, invoicing, and contractor payments.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Mobile**: [Capacitor](https://capacitorjs.com/) (Android & iOS)
- **State Management**: React Server Components + React Hook Form

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or pnpm
- Supabase project (or local instance)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd mca-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Copy `.env.example` to `.env.local` and fill in your Supabase credentials:
    ```bash
    cp .env.example .env.local
    ```

4.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the app.

## Database Setup

The database schema is managed via SQL files in the `supabase/` directory.
1.  `supabase/schema.sql`: Contains the table definitions and RLS policies.
2.  `supabase/seed.sql`: Contains initial data (service types).

You can apply these using the Supabase Dashboard or CLI.

## Initial Owner Setup (May Creative Arts)

After deploying the app and setting up the database, follow these steps to set up the owner account:

### Step 1: Create the Organization

Run this SQL in your Supabase SQL Editor:

```sql
-- Create the May Creative Arts organization
INSERT INTO organizations (id, name, slug, settings)
VALUES (
  'org00000-0000-0000-0000-000000000001',
  'May Creative Arts',
  'may-creative-arts',
  '{
    "invoice": {
      "footer_text": "Thank you for choosing May Creative Arts!",
      "due_days": 30,
      "send_reminders": true,
      "reminder_days": [7, 3, 1]
    },
    "session": {
      "default_duration": 30,
      "require_notes": false
    }
  }'::jsonb
);

-- Insert the default service types for this organization
INSERT INTO service_types (organization_id, name, category, base_rate, per_person_rate, mca_percentage, contractor_cap, rent_percentage, location) VALUES
  ('org00000-0000-0000-0000-000000000001', 'In-Home Individual Session', 'in_home_individual', 50.00, 0, 23, NULL, NULL, 'in_home'),
  ('org00000-0000-0000-0000-000000000001', 'In-Home Group Session', 'in_home_group', 50.00, 20.00, 30, 105.00, NULL, 'in_home'),
  ('org00000-0000-0000-0000-000000000001', 'Matt''s Music Individual', 'matts_music_individual', 55.00, 0, 30, NULL, 10, 'matts_music'),
  ('org00000-0000-0000-0000-000000000001', 'Matt''s Music Group', 'matts_music_group', 50.00, 20.00, 30, NULL, NULL, 'matts_music'),
  ('org00000-0000-0000-0000-000000000001', 'Individual Art Lesson', 'art_individual', 40.00, 0, 20, NULL, NULL, 'other'),
  ('org00000-0000-0000-0000-000000000001', 'Group Art Lesson', 'art_group', 40.00, 15.00, 30, NULL, NULL, 'other');
```

### Step 2: Sign Up as Owner

1. Go to the app's login page and click "Sign Up"
2. Create an account with May's email address
3. Verify the email (check inbox for confirmation link)

### Step 3: Promote to Owner Role

After signing up, run this SQL to set the user as owner:

```sql
-- Replace 'may@example.com' with the actual email used to sign up
UPDATE users
SET
  role = 'owner',
  organization_id = 'org00000-0000-0000-0000-000000000001'
WHERE email = 'may@example.com';
```

### Step 4: Verify Setup

1. Log in to the app
2. You should see the Dashboard with access to:
   - Sessions
   - Clients
   - Invoices
   - Team (to add contractors)
   - Payments
   - Analytics
   - Settings

### Adding Contractors

Once logged in as owner:
1. Go to **Team** page
2. Click **Invite User**
3. Enter the contractor's email and select "Contractor" role
4. They'll receive an email invitation to join

### User Roles

| Role | Access |
|------|--------|
| **Owner** | Full organization access, manage team, view all data |
| **Admin** | Same as owner, but cannot delete organization |
| **Contractor** | Log sessions, view own sessions/invoices only |
| **Developer** | Full system access + dev tools (internal use only) |

## Mobile Development (Capacitor)

This project uses Capacitor to wrap the Next.js web app into a native mobile app.

### Android

1.  **Sync config:**
    ```bash
    npx cap sync
    ```
2.  **Open Android Studio:**
    ```bash
    npx cap open android
    ```

### iOS

1.  **Sync config:**
    ```bash
    npx cap sync
    ```
2.  **Open Xcode:**
    ```bash
    npx cap open ios
    ```

## Project Structure

- `src/app`: Next.js App Router pages and layouts.
- `src/components`: Reusable UI components.
- `src/lib`: Utility functions and clients (Supabase, Square, Pricing).
- `src/types`: TypeScript type definitions (Database).
- `supabase`: Database schema and seeds.

## Testing

(Coming soon: Vitest + React Testing Library)
