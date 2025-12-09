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
