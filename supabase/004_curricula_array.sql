-- ============================================================
-- Compass — Curricula Array Migration
-- Adds text[] curricula column to profiles so users can follow
-- multiple curricula (e.g. ZIMSEC + Cambridge).
-- Run AFTER 001, 002, 003 migrations.
-- Paste into: Supabase → SQL Editor → Run
-- ============================================================

-- ── Add curricula array column ────────────────────────────
alter table public.profiles
  add column if not exists curricula text[] default '{}';

-- ── Backfill from existing single-value curriculum column ─
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

-- ── Update trigger to copy curricula from auth metadata ───
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
as $$
declare
  raw_curricula text[];
begin
  -- Extract curricula array from user_metadata if present
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
