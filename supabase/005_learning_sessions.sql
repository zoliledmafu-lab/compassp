-- ============================================================
-- Compass — Learning Sessions Schema
-- Paste into: Supabase → SQL Editor → Run
-- ============================================================

create table if not exists public.learning_sessions (
  id               uuid primary key default uuid_generate_v4(),
  student_id       uuid references public.profiles(id) on delete cascade,
  topic_id         text not null,
  started_at       timestamptz default now(),
  completed_at     timestamptz,
  steps_completed  int default 0,
  hints_used       int default 0,
  annotations_used int default 0,
  understanding_map jsonb default '{}'
);

alter table public.learning_sessions enable row level security;

create policy "Students manage own learning sessions"
  on public.learning_sessions for all
  using (auth.uid() = student_id);

create policy "Admins read all learning sessions"
  on public.learning_sessions for select
  using (public.is_admin());

create table if not exists public.topic_steps (
  id             uuid primary key default uuid_generate_v4(),
  topic_id       text not null,
  step_number    int not null,
  widget_type    text not null,
  widget_config  jsonb default '{}',
  correct_state  jsonb default '{}',
  hint_sequence  jsonb default '[]',
  created_at     timestamptz default now(),
  unique(topic_id, step_number)
);

alter table public.topic_steps enable row level security;

create policy "Authenticated users read topic steps"
  on public.topic_steps for select
  using (auth.role() = 'authenticated');

create policy "Admins manage topic steps"
  on public.topic_steps for all
  using (public.is_admin());
