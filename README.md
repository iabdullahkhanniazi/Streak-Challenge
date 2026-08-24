# Streak Master

A daily habit and streak tracker built on the "don't break the chain" principle: you define the habits you must do every day, and a day only counts if **every** active habit is done. Miss one, and the streak resets to zero.

**Live app:** https://streak-challenge.lovable.app

---

## Table of contents

- [What it does](#what-it-does)
- [How streaks are calculated](#how-streaks-are-calculated)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Database setup](#database-setup)
- [Project structure](#project-structure)
- [Available scripts](#available-scripts)
- [Security model](#security-model)
- [Not yet implemented](#not-yet-implemented)
- [Working with Lovable](#working-with-lovable)

---

## What it does

### Habits

Create habits you commit to daily. Two types are supported:

| Type | Behaviour | Example |
| --- | --- | --- |
| **Checkbox** | Done or not done | "Read Quran", "No social media" |
| **Numeric** | Track progress toward a target, with a unit | "Pushups — 75/100", "Water — 2/3 L" |

Each habit has a title, optional description, daily target, unit, and an active/paused flag. Pausing a habit removes it from the daily requirement without deleting its history.

### Dashboard

The landing screen after login shows current streak, longest streak, completed days, active habit count, success rate, today's completion ring, a rotating motivational quote, and today's habit list for one-tap logging.

### Calendar

A month grid colour-coded by day:

- **Green** — every required habit completed
- **Yellow** — partial: at least one done, but not all
- **Red** — broken: a past day where none of the required habits were done
- **Gray** — no habits were active that day, or the date is in the future

Any day up to and including today is editable, so a forgotten log can be backfilled. Future days stay read-only.

### Statistics and gamification

The stats page charts consistency over time (Recharts area chart) alongside success rate and totals. XP is earned as `completed_tasks × 10 + fully_completed_days × 25`, feeding a five-tier level ladder — **Beginner → Disciplined → Warrior → Elite → Legend** — and streak badges at 1, 7, 30, 100, and 365 days.

### Accounts

Email and password sign-up and sign-in, Google OAuth, and password reset by email. A database trigger provisions a profile, a default `user` role, and a streak row the moment an account is created. Every user sees only their own data.

### Other

Dark and light theme toggle, mobile-first responsive layout, and opt-in browser reminder notifications from the profile page.

---

## How streaks are calculated

Streak logic lives in [src/lib/streaks.ts](src/lib/streaks.ts) and is computed on the client from raw habits and completions rather than stored as a running counter. That means a backfilled or corrected log immediately produces the right numbers, with no repair job needed.

**A day's status** is derived from its *required* habits — active habits that already existed on that date. A habit created today does not retroactively break yesterday.

- `complete` — every required habit done
- `partial` — at least one done, but not all
- `missed` — a past day with required habits and nothing done
- `empty` — no habits were required that day; **skipped entirely**, it neither extends nor breaks a streak
- `future` — after today

**Current streak** counts backward from today. Today not yet being complete does not break the streak — the count simply starts from yesterday, so a streak is only lost once the day has actually passed.

**Longest streak** is the longest run of consecutive `complete` days since your first habit was created.

**Success rate** is complete days ÷ tracked days, where tracked days exclude `empty` ones.

Per-habit streaks are also tracked independently, so you can see which single habit you have kept longest. A paused habit's live streak reads as broken, since today counts as a miss for it.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | TanStack Start (SSR) on React 19 |
| Routing | TanStack Router, file-based |
| Data fetching | TanStack Query |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui on Radix primitives |
| Charts | Recharts |
| Validation | Zod + React Hook Form |
| Backend | Supabase (Postgres, Auth, Row Level Security) |
| Build | Vite 8 |
| Deploy target | Cloudflare (Nitro / Wrangler) |
| Language | TypeScript |

---

## Getting started

**Prerequisites:** Node.js 20+ and npm (or Bun), plus a Supabase project.

```sh
git clone <this-repository-url>
cd streak-challenge
npm install

cp .env.example .env
# fill in your Supabase values — see below

npm run dev
```

The dev server prints its local URL in the terminal once it boots.

---

## Environment variables

Copy [.env.example](.env.example) to `.env` and fill it in. `.env` is gitignored and must never be committed.

| Variable | Where used | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Browser | Your project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser | `sb_publishable_…` — safe to expose |
| `VITE_SUPABASE_PROJECT_ID` | Browser | Project reference id |
| `SUPABASE_URL` | Server (SSR) | Same URL |
| `SUPABASE_PUBLISHABLE_KEY` | Server (SSR) | Same publishable key |
| `SUPABASE_PROJECT_ID` | Server (SSR) | Same project id |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | **Secret.** Bypasses RLS — set it in your host's env settings, never in a committed file |

The `VITE_`-prefixed values are inlined into the browser bundle at build time. That is expected: the publishable key is designed for public use, and Row Level Security is what actually protects the data.

---

## Database setup

The schema is a single migration in [supabase/migrations/](supabase/migrations/). Apply it with the Supabase CLI:

```sh
supabase link --project-ref <your-project-ref>
supabase db push
```

**Tables**

| Table | Purpose |
| --- | --- |
| `profiles` | Display name and XP, keyed to `auth.users` |
| `user_roles` | `admin` / `user` enum, checked via the `has_role()` security-definer function |
| `tasks` | Habit definitions — title, target, type, unit, active flag |
| `task_completions` | One row per habit per day, unique on `(task_id, date)` |
| `streaks` | Cached current streak, longest streak, and last completed date |

Roles are deliberately kept in a separate table rather than on `profiles`, so a user cannot escalate their own privileges by updating their own profile row.

---

## Project structure

```
src/
├── routes/                    # File-based routes
│   ├── index.tsx              # Public landing page
│   ├── auth.tsx               # Sign in / sign up / forgot password
│   ├── reset-password.tsx     # Password reset callback
│   └── _authenticated/        # Auth-guarded layout
│       ├── dashboard.tsx      # Streaks, today's habits, calendar
│       ├── tasks.tsx          # Habit CRUD
│       ├── stats.tsx          # Charts, achievements, levels
│       └── profile.tsx        # Display name, level, reminders
├── components/
│   ├── app/                   # StreakCalendar, ProgressRing, TaskCard, …
│   └── ui/                    # shadcn/ui primitives
├── hooks/
│   ├── useAuth.tsx            # Session state
│   └── useTracker.ts          # Habits + completions queries and mutations
├── lib/
│   └── streaks.ts             # All streak / XP / badge logic (pure functions)
└── integrations/supabase/     # Client, server client, auth middleware, types
```

`src/lib/streaks.ts` is intentionally free of React and network calls — it is pure input-to-output, which keeps the rules easy to reason about and to test.

---

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | ESLint over the project |
| `npm run format` | Format with Prettier |

Dependency installs go through Bun's `minimumReleaseAge` guard (see [bunfig.toml](bunfig.toml)), which skips package versions published in the last 24 hours as a supply-chain precaution.

---

## Security model

- **Row Level Security is enabled on every table**, with policies scoped to `auth.uid()`. A user can only read and write their own habits, completions, streaks, and profile.
- **Privileges are granted narrowly** — `authenticated` gets only the specific verbs each table needs, never blanket `all`.
- **Role checks run through `has_role()`**, a `security definer` function with a pinned `search_path`, and it is revoked from `public` and `anon`.
- **The service role key is server-only** and never appears in client code or in any committed file.
- **`.env` is gitignored.** Only `.env.example`, with placeholders, is tracked.

---

## Not yet implemented

Kept honest so nobody goes looking for these:

- Admin panel UI — the `admin` role and its policies exist in the database, but no admin screens are built
- PWA / offline support and service worker
- Scheduled push reminders (the profile toggle uses the browser Notification API in-session only)
- Friend groups, leaderboards, and streak sharing
- Weekly report emails, PDF export, and backup/restore

---

## Working with Lovable

This project was built with [Lovable](https://lovable.dev) and stays in sync with it.

Continue in the [Lovable editor](https://lovable.dev/projects/b1743384-3aa7-490c-b921-75bf9dfa721a). Changes made there are committed straight to this repository, and commits you push to `main` sync back into Lovable.

> **Note:** avoid rewriting published git history — force pushing, or rebasing, amending, or squashing already-pushed commits — as this rewrites history on Lovable's side and can lose project history.
