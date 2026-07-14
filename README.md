# Compass — AI Tutor for Zimbabwean Schools

**POTRAZ AI for Impact Challenge 2026 Submission**

Compass is an AI-powered Socratic tutor for Zimbabwean secondary school students, supporting ZIMSEC and Cambridge curricula in English, Shona, and Ndebele, with offline capability for low-connectivity environments.

**Live demo:** https://compassp.vercel.app  
Student demo → `student@compass.edu` / `student123`  
Admin demo → `admin@compass.edu` / `admin123`

---

## Problem Statement

Over 600,000 Zimbabwean secondary school students sit ZIMSEC examinations each year. Most attend under-resourced schools with limited access to qualified subject tutors. Private tuition is unaffordable for the majority of families. The result: students learn in isolation, make the same conceptual mistakes, and approach exams underprepared.

Compass addresses this gap with a 24/7 AI tutor that guides students through their own thinking rather than giving answers away — building the durable understanding that exams demand.

---

## Solution

Compass uses a four-level Socratic scaffolding system powered by Claude Sonnet 4.6:

| Level | Triggered when | AI response |
|-------|---------------|-------------|
| 1 | First question | Clarifying question — probes existing knowledge |
| 2 | Second question | Targeted hint — points toward the answer |
| 3 | Third question | Partial worked example — shows one step |
| 4 | Repeated failure | Full worked example + new practice problem |

The AI never just gives answers. It guides students to discover them.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Browser (SPA)                     │
│  React 19 · TypeScript · Vite 8 · Tailwind CSS     │
│  Auth · Chat · Study Canvas · Admin Dashboard       │
└─────────────────────────────────────────────────────┘
          │                         │
          ▼                         ▼
┌──────────────────┐     ┌──────────────────────────┐
│  Supabase        │     │  Anthropic API            │
│  PostgreSQL + RLS│     │  Claude Sonnet 4.6 (tutor)│
│  Auth (JWT)      │     │  Claude Haiku 4.5 (stats) │
│  Edge Functions  │     └──────────────────────────┘
└──────────────────┘
                         ┌──────────────────────────┐
                         │  SmolLM2-360M (browser)  │
                         │  Offline tutoring         │
                         └──────────────────────────┘
```

---

## AI Models

| Model | Provider | Role |
|-------|----------|------|
| `claude-sonnet-4-6` | Anthropic | Primary tutor (Socratic chat) |
| `claude-haiku-4-5` | Anthropic | Session analytics summaries |
| `SmolLM2-360M` | Hugging Face | Offline tutoring (browser WASM) |

Full model cards: [docs/AI_MODELS.md](docs/AI_MODELS.md)

---

## Data Sources

- ZIMSEC and Cambridge International syllabuses (public)
- Student interaction data (user-generated, stored in Supabase with RLS)
- Admin pedagogical rules (school-defined)

Full data documentation: [data/SOURCES.md](data/SOURCES.md)

---

## Setup

### Prerequisites

- Node.js 20+
- A Supabase project (or use demo mode without one)
- An Anthropic API key (or use demo mode)

### Install

```bash
git clone https://github.com/your-org/compass.git
cd compass
npm install
cp .env.example .env
# Fill in .env — see comments in .env.example
npm run dev
```

### Demo Mode (no API keys needed)

Leave `VITE_SUPABASE_URL` blank in `.env`. The app runs entirely in localStorage with demo credentials.

---

## Environment Variables

See [.env.example](.env.example) for full documentation of all variables.

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | For live mode | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | For live mode | Supabase anon key (safe to expose) |
| `VITE_ANTHROPIC_API_KEY` | For AI features | Anthropic API key (**prototype only** — see Known Limitations) |
| `VITE_DEMO_ADMIN_PASSWORD` | Optional | Override default demo admin password |
| `VITE_DEMO_STUDENT_PASSWORD` | Optional | Override default demo student password |

---

## Running Tests

```bash
npx vitest run
```

Tests are in `src/tests/`. They cover:
- `ruleEngine.test.ts` — 13 tests for scaffolding logic and system prompt generation
- `offlineAI.test.ts` — 6 tests for language detection and offline readiness

Note: `npm install` must succeed for the local vitest binary to be available. See [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md) if tests fail due to missing native binaries.

---

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full Vercel + Supabase deployment instructions.

---

## Key Documentation

| Document | Contents |
|----------|---------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, data flows, database tables |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Vercel + Supabase deployment guide |
| [docs/USER_GUIDE.md](docs/USER_GUIDE.md) | How to use Compass as a student or admin |
| [docs/CHILD_SAFETY.md](docs/CHILD_SAFETY.md) | Three-layer child safety architecture |
| [docs/SECURITY_CONTROLS.md](docs/SECURITY_CONTROLS.md) | Auth, RLS, Edge Function security, demo isolation |
| [docs/AI_MODELS.md](docs/AI_MODELS.md) | Model cards for all three AI models |
| [data/SOURCES.md](data/SOURCES.md) | All data sources and licences |
| [data/DATABASE_SCHEMA.md](data/DATABASE_SCHEMA.md) | Supabase table schema |
| [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md) | Six known prototype limitations |
| [CHANGELOG.md](CHANGELOG.md) | Version history |

---

## Known Limitations

Six known limitations of this prototype are documented in [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md). The most important:

1. **Anthropic API key is exposed in the browser bundle** — prototype only; production requires server-side proxying.
2. **SmolLM2-360M offline model quality** is significantly below Claude Sonnet.
3. **Demo credentials** are bundle-visible — demo mode only.

---

## Data / Privacy Statement

- Student chat data is stored in Supabase (Zimbabwe-region hosting planned for production).
- Data is access-controlled by Row Level Security; each student sees only their own data.
- Student data is never used to train or fine-tune any AI model.
- No personal information is solicited from students by the AI (enforced by system prompt rules and content filters).

---

## AI Usage Declaration

Compass uses AI in two ways:

1. **As a product feature**: Claude Sonnet 4.6 and SmolLM2-360M are the core tutoring experience. Students are informed during onboarding that they are interacting with an AI tutor.

2. **AI-assisted development**: Portions of this codebase were written with the assistance of Claude (Anthropic) acting as a coding assistant. All AI-generated code was reviewed and approved by the development team.

---

## Team

Built for the POTRAZ AI for Impact Challenge 2026.

---

## License

[MIT License](LICENSE) — © 2026 Compass Educational Technology
