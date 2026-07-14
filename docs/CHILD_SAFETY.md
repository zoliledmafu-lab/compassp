# Compass — Child Safety Architecture

Compass is deployed in school environments serving minors in Zimbabwe. This document describes the three-layer safety system implemented to comply with the **Zimbabwe Children's Amendment Act (2023)** and to protect students from harmful content, grooming, and misuse of the AI tutor.

---

## Regulatory Context

The Zimbabwe Children's Amendment Act (2023) prohibits:
- Exposing minors to harmful or sexual content via digital platforms
- Using technology to solicit personal information from children
- Facilitating grooming or inappropriate adult-child relationships online

Compass is designed to prevent all three categories of harm at multiple independent layers.

---

## Layer 1 — Input Filter (Client-Side)

**File:** `src/lib/claudeApi.ts` — `isSafeInput()`  
**Invoked by:** `src/pages/chat/ChatPage.tsx` before every message is sent

Before any message reaches the AI model, it is tested against a set of regular expression patterns:

| Category | Example blocked phrases |
|----------|------------------------|
| Sexual content | "porn", "naked", "explicit" |
| Violence or self-harm | "how to kill", "how to suicide", "make a bomb" |
| Personal information solicitation | "where do you live", "send me a photo", "meet me" |
| Self-harm / suicide | "how to self-harm", "ways to die" |

**Behaviour on match:** The message is **never sent to the AI**. The student sees:  
> "I can only help with your school subjects. Let's focus on your studies!"

---

## Layer 2 — System Prompt Guardrails (Server-Side via Prompt)

**File:** `src/lib/ruleEngine.ts` — `buildSystemPrompt()`  
**Applied to:** Every AI request, injected before any other instructions

The system prompt contains a mandatory block labelled `CHILD SAFETY — MANDATORY RULES` that the model is instructed overrides all other context. The five rules are:

### Rule 1 — Educational Topics Only
The AI must refuse to discuss anything outside the student's school subjects. Redirect script:
> "I'm here just for your studies! Let's get back to [subject]. What were you working on?"

### Rule 2 — Never Collect Personal Information
The AI must not ask for or encourage sharing of full name, home address, phone number, age, photos, school name, or location. It must not comment if a student volunteers this information.

### Rule 3 — Refuse Harmful or Off-Topic Requests
The AI must refuse instructions to help with anything violent, illegal, sexual, or emotionally manipulative. Redirect:
> "I can't help with that, but I'm always here for your studies."

### Rule 4 — No Grooming or Inappropriate Relationships
The AI must not form personal relationships, compliment appearance, ask about the student's personal life, or suggest meeting outside the app.

### Rule 5 — Redirect Distress Signals
If a student expresses distress (self-harm, abuse, danger), the AI must respond:
> "I hear that something is wrong. Please talk to a trusted adult — a teacher, parent, or school counsellor — right away."

---

## Layer 3 — Output Screening (Client-Side)

**File:** `src/lib/claudeApi.ts` — `isResponseSafe()`  
**Applied to:** Every streamed AI response, after all chunks are received and before delivery to the UI

The accumulated response is tested against patterns:

| Category | Example blocked phrases |
|----------|------------------------|
| Information solicitation | "where do you live", "send me a photo" |
| Sexual content | "porn", "explicit sexual", "nude" |
| Encouragement of harm | "you should hurt", "it's okay to harm" |

**Behaviour on match:** The response chunks are **discarded**. The student receives instead:  
> "I can only help with your school subjects. Let's get back to your studies — what topic are you working on?"

---

## Independence of Layers

Each layer operates independently:
- Layer 1 fails → message never leaves the browser
- Layer 2 fails → model is instructed to refuse; response may still be unsafe
- Layer 3 catches what layers 1 and 2 missed

All three layers must fail simultaneously for harmful content to reach a student.

---

## Reporting Safety Issues

If you observe Compass producing harmful content, contact the development team immediately via the repository issue tracker. Include a description of the input and the output received.

---

## Limitations

- Regex-based filters can be evaded with unusual spelling, Unicode substitution, or multi-turn jailbreaks. A production deployment should supplement these with a dedicated content moderation API (e.g., Anthropic's built-in safety classifiers or a separate moderation model).
- The system prompt guardrails rely on model instruction-following, which is probabilistic. A sufficiently adversarial prompt could bypass them.
- Output screening only checks the final accumulated response, not intermediate streaming chunks displayed to the user. In the current implementation, streaming is halted and replaced on detection — but the student may see the first few chunks before the check runs.

See [KNOWN_LIMITATIONS.md](../KNOWN_LIMITATIONS.md) for the full limitations list.
