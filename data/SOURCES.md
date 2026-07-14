# Compass — Data Sources

This document describes all data sources used in Compass.

---

## 1. Curriculum Data (ZIMSEC & Cambridge)

**Source:** Publicly available ZIMSEC and Cambridge International syllabuses  
**Access:** Downloaded from official ZIMSEC and Cambridge websites; not redistributed in this repository  
**Use:** Inform the AI system prompt about subject scope, assessment objectives, and terminology  
**Format:** Referenced as plain-English subject/level identifiers in `ruleEngine.ts`  
**Licence:** Curriculum documents are © ZIMSEC and Cambridge Assessment International Education respectively

Compass does not store or redistribute copyright syllabus content. The AI model is instructed to use ZIMSEC/Cambridge terminology and marking scheme language, but all subject knowledge comes from the AI model's training data (which includes publicly available educational material).

---

## 2. Student Interaction Data (User-Generated)

**Source:** Students using the Compass platform  
**Access:** Stored in Supabase PostgreSQL; access restricted by Row Level Security  
**Use:** Personalised tutoring memory, admin analytics, session history  
**Format:** JSON (chat messages in `chat_sessions.messages`), text (in `student_memory.memory_text`)  
**Retention:** Until the student deletes their account or requests data deletion  
**Privacy:** See [SECURITY_CONTROLS.md](../docs/SECURITY_CONTROLS.md) and the README data/privacy section

Student data is never used to train AI models. It is never shared with Anthropic, ElevenLabs, or any third party beyond what is necessary to provide the tutoring service.

---

## 3. Admin-Defined Rules (User-Generated)

**Source:** School administrators  
**Access:** Stored in Supabase `rules` table; readable by all students at the same school  
**Use:** Injected into every AI system prompt to customise tutoring for the school's approach  
**Format:** Plain-English text strings  
**Retention:** Until the admin deletes the rule

---

## 4. Sample Training Data (Illustrative)

**File:** `data/sample_training_data.json`  
**Source:** Hand-authored by the Compass development team  
**Use:** Illustrative examples for the POTRAZ AI for Impact Challenge submission; not used to train any model  
**Format:** JSON array of `{ prompt, expected_response, subject, level, language }` tuples  
**Licence:** MIT (same as the rest of this repository)

These 5 examples demonstrate the style of Socratic guidance the AI system prompt is designed to elicit. They are not a training dataset for fine-tuning.

---

## 5. AI Model Weights

| Model | Source | Licence |
|-------|--------|---------|
| Claude Sonnet 4.6 | Anthropic API (hosted) | Anthropic Terms of Service — model weights not redistributed |
| Claude Haiku 4.5 | Anthropic API (hosted) | Anthropic Terms of Service — model weights not redistributed |
| SmolLM2-360M | Hugging Face (`Xenova/smollm2-360m-instruct`) | Apache 2.0 |

SmolLM2-360M weights are downloaded from Hugging Face at runtime and cached in the user's browser. They are not bundled in this repository.
