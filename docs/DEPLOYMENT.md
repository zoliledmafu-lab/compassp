# Compass — Deployment Guide

## Hosting Overview

| Layer | Provider | Notes |
|-------|----------|-------|
| Frontend SPA | Vercel | Auto-deploy from `main` branch |
| Database + Auth | Supabase | Hosted PostgreSQL, built-in JWT auth |
| Edge Functions | Supabase (Deno runtime) | `voice-companion` function |
| AI (online) | Anthropic API | Claude Sonnet 4.6 + Haiku 4.5 |
| TTS (voice) | ElevenLabs API | Optional; voice feature degrades gracefully |

Live URL: **https://compassp.vercel.app**

---

## Environment Variables

### Vercel (Frontend)

Set these in **Vercel Dashboard → Project → Settings → Environment Variables**:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...          # Safe to expose — enforced by RLS
VITE_ANTHROPIC_API_KEY=sk-ant-...      # ⚠️ Prototype only — move server-side for production
VITE_ELEVENLABS_API_KEY=...            # Optional — voice feature
VITE_DEMO_ADMIN_PASSWORD=...           # Demo mode only — omit in production
VITE_DEMO_STUDENT_PASSWORD=...         # Demo mode only — omit in production
```

To disable demo mode and enforce real authentication, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` and leave `VITE_DEMO_ADMIN_PASSWORD` / `VITE_DEMO_STUDENT_PASSWORD` unset.

### Supabase Edge Functions

Set these as **Supabase Secrets** (Dashboard → Edge Functions → Manage secrets):

```
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
# SUPABASE_SERVICE_ROLE_KEY is injected automatically by Supabase runtime
```

---

## Vercel Deployment Steps

1. Fork / clone the repository.
2. Connect the repository to a Vercel project.
3. Set all `VITE_*` environment variables in Vercel dashboard.
4. Vercel auto-detects the Vite framework; default build command is `npm run build`, output directory is `dist`.
5. Push to `main` — Vercel deploys automatically.

### Manual Deploy (CLI)

```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## Supabase Setup

### 1. Create Project

Create a new project at [supabase.com](https://supabase.com). Note the `Project URL` and `anon` key from **Settings → API**.

### 2. Apply Database Schema

Run the full schema migration in the Supabase SQL editor:

```bash
# From the repo root
cat supabase/000_full_schema.sql
# Paste content into Supabase SQL editor and run
```

This creates all 6 tables with RLS policies, indexes, and the `handle_new_user` trigger.

### 3. Enable Google OAuth (optional)

1. Supabase Dashboard → Authentication → Providers → Google
2. Add your Google OAuth client ID and secret.
3. Set the redirect URL to `https://compassp.vercel.app/` in your Google Cloud Console.

### 4. Deploy Edge Functions

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy voice-companion
```

Then set secrets:

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set ELEVENLABS_API_KEY=...
```

---

## Local Development

```bash
git clone https://github.com/your-org/compass.git
cd compass
npm install
cp .env.example .env
# Fill in .env with your keys
npm run dev
```

The app runs at `http://localhost:5173`.

### Demo Mode (no keys required)

Leave `VITE_SUPABASE_URL` blank in `.env`. The app switches to demo mode using localStorage and demo credentials:
- Student: `student@compass.edu` / `student123`
- Admin: `admin@compass.edu` / `admin123`

---

## CI / Build Health

```bash
npm run build   # TypeScript compile + Vite bundle
npx tsc --noEmit  # Type-check only
npx vitest run    # Unit tests (requires local node_modules)
```

See `package.json` scripts for full list.
