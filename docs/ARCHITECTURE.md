# Compass — Architecture

## Overview

Compass is a single-page application (SPA) built with React 19 + TypeScript, deployed to Vercel. The backend is Supabase (PostgreSQL + Auth + Storage + Edge Functions). AI tutoring is powered by Anthropic Claude models accessed directly from the browser (prototype) and a locally-running SmolLM2 model for offline use.

---

## Layer Diagram

```
┌─────────────────────────────────────────────────────┐
│                   Browser (SPA)                     │
│  React 19 · TypeScript · Vite 8 · Tailwind CSS     │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │Auth Pages│  │Chat/Learn│  │  Study Canvas    │  │
│  │Login     │  │ChatPage  │  │  CanvasPage      │  │
│  │Signup    │  │LearnPage │  │  27 widget types │  │
│  │Onboarding│  │          │  │  ReactFlow       │  │
│  └──────────┘  └──────────┘  └─────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │              Core Libraries                   │  │
│  │  claudeApi.ts   learnApi.ts   offlineAI.ts   │  │
│  │  ruleEngine.ts  supabase.ts   constants.ts   │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────┐  ┌──────────────────────┐ │
│  │   AuthContext        │  │   LanguageContext    │ │
│  │  (user, role, demo) │  │  (en / sn / nd)      │ │
│  └─────────────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────┘
          │                         │
          ▼                         ▼
┌──────────────────┐     ┌──────────────────────────┐
│  Supabase        │     │  Anthropic API            │
│  ─────────────── │     │  ──────────────────────── │
│  PostgreSQL      │     │  claude-sonnet-4-6        │
│  Auth (JWT)      │     │  (chat tutoring)          │
│  Row Level Sec.  │     │                           │
│  6 tables        │     │  claude-haiku-4-5         │
│                  │     │  (analytics summaries)    │
│  Edge Functions  │     └──────────────────────────┘
│  voice-companion │
│  (Deno runtime)  │     ┌──────────────────────────┐
└──────────────────┘     │  ElevenLabs API           │
                         │  (TTS via Edge Function)  │
                         └──────────────────────────┘

                         ┌──────────────────────────┐
                         │  SmolLM2-360M (browser)  │
                         │  Transformers.js (WASM)  │
                         │  Offline tutoring only   │
                         └──────────────────────────┘
```

---

## Key Data Flows

### 1. Authentication
1. User submits email/password (or Google OAuth) on `LoginPage`.
2. `AuthContext.signIn()` calls `supabase.auth.signInWithPassword()`.
3. Supabase returns a JWT; stored in localStorage or sessionStorage depending on "Remember me".
4. `AuthContext` fetches the `profiles` row for the user (`id`, `role`, `school_name`, `curriculum`).
5. React Router guards route access: students → `/dashboard`; admins → `/admin/*`.

### 2. AI Tutoring (Online)
1. Student sends a message in `ChatPage`.
2. `isSafeInput()` screens the message against unsafe patterns; blocked messages show an error.
3. `ruleEngine.buildSystemPrompt()` constructs the Claude system prompt:
   - Child safety block (mandatory, overrides all)
   - Subject + level context
   - Four-level Socratic scaffolding rules
   - Language instruction (English / Shona / Ndebele)
4. `claudeApi.streamCompletion()` opens a streaming SSE request to `api.anthropic.com`.
5. Response chunks are accumulated; `isResponseSafe()` checks the full response before delivery.
6. Safe chunks are streamed to the UI; unsafe responses are replaced with a redirect message.
7. Chat history is persisted to the `chat_sessions` table via Supabase.

### 3. AI Tutoring (Offline)
1. `offlineAI.initOfflineModel()` downloads SmolLM2-360M on first use (230 MB, cached).
2. `detectLanguage()` identifies whether the message is English, Shona, or Ndebele.
3. `askOffline()` passes the message to the in-browser model via Transformers.js pipeline.
4. Response is displayed with a "Offline Mode" indicator; not persisted to Supabase.

### 4. Voice Companion
1. Student clicks the voice button in `ChatPage`.
2. Browser requests `supabase/functions/voice-companion` with a Bearer JWT.
3. Edge Function validates the JWT using the anon Supabase client (no SERVICE_ROLE_KEY exposed).
4. Validated requests are forwarded to ElevenLabs TTS API.
5. Audio buffer returned to browser and played via Web Audio API.

### 5. Study Canvas
1. Canvas state (nodes, edges, viewport) is stored in the `canvas_states` table.
2. Each widget node type maps to a React component in `src/pages/canvas/nodes/`.
3. ReactFlow manages drag-and-drop, zoom, and edge connections.
4. Changes auto-save to Supabase after a 500 ms debounce.

---

## Database Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User metadata (role, school, curriculum) | ✅ owner + admin-school read |
| `student_memory` | Per-student persistent AI context | ✅ owner only |
| `rules` | Admin-defined pedagogical rules | ✅ admin write, school-wide read |
| `chat_sessions` | Chat history with messages JSONB | ✅ owner only |
| `canvas_states` | ReactFlow canvas serialisation | ✅ owner only |
| `voice_sessions` | Voice interaction logs | ✅ owner only |

---

## Security Architecture

See [SECURITY_CONTROLS.md](SECURITY_CONTROLS.md) for the full security model.  
See [CHILD_SAFETY.md](CHILD_SAFETY.md) for the three-layer child safety architecture.
