# 🌸 PEAR™ Elite Model Management Platform

Ultra-premium internal operating system for luxury modeling agencies.

## Tech Stack

- **React** (Vite)
- **TailwindCSS** v4 (custom design system)
- **Framer Motion** (animations)
- **Supabase** (auth, database, storage)
- **React Router DOM** (routing)
- **Zustand** (state + localStorage persistence)

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Supabase Setup

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Copy `.env.example` to `.env` and add your credentials:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Run `supabase/schema.sql` in **SQL Editor**
4. **Authentication** → Providers → **Email** → Enable
5. **Authentication** → Providers → Email → **Confirm email** → OFF
6. Restart: `npm run dev`

Without Supabase config, the app runs in **demo mode** using localStorage.

## Demo Accounts (local mode only)

| Role  | Email              | Password        |
|-------|--------------------|-----------------|
| Admin | admin@pear.elite   | PearElite2024!  |

## Routes

| Path              | Description        |
|-------------------|--------------------|
| `/login`          | Sign in            |
| `/dashboard`      | Main dashboard     |
| `/models/:id`     | Model profile      |
| `/admin`          | Admin panel        |
| `/leaderboard`    | Points ranking     |
| `/announcements`  | Company feed       |
| `/chat`           | Team chat          |

## Deploy

```bash
npm run build
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables on your host.
