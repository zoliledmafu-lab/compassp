# Changelog

All notable changes to Compass are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Version scheme: `MAJOR.MINOR.PATCH` (MAJOR = breaking, MINOR = feature, PATCH = fix/security).

---

## [1.2.0] — 2026-07-14

### Added
- **Child safety guardrails** — mandatory 5-rule block injected into every AI system prompt (Zimbabwe Children's Amendment Act 2023 compliance)
- **Three-layer content safety** — input filter (`isSafeInput`), system prompt rules, and output screener (`isResponseSafe`) in `claudeApi.ts`
- **JWT validation on voice-companion Edge Function** — unauthenticated callers now receive 401 before any processing
- **Role guards on all admin pages** — `RulesPage`, `StudentsPage`, and `AnalyticsPage` redirect non-admins to `/dashboard`
- **Demo password env-var indirection** — `VITE_DEMO_ADMIN_PASSWORD` / `VITE_DEMO_STUDENT_PASSWORD` replace hard-coded literals in `LoginPage.tsx` and `AuthContext.tsx`
- **Unit tests for offline AI** — `src/tests/offlineAI.test.ts` covering `detectLanguage` and `isOfflineReady`
- **Full project README** — replaced Vite template stub with problem statement, architecture diagram, setup instructions, AI usage declaration, and known limitations
- **Docs folder** — `ARCHITECTURE.md`, `DEPLOYMENT.md`, `USER_GUIDE.md`, `CHILD_SAFETY.md`, `SECURITY_CONTROLS.md`, `AI_MODELS.md`
- **Data folder** — `SOURCES.md`, `DATABASE_SCHEMA.md`, `sample_training_data.json`
- **LICENSE** (MIT), `CHANGELOG.md`, `KNOWN_LIMITATIONS.md` at repo root

### Changed
- `CANVAS_GUIDE_KEY` renamed to `compass_canvas_tour_v2` to reset tours after UX changes
- `AppLayout` sidebar is now hidden below `md` breakpoint; mobile bottom nav padding added

### Security
- Prototype header `anthropic-dangerous-direct-browser-access: 'true'` commented to clarify prototype-only intent; must be removed before production

---

## [1.1.0] — 2026-06-28

### Added
- **Canvas Guided Onboarding** — 6-step `CanvasTour` driven by Intro.js on first visit
- **Compass Onboarding** — first-login welcome flow (`OnboardingPage`) stored in `sessionStorage`
- **Widget icon library** — `src/widgets/icons.tsx` with 27 Lucide icon mappings
- **27 widget types** on Study Canvas with drag-and-drop, resize, and persistent Supabase sync
- **Offline mode** — SmolLM2-360M via Transformers.js for zero-connectivity tutoring
- **Voice companion** — Supabase Edge Function wrapping ElevenLabs TTS
- **Multilingual support** — English, Shona, Ndebele with `LanguageContext` and `useLanguage` hook
- **ZIMSEC + Cambridge curriculum selector** — subject/level picker at session start
- **Four-level Socratic scaffolding** — `ruleEngine.ts` guides AI responses from hint → worked example

### Changed
- `AuthContext` now supports both Supabase (live) and demo-mode local storage paths
- `SUPABASE_ENABLED` flag gates all database calls for demo deployments

---

## [1.0.0] — 2026-05-15

### Added
- Initial release: React 19 + TypeScript + Vite SPA
- Supabase PostgreSQL backend with Row Level Security on all 6 tables
- Google OAuth + email/password authentication
- Student dashboard, admin analytics, rules management
- Claude Sonnet 4.6 as primary tutor; Claude Haiku 4.5 for analytics
- Vercel deployment pipeline
