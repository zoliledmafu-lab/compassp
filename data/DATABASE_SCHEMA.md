# Compass — Database Schema

Compass uses Supabase (PostgreSQL). The full schema is in `supabase/000_full_schema.sql`.

---

## Tables

### `profiles`

Stores user metadata created automatically when a new Supabase Auth user signs up (via `handle_new_user` trigger).

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | `uuid` | NO | FK → `auth.users.id` (PK) |
| `email` | `text` | YES | Copied from auth.users |
| `full_name` | `text` | YES | |
| `role` | `text` | NO | `'student'` or `'admin'` |
| `school_name` | `text` | YES | Used to scope admin analytics and rules |
| `curriculum` | `text` | YES | `'ZIMSEC'` or `'Cambridge'` |
| `avatar_url` | `text` | YES | Google OAuth profile photo URL |
| `created_at` | `timestamptz` | NO | Default: `now()` |

**RLS:** Owner can read/update own row. Admin can read rows where `school_name` matches.

---

### `student_memory`

Stores persistent AI context summaries per student, used to personalise future tutoring sessions.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | `uuid` | NO | PK |
| `student_id` | `uuid` | NO | FK → `profiles.id` |
| `subject` | `text` | NO | Subject the memory applies to |
| `memory_text` | `text` | NO | AI-generated session summary |
| `updated_at` | `timestamptz` | NO | Last updated timestamp |

**RLS:** Owner only.

---

### `rules`

Admin-defined pedagogical rules injected into all AI system prompts for the school.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | `uuid` | NO | PK |
| `school_name` | `text` | NO | School this rule applies to |
| `admin_id` | `uuid` | NO | FK → `profiles.id` (creator) |
| `rule_text` | `text` | NO | Plain-English rule |
| `subject` | `text` | YES | `null` = applies to all subjects |
| `active` | `boolean` | NO | Default: `true` |
| `created_at` | `timestamptz` | NO | |

**RLS:** Students at the same school can read active rules. Admins at the same school can insert/update/delete.

---

### `chat_sessions`

Stores the full chat history for each tutoring session.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | `uuid` | NO | PK |
| `student_id` | `uuid` | NO | FK → `profiles.id` |
| `subject` | `text` | NO | |
| `level` | `text` | YES | e.g. `'O-Level'`, `'A-Level'` |
| `messages` | `jsonb` | NO | Array of `{ role, content }` objects |
| `last_active` | `timestamptz` | YES | Updated on each message |
| `created_at` | `timestamptz` | NO | |

**RLS:** Owner only. Admin analytics queries run server-side via Supabase client with the anon key and school-scoped queries.

---

### `canvas_states`

Stores the serialised ReactFlow canvas for each student.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | `uuid` | NO | PK |
| `student_id` | `uuid` | NO | FK → `profiles.id` (unique) |
| `nodes` | `jsonb` | NO | ReactFlow node array |
| `edges` | `jsonb` | NO | ReactFlow edge array |
| `viewport` | `jsonb` | YES | `{ x, y, zoom }` |
| `updated_at` | `timestamptz` | NO | |

**Constraint:** One canvas state per student (`UNIQUE(student_id)`).  
**RLS:** Owner only.

---

### `voice_sessions`

Logs voice interaction metadata (not audio content).

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | `uuid` | NO | PK |
| `student_id` | `uuid` | NO | FK → `profiles.id` |
| `text_input` | `text` | YES | Text sent to TTS |
| `duration_ms` | `integer` | YES | Audio duration in milliseconds |
| `created_at` | `timestamptz` | NO | |

**RLS:** Owner only.

---

## Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| `student_memory` | `(student_id, subject)` | Fast memory lookup per student/subject |
| `chat_sessions` | `student_id` | Fast session listing per student |
| `chat_sessions` | `last_active` | Analytics time-range queries |
| `rules` | `(school_name, active)` | Fast rule fetch per school |
| `voice_sessions` | `student_id` | Log lookup |

---

## Key Trigger

```sql
CREATE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'student')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

This trigger ensures a `profiles` row is created for every new user, defaulting to the `student` role.
