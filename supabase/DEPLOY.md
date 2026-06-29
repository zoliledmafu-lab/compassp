# Compass Backend Deployment

## 1 — Run SQL Migrations (Supabase SQL Editor)

Open https://supabase.com/dashboard/project/njetilhbprvvazalcxrs/sql/new
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
supabase link --project-ref njetilhbprvvazalcxrs
supabase functions deploy voice-companion
```

### Option B — Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/njetilhbprvvazalcxrs/functions
2. Click **New function** → name it `voice-companion`
3. Paste the contents of `supabase/functions/voice-companion/index.ts`
4. Click **Deploy**

---

## 3 — Set Edge Function Environment Variables

Go to: https://supabase.com/dashboard/project/njetilhbprvvazalcxrs/functions/voice-companion/details

Add these secrets:

| Variable | Value | Where to get it |
|----------|-------|-----------------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | https://console.anthropic.com/settings/keys |
| `ELEVENLABS_API_KEY` | `...` | https://elevenlabs.io/app/settings/api-keys (optional — enables real voice) |
| `SUPABASE_URL` | `https://njetilhbprvvazalcxrs.supabase.co` | Already set automatically |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Supabase → Settings → API → service_role key |

> **IMPORTANT:** The service role key gives full database access — never put it in frontend code or `.env` files.

---

## 4 — Update the React app `.env`

```
VITE_SUPABASE_URL=https://njetilhbprvvazalcxrs.supabase.co
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

---

## 6 — Enable Google OAuth

### Step A — Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID** → Application type: **Web application**
3. Under **Authorised JavaScript origins**, add:
   - `https://njetilhbprvvazalcxrs.supabase.co`
4. Under **Authorised redirect URIs**, add:
   - `https://njetilhbprvvazalcxrs.supabase.co/auth/v1/callback`
5. Click **Create** — copy the **Client ID** and **Client Secret**

### Step B — Supabase Dashboard

6. Go to: https://supabase.com/dashboard/project/njetilhbprvvazalcxrs/auth/providers
7. Click **Google** → toggle **Enable** → paste **Client ID** and **Client Secret** → **Save**

### Step C — Allow Redirect URLs (critical — missed step)

8. Go to: https://supabase.com/dashboard/project/njetilhbprvvazalcxrs/auth/url-configuration
9. Under **Redirect URLs**, add:
   - `http://localhost:5173/**`  ← for local development
   - Your production URL when you deploy (e.g. `https://compass.vercel.app/**`)
10. Click **Save**

> **The "Continue with Google" button is already wired up.** Once all three steps above are done, Google sign-in works immediately. If it still fails, the error message will now appear on the login page.

---

## 7 — Custom Email Verification (optional)

Supabase sends verification emails by default from `noreply@mail.supabase.io`.
To use your own domain and branding, choose one of:

| Provider | Cost | Steps |
|----------|------|-------|
| **Resend** (recommended) | Free up to 3k/mo | resend.com → API key → Supabase: Auth → SMTP settings |
| **SendGrid** | Free up to 100/day | sendgrid.com → SMTP relay → Supabase SMTP settings |
| **Postmark** | $15/mo starter | postmarkapp.com → SMTP credentials → Supabase SMTP settings |
| **AWS SES** | ~$0.10/1k emails | SES → SMTP credentials → Supabase SMTP settings |

**Supabase SMTP config path:** Supabase dashboard → Authentication → Email → SMTP Settings

---

## 8 — Run Curriculum Array Migration

If you ran the earlier migrations, run this additional one to support multi-curriculum users:

| Order | File | What it does |
|-------|------|-------------|
| 4 | `004_curricula_array.sql` | Adds `curricula text[]` to profiles, updates trigger to read from sign-up metadata |

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
