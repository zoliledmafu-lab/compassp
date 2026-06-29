-- ============================================================
-- Compass — Full Schema (all migrations combined)
-- Project: https://njetilhbprvvazalcxrs.supabase.co
-- Paste this entire file into: Supabase → SQL Editor → Run
-- ============================================================


-- ============================================================
-- MIGRATION 001 — Initial Schema
-- ============================================================

-- ── Extensions ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── profiles ───────────────────────────────────────────────
-- Created first so is_admin() can reference it
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  role        text not null default 'student'
                check (role in ('student', 'admin')),
  avatar_url  text,
  created_at  timestamptz default now()
);

-- ── Helper: is current user an admin? ──────────────────────
create or replace function public.is_admin()
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── student_memory ─────────────────────────────────────────
create table if not exists public.student_memory (
  id                   uuid primary key default uuid_generate_v4(),
  student_id           uuid not null references public.profiles(id) on delete cascade,
  subject              text not null,
  strengths            text[]  default '{}',
  struggles            text[]  default '{}',
  preferred_style      text    default 'mixed',
  topics_covered       text[]  default '{}',
  session_count        int     default 0,
  last_session_summary text    default '',
  last_session_date    text    default '',
  updated_at           timestamptz default now(),
  unique(student_id, subject)
);

alter table public.student_memory enable row level security;

create policy "Students manage own memory"
  on public.student_memory for all
  using (auth.uid() = student_id);

create policy "Admins read all memory"
  on public.student_memory for select
  using (public.is_admin());


-- ── rules ──────────────────────────────────────────────────
create table if not exists public.rules (
  id                            uuid primary key default uuid_generate_v4(),
  no_direct_answers             boolean default true,
  ask_clarifying_question       boolean default true,
  always_encouraging            boolean default true,
  max_hints_before_break        int     default 5,
  flag_repeated_answer_attempts boolean default true,
  updated_at                    timestamptz default now()
);

alter table public.rules enable row level security;

create policy "Anyone authenticated can read rules"
  on public.rules for select
  using (auth.role() = 'authenticated');

create policy "Admins can update rules"
  on public.rules for all
  using (public.is_admin());

-- Seed default rules row
insert into public.rules (no_direct_answers, ask_clarifying_question, always_encouraging, max_hints_before_break, flag_repeated_answer_attempts)
values (true, true, true, 5, true)
on conflict do nothing;


-- ── chat_sessions ──────────────────────────────────────────
create table if not exists public.chat_sessions (
  id                  uuid primary key default uuid_generate_v4(),
  student_id          uuid not null references public.profiles(id) on delete cascade,
  subject             text not null,
  messages            jsonb default '[]',
  session_boundaries  jsonb default '[]',
  last_active         timestamptz default now(),
  updated_at          timestamptz default now(),
  unique(student_id, subject)
);

alter table public.chat_sessions enable row level security;

create policy "Students manage own chat"
  on public.chat_sessions for all
  using (auth.uid() = student_id);

create policy "Admins read all chat"
  on public.chat_sessions for select
  using (public.is_admin());


-- ── canvas_states ──────────────────────────────────────────
create table if not exists public.canvas_states (
  id              uuid primary key default uuid_generate_v4(),
  student_id      uuid not null references public.profiles(id) on delete cascade,
  nodes           jsonb default '[]',
  edges           jsonb default '[]',
  viewport        jsonb default '{"x":0,"y":0,"zoom":1}',
  branch_messages jsonb default '{}',
  updated_at      timestamptz default now(),
  unique(student_id)
);

alter table public.canvas_states enable row level security;

create policy "Students manage own canvas"
  on public.canvas_states for all
  using (auth.uid() = student_id);

create policy "Admins read all canvas"
  on public.canvas_states for select
  using (public.is_admin());


-- ── updated_at auto-stamp ──────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger set_student_memory_updated_at
  before update on public.student_memory
  for each row execute procedure public.set_updated_at();

create trigger set_rules_updated_at
  before update on public.rules
  for each row execute procedure public.set_updated_at();

create trigger set_chat_sessions_updated_at
  before update on public.chat_sessions
  for each row execute procedure public.set_updated_at();

create trigger set_canvas_states_updated_at
  before update on public.canvas_states
  for each row execute procedure public.set_updated_at();


-- ============================================================
-- MIGRATION 002 — Voice Sessions
-- ============================================================

create table if not exists public.voice_sessions (
  id                    uuid primary key default uuid_generate_v4(),
  student_id            uuid references public.profiles(id) on delete cascade,
  created_at            timestamptz default now(),
  mode                  text not null check (mode in ('browser', 'desktop')),
  source_context        text,
  transcript_summary    text default '',
  response_summary      text default '',
  rules_snapshot        jsonb,
  hints_given           int  default 0,
  subject_detected      text default '',
  pointer_targets_used  boolean default false
);

alter table public.voice_sessions enable row level security;

create policy "Students read own voice sessions"
  on public.voice_sessions for select
  using (auth.uid() = student_id);

create policy "Students insert own voice sessions"
  on public.voice_sessions for insert
  with check (auth.uid() = student_id);

create policy "Admins read all voice sessions"
  on public.voice_sessions for select
  using (public.is_admin());

alter table public.rules
  add column if not exists voice_enabled        boolean default true,
  add column if not exists desktop_mode_enabled boolean default true;


-- ============================================================
-- MIGRATION 003 — Curriculum Support
-- ============================================================

alter table public.profiles
  add column if not exists curriculum  text default 'NSC'
    check (curriculum in ('NSC','ZIMSEC-OL','ZIMSEC-AL','CAM-IGCSE','CAM-AL','ALL')),
  add column if not exists school_name text default '',
  add column if not exists country     text default '';

alter table public.student_memory
  add column if not exists curriculum text default 'NSC';

alter table public.chat_sessions
  add column if not exists curriculum text default 'NSC';

alter table public.voice_sessions
  add column if not exists curriculum text default '';

-- ── institutions ──────────────────────────────────────────
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

-- ── curriculum_content ────────────────────────────────────
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

-- Seed command words
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


-- ============================================================
-- MIGRATION 004 — Curricula Array
-- ============================================================

alter table public.profiles
  add column if not exists curricula text[] default '{}';

update public.profiles
set curricula = case
  when curriculum = 'NSC'       then array['NSC']
  when curriculum = 'ZIMSEC-OL' then array['ZIMSEC-OL', 'ZIMSEC-AL']
  when curriculum = 'ZIMSEC-AL' then array['ZIMSEC-OL', 'ZIMSEC-AL']
  when curriculum = 'CAM-IGCSE' then array['CAM-IGCSE', 'CAM-AL']
  when curriculum = 'CAM-AL'    then array['CAM-IGCSE', 'CAM-AL']
  when curriculum = 'ALL'       then array['ZIMSEC-OL', 'ZIMSEC-AL', 'CAM-IGCSE', 'CAM-AL']
  else array[]::text[]
end
where curricula = '{}';

-- Update trigger to copy curricula array from auth metadata on sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
as $$
declare
  raw_curricula text[];
begin
  begin
    select array(
      select jsonb_array_elements_text(new.raw_user_meta_data->'curricula')
    ) into raw_curricula;
  exception when others then
    raw_curricula := '{}';
  end;

  insert into public.profiles (id, email, full_name, role, curricula)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(raw_curricula, '{}')
  )
  on conflict (id) do update set
    curricula = coalesce(excluded.curricula, public.profiles.curricula);
  return new;
end;
$$;
