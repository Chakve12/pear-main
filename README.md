# 🌸 PEAR™ Elite Model Management Platform

Ultra-premium internal operating system for luxury modeling agencies.

## Tech Stack

- **React** (Vite)
- **TailwindCSS** v4 (custom design system)
- **Framer Motion** (animations)
- **Firebase Auth** (authentication)
- **Firebase Storage** (images)
- **React Router DOM** (routing)
- **Zustand** (state + localStorage persistence)

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Demo Accounts

| Role  | Email              | Password |
|-------|--------------------|----------|
| Admin | admin@pear.elite   | pear2024 |
| Model | mariami@pear.elite | pear2024 |
| Model | ninuci@pear.elite  | pear2024 |
| Model | liza@pear.elite    | pear2024 |

## Firebase Setup

1. Copy `.env.example` to `.env`
2. Add your Firebase project credentials
3. Enable **Email/Password** auth in Firebase Console
4. Create a **Storage** bucket with appropriate rules

Without Firebase config, the app runs in **demo mode** using localStorage.

## Routes

| Path              | Description        |
|-------------------|--------------------|
| `/login`          | Sign in            |
| `/signup`         | Create account     |
| `/dashboard`      | Main dashboard     |
| `/models/:id`     | Model profile      |
| `/admin`          | Admin panel        |
| `/leaderboard`    | Points ranking     |
| `/announcements`  | Company feed       |

## Deploy

### Vercel
```bash
npm run build
# vercel.json included for SPA routing
```

### Netlify
```bash
npm run build
# public/_redirects included for SPA routing
```

## Models

- **მარიამი "ფერია"** — `/models/mariami`
- **ნინუცი** — `/models/ninuci`
- **ლიზა** — `/models/liza`
"# pear" 
