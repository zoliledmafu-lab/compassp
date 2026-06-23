# Compass Backend Deployment

## 1 — Run SQL Migrations (Supabase SQL Editor)

Open https://supabase.com/dashboard/project/rxpdespqcaiqrlzfnrtw/sql/new
and run each file in order:

| Order | File | What it creates |
|-------|------|-----------------|
| 1 | `001_initial_schema.sql` | profiles, student_memory, rules, chat_sessions, canvas_states |
| 2 | `002_voice_sessions.sql` | voice_sessions, rules columns (voice_enabled, desktop_mode_enabled) |
| 3 | `003_curriculum.sql` | curriculum columns, institutions table, curriculum_content with ZIMSEC + Cambridge seed data |

Paste each file's contents and click **Run**.

---

## 2 — Deploy the Edge Function

### Option A — Supabase CLI (recommended)

```bash
npm install -g supabase
supabase login
supabase link --project-ref rxpdespqcaiqrlzfnrtw
supabase functions deploy voice-companion
```

### Option B — Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/rxpdespqcaiqrlzfnrtw/functions
2. Click **New function** → name it `voice-companion`
3. Paste the contents of `supabase/functions/voice-companion/index.ts`
4. Click **Deploy**

---

## 3 — Set Edge Function Environment Variables

Go to: https://supabase.com/dashboard/project/rxpdespqcaiqrlzfnrtw/functions/voice-companion/details

Add these secrets:

| Variable | Value | Where to get it |
|----------|-------|-----------------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | https://console.anthropic.com/settings/keys |
| `ELEVENLABS_API_KEY` | `...` | https://elevenlabs.io/app/settings/api-keys (optional — enables real voice) |
| `SUPABASE_URL` | `https://rxpdespqcaiqrlzfnrtw.supabase.co` | Already set automatically |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Supabase → Settings → API → service_role key |

> **IMPORTANT:** The service role key gives full database access — never put it in frontend code or `.env` files.

---

## 4 — Update the React app `.env`

```
VITE_SUPABASE_URL=https://rxpdespqcaiqrlzfnrtw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_ANTHROPIC_API_KEY=sk-ant-...   # optional — enables real chat responses
```

---

## 5 — Deploy the Frontend (optional — for production)

```bash
npm run build
# Upload dist/ to Netlify, Vercel, or any static host
```

Or one-click deploy to Vercel:
1. Push the repo to GitHub
2. Import into https://vercel.com/new
3. Add the env vars from step 4
4. Deploy

---

## Curriculum Coverage

| Curriculum | Subjects | Notes |
|-----------|----------|-------|
| South Africa NSC | 14 | CAPS curriculum, matric |
| ZIMSEC O-Level | 16 | Form 3–4, Zimbabwe national |
| ZIMSEC A-Level | 13 | Form 5–6, Zimbabwe advanced |
| Cambridge IGCSE | 18 | Internationally recognised, age 14–16 |
| Cambridge AS & A Level | 16 | University entry, internationally recognised |
| **Total** | **77** | |
