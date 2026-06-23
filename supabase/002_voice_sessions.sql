-- ============================================================
-- Compass Voice Companion — Schema Addition
-- Paste into: Supabase → SQL Editor → Run
-- ============================================================

create table if not exists public.voice_sessions (
  id                    uuid primary key default uuid_generate_v4(),
  student_id            uuid references public.profiles(id) on delete cascade,
  created_at            timestamptz default now(),
  mode                  text not null check (mode in ('browser', 'desktop')),
  source_context        text,          -- tab domain or detected app name
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

-- Allow Edge Function (service role) to insert sessions for any student
-- This policy is satisfied automatically by service role key bypassing RLS.

-- Admin disable-desktop-mode flag on rules table
alter table public.rules
  add column if not exists voice_enabled         boolean default true,
  add column if not exists desktop_mode_enabled  boolean default true;
