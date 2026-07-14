# Compass — Security Controls

## Authentication

| Control | Implementation |
|---------|---------------|
| Auth provider | Supabase Auth (JWT-based) |
| Password authentication | `supabase.auth.signInWithPassword()` — password never touches application code |
| Google OAuth | Supabase OAuth flow; redirect URL validated by Supabase |
| Session persistence | `localStorage` (Remember me) or `sessionStorage` (session only) |
| Demo mode | Isolated to hardcoded non-Supabase code path; demo users have `id` prefix `user-` to distinguish from real Supabase UUIDs |
| Token storage | JWT stored by Supabase client library in browser storage; not accessible via `document.cookie` |

---

## Role-Based Access Control

| Route | Guard | Enforced by |
|-------|-------|------------|
| `/admin/rules` | `user.role === 'admin'` | `RulesPage.tsx` render guard → `<Navigate to="/dashboard" />` |
| `/admin/students` | `user.role === 'admin'` | `StudentsPage.tsx` render guard |
| `/admin/analytics` | `user.role === 'admin'` | `AnalyticsPage.tsx` render guard |
| All student routes | `user` present | `AuthContext` + React Router loader |

Role is stored in the `profiles.role` column in Supabase and fetched on every login. The JWT itself does not carry the role — it is always fetched from the database and re-validated on each page load.

---

## Database Security (Supabase RLS)

Row Level Security is enabled on all 6 tables. Summary of policies:

| Table | Read policy | Write policy |
|-------|------------|-------------|
| `profiles` | Own row + same-school admin | Own row only |
| `student_memory` | Own row | Own row only |
| `rules` | Same school (`school_name` match) | Admin of same school |
| `chat_sessions` | Own row | Own row only |
| `canvas_states` | Own row | Own row only |
| `voice_sessions` | Own row | Own row only |

All policies use `auth.uid()` to match `user_id`. Cross-school data access requires the requesting user's `school_name` to match the row's `school_name` (for rules and analytics).

**Note:** RLS policies are implemented but have not been independently audited. See [KNOWN_LIMITATIONS.md](../KNOWN_LIMITATIONS.md#6-rls-policies-not-independently-audited).

---

## Edge Function Security

**Function:** `supabase/functions/voice-companion/index.ts`

| Control | Implementation |
|---------|---------------|
| Authentication | JWT validated using anon Supabase client (`anonClient.auth.getUser()`) before any processing |
| Secret isolation | `ELEVENLABS_API_KEY` and `ANTHROPIC_API_KEY` are Supabase secrets, never exposed to the browser |
| CORS | `Access-Control-Allow-Origin` restricted to the Vercel deployment origin in production (wildcard in prototype) |
| Error handling | Auth failures return `401` with a generic error message; no stack traces or key material in error responses |

The function uses the **anon key** (not SERVICE_ROLE_KEY) to validate tokens. This means the JWT validation itself respects RLS — an invalid or expired token cannot call any Supabase APIs.

---

## API Key Management

| Key | Location | Exposure |
|-----|----------|----------|
| `VITE_SUPABASE_ANON_KEY` | Vercel env var (public) | Intentionally public — enforced by RLS |
| `VITE_ANTHROPIC_API_KEY` | Vercel env var (public) | ⚠️ Exposed in browser bundle — prototype only |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase runtime only | Never in browser |
| `ELEVENLABS_API_KEY` | Supabase secret | Never in browser |
| `ANTHROPIC_API_KEY` (Edge) | Supabase secret | Never in browser |

**Production requirement:** Move all `VITE_ANTHROPIC_API_KEY` usage to Edge Functions or a dedicated backend. The `anthropic-dangerous-direct-browser-access` header is a temporary prototype measure.

---

## Demo Mode Isolation

When `VITE_SUPABASE_URL` is not set, the application runs in demo mode:
- All Supabase calls are bypassed (`SUPABASE_ENABLED = false`).
- Demo users are seeded in memory with `id` values starting with `user-`.
- Demo data is stored in `localStorage`, not in the Supabase database.
- Demo credentials are configurable via `VITE_DEMO_ADMIN_PASSWORD` / `VITE_DEMO_STUDENT_PASSWORD` env vars; defaults are `admin123` / `student123`.

Demo mode ensures the application works for evaluators without requiring a live Supabase project, while keeping demo data completely isolated from production data.

---

## Content Safety

Three-layer content safety system protects students from harmful AI outputs.  
Full description: [CHILD_SAFETY.md](CHILD_SAFETY.md).

---

## Dependency Security

All npm dependencies are pinned to exact versions (no `^` or `~`) in `package.json`. Run `npm audit` to check for known CVEs. As of the v1.2.0 release, `npm audit` reports 0 high or critical vulnerabilities.
