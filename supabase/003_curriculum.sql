-- ============================================================
-- Compass — Curriculum Support Migration
-- Paste into: Supabase → SQL Editor → Run
-- Run AFTER 001_initial_schema.sql and 002_voice_sessions.sql
-- ============================================================

-- ── Add curriculum preference to student profiles ──────────
alter table public.profiles
  add column if not exists curriculum text default 'NSC'
    check (curriculum in ('NSC','ZIMSEC-OL','ZIMSEC-AL','CAM-IGCSE','CAM-AL','ALL')),
  add column if not exists school_name text default '',
  add column if not exists country     text default '';

-- ── Add curriculum column to student_memory ───────────────
-- The subject ID already encodes the curriculum (e.g. "zol-mathematics")
-- but we add an explicit column for fast queries.
alter table public.student_memory
  add column if not exists curriculum text default 'NSC';

-- ── Add curriculum column to chat_sessions ────────────────
alter table public.chat_sessions
  add column if not exists curriculum text default 'NSC';

-- ── Add curriculum column to voice_sessions ───────────────
alter table public.voice_sessions
  add column if not exists curriculum text default '';

-- ── institutions table ────────────────────────────────────
-- Allows admins to configure their school's curriculum settings
create table if not exists public.institutions (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  country        text default 'Zimbabwe',
  curricula      text[] default '{NSC,ZIMSEC-OL,ZIMSEC-AL,CAM-IGCSE,CAM-AL}',
  contact_email  text default '',
  active         boolean default true,
  created_at     timestamptz default now()
);

alter table public.institutions enable row level security;

create policy "Admins manage institutions"
  on public.institutions for all
  using (public.is_admin());

create policy "Authenticated users can read institutions"
  on public.institutions for select
  using (auth.role() = 'authenticated');

-- ── curriculum_content table ──────────────────────────────
-- Store per-subject resource links, notes, syllabi
create table if not exists public.curriculum_content (
  id              uuid primary key default uuid_generate_v4(),
  curriculum_code text not null check (curriculum_code in ('NSC','ZIMSEC-OL','ZIMSEC-AL','CAM-IGCSE','CAM-AL')),
  subject_id      text not null,
  content_type    text not null check (content_type in ('syllabus_note','past_paper_tip','key_topic','command_words','mark_scheme_tip')),
  title           text not null,
  body            text not null,
  created_at      timestamptz default now()
);

alter table public.curriculum_content enable row level security;

create policy "All authenticated can read curriculum content"
  on public.curriculum_content for select
  using (auth.role() = 'authenticated');

create policy "Admins manage curriculum content"
  on public.curriculum_content for all
  using (public.is_admin());

-- ── Seed command words for Cambridge IGCSE ───────────────
insert into public.curriculum_content (curriculum_code, subject_id, content_type, title, body)
values
  ('CAM-IGCSE', 'igcse-physics',   'command_words', 'Cambridge command words for Physics',
   'state=list a fact; describe=say what happens step by step; explain=give the reason using "because"; calculate=show all working with units; sketch=draw a labelled diagram (not to scale is fine); suggest=apply knowledge to new context—no single right answer; compare=give BOTH similarities AND differences'),
  ('CAM-IGCSE', 'igcse-chemistry', 'command_words', 'Cambridge command words for Chemistry',
   'state=recall a fact; identify=name or pick out; describe=say what you observe; explain=give the scientific reason; deduce=reach a conclusion from data; suggest=apply understanding to unfamiliar situation; predict=use knowledge to say what will happen'),
  ('CAM-IGCSE', 'igcse-biology',   'command_words', 'Cambridge command words for Biology',
   'state=list without explanation; name=identify; describe=give characteristics; explain=give reason with "because"; calculate=show working; sketch=labelled diagram; suggest=apply to new situation; evaluate=weigh advantages and disadvantages'),
  ('CAM-IGCSE', 'igcse-economics', 'command_words', 'Cambridge command words for Economics',
   'define=give a precise meaning; explain=give cause and effect; analyse=break down and examine; evaluate=weigh up both sides and give a conclusion; discuss=give arguments for and against; assess=make a judgement supported by evidence'),
  ('CAM-AL',    'cal-economics',   'command_words', 'Cambridge A Level Economics command words',
   'analyse=examine components and their interactions; evaluate=weigh evidence and reach a reasoned conclusion; assess=judge significance or importance; discuss=explore multiple perspectives; to what extent=argue for and against, then state your final verdict'),
  ('CAM-AL',    'cal-physics',     'mark_scheme_tip', 'Physics A Level mark scheme tips',
   'Always include units. For "explain" questions, link cause to effect explicitly. For "evaluate" questions, make a clear concluding statement. Significant figures: match the data given. Practical questions: state assumption, method, measurement, source of error.'),
  ('ZIMSEC-OL', 'zol-mathematics', 'mark_scheme_tip', 'ZIMSEC O-Level Maths marking tips',
   'ZIMSEC awards method marks (M marks) generously—show ALL working even if final answer is wrong. Use correct mathematical notation. For geometry: state the theorem or reason used. For statistics: show all steps in calculation.'),
  ('ZIMSEC-AL', 'zal-economics',   'command_words', 'ZIMSEC A-Level Economics command words',
   'describe=give key features; explain=give reasons; analyse=break down and examine relationships; evaluate=judge with evidence and give conclusion; discuss=present arguments for and against; assess=weigh up and conclude; justify=give reasons supporting a viewpoint')
on conflict do nothing;
