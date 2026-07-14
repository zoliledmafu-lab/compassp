# Known Limitations

This document lists known limitations of the current Compass prototype, relevant to the POTRAZ AI for Impact Challenge 2026 submission.

---

## 1. Direct Browser Access to Anthropic API

**Status:** Prototype only  
The `anthropic-dangerous-direct-browser-access: 'true'` header is set in `src/lib/claudeApi.ts` and `src/lib/learnApi.ts`. This sends requests directly from the user's browser to the Anthropic API, bypassing any server-side rate limiting, request auditing, or key rotation.

**Risk:** API key exposure if the network request is intercepted or the Vite bundle is inspected.

**Intended fix for production:** Route all Anthropic calls through a Supabase Edge Function or dedicated backend service. The API key never leaves the server.

---

## 2. SmolLM2-360M Offline Model Quality

**Status:** Prototype only  
The offline tutoring mode uses `Xenova/smollm2-360m-instruct` via Transformers.js, which runs in the browser. The 230 MB model download is required on first use and the model's reasoning quality is significantly below Claude Sonnet 4.6.

**Risk:** Students may receive incorrect or incomplete answers when offline.

**Intended fix for production:** Cache the model in a Service Worker and add a visible "Offline Mode — Limited Quality" banner to set expectations.

---

## 3. Demo Credentials in Environment Variables

**Status:** Prototype only  
Demo login credentials (`admin@compass.edu` / `student@compass.edu` and their passwords) are stored in environment variables (`VITE_DEMO_ADMIN_PASSWORD`, `VITE_DEMO_STUDENT_PASSWORD`). These values are injected into the Vite build bundle at compile time and are visible in the client-side JavaScript.

**Risk:** Anyone who reads the compiled JS bundle can discover demo credentials.

**Intended fix for production:** Remove demo mode entirely, or isolate it behind a separate non-production deployment.

---

## 4. Voice Companion Requires ElevenLabs Subscription

**Status:** Prototype only  
The voice feature calls the ElevenLabs API from a Supabase Edge Function. Without a paid ElevenLabs API key, the feature fails silently.

**Risk:** Voice feature is unavailable to schools without funding for the subscription.

**Intended fix for production:** Make voice optional with a graceful fallback to browser-native Web Speech API (no external subscription required).

---

## 5. No Rate Limiting on AI Requests

**Status:** Prototype only  
Students can send unlimited messages to the Claude API. There is no per-user, per-session, or per-school rate limit enforced at the application layer.

**Risk:** Unexpected API cost spikes; a single student could consume the entire monthly quota.

**Intended fix for production:** Implement per-user daily message limits enforced server-side (Edge Function middleware), with a visible quota counter in the UI.

---

## 6. RLS Policies Not Independently Audited

**Status:** Prototype quality  
Row Level Security is enabled on all 6 Supabase tables and policies were written to restrict access by `user_id` and `school_name`. However, these policies have not been reviewed by an independent security auditor or penetration tested.

**Risk:** A mis-scoped RLS policy could allow cross-school data access.

**Intended fix for production:** Commission a third-party SQL/RLS audit before handling real student data, and add integration tests that verify cross-user data isolation.
