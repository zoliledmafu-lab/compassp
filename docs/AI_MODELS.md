# Compass — AI Models

This document provides a model card for each AI model used in Compass.

---

## Model 1: Claude Sonnet 4.6 (Primary Tutor)

| Property | Value |
|----------|-------|
| Provider | Anthropic |
| Model ID | `claude-sonnet-4-6` |
| Role in Compass | Primary AI tutor for all student chat sessions |
| Access method | Direct browser API (prototype); must move to server-side for production |
| Input modalities | Text |
| Output modalities | Text (streamed) |
| Context window | 200,000 tokens |
| Languages supported | English, ChiShona, isiNdebele (via system prompt instruction) |

### How it is used

Claude Sonnet 4.6 receives a structured system prompt built by `src/lib/ruleEngine.ts` that includes:
1. Mandatory child safety guardrails (highest priority, cannot be overridden)
2. Subject and curriculum level context (ZIMSEC or Cambridge, O-Level or A-Level)
3. Admin-defined school rules (fetched from the `rules` Supabase table)
4. Four-level Socratic scaffolding instructions
5. Language instruction (respond in English / Shona / Ndebele)
6. Student memory context (previous session summaries)

Responses are streamed to the browser and screened by `isResponseSafe()` before display.

### Limitations

- Subject knowledge is based on training data up to the model's knowledge cutoff. ZIMSEC syllabus details may be outdated.
- The model cannot browse the internet or access real-time marking schemes.
- Instruction-following is probabilistic; adversarial prompts may bypass safety rules.

---

## Model 2: Claude Haiku 4.5 (Analytics)

| Property | Value |
|----------|-------|
| Provider | Anthropic |
| Model ID | `claude-haiku-4-5-20251001` |
| Role in Compass | Summarising student session data for admin analytics |
| Access method | Direct browser API (prototype) |
| Input modalities | Text |
| Output modalities | Text |
| Context window | 200,000 tokens |

### How it is used

Claude Haiku 4.5 is invoked from `src/lib/learnApi.ts` to generate concise summaries of learning session patterns for the admin analytics dashboard. It is chosen over Sonnet for this task because summaries are latency-sensitive and do not require the full reasoning capacity of Sonnet.

### Limitations

- Analytics summaries are derived from message content stored in Supabase; they do not access real-time data.
- Haiku may occasionally hallucinate subject-specific details in summaries.

---

## Model 3: SmolLM2-360M (Offline Tutor)

| Property | Value |
|----------|-------|
| Provider | Hugging Face (model: `Xenova/smollm2-360m-instruct`) |
| Runtime | Transformers.js (WASM, runs in browser) |
| Role in Compass | Offline tutoring when no internet connection is available |
| Access method | Downloaded once (230 MB), cached in browser |
| Input modalities | Text |
| Output modalities | Text |
| Parameters | 360 million |

### How it is used

`src/lib/offlineAI.ts` wraps the Transformers.js text-generation pipeline. On first use, `initOfflineModel()` triggers a one-time model download. Subsequent offline sessions use the cached model.

`detectLanguage()` applies a word-frequency scoring heuristic to identify English, Shona, or Ndebele input before passing to the model.

### Limitations

- **Significantly lower response quality** than Claude Sonnet 4.6 due to the difference in model size (360M vs. ~tens of billions of parameters).
- The 230 MB download is a barrier for students with slow or metered connections.
- The model has limited mathematical reasoning ability and may produce incorrect answers to complex problems.
- No safety filtering is applied to SmolLM2 outputs beyond the system prompt (which the small model may not reliably follow).

**Mitigation:** A visible "Offline Mode — Limited Quality" indicator must be displayed whenever SmolLM2 is active (see [KNOWN_LIMITATIONS.md](../KNOWN_LIMITATIONS.md#2-smollm2-360m-offline-model-quality)).

---

## AI Usage Declaration

Compass uses AI in two ways:

1. **AI as a product feature** — Claude and SmolLM2 are the core tutoring experience. Their use is disclosed to students and school administrators through the onboarding flow and this documentation.

2. **AI-assisted development** — Portions of this codebase were written with the assistance of Claude (Anthropic) acting as a coding assistant. All AI-generated code was reviewed and approved by the development team before commit.

No student data is used to train or fine-tune any of the AI models used in Compass.
