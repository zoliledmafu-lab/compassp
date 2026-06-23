-- ============================================================
-- Compass — Initial Supabase Schema
-- Paste this entire file into: Supabase → SQL Editor → Run
-- ============================================================

-- ── Extensions ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

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

-- ── profiles ───────────────────────────────────────────────
-- Extends auth.users — created automatically by trigger below
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  role        text not null default 'student'
                check (role in ('student', 'admin')),
  avatar_url  text,
  created_at  timestamptz default now()
);

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
-- Single row — the institution's teaching rule configuration
create table if not exists public.rules (
  id                           uuid primary key default uuid_generate_v4(),
  no_direct_answers            boolean default true,
  ask_clarifying_question      boolean default true,
  always_encouraging           boolean default true,
  max_hints_before_break       int     default 5,
  flag_repeated_answer_attempts boolean default true,
  updated_at                   timestamptz default now()
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
-- One row per student per subject — stores full message history as JSONB
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
-- Full React-Flow canvas per student (one canvas, all subjects)
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
