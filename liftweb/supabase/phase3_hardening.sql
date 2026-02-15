-- Phase 3 hardening: performance indexes + moderation role workflow

-- =========================
-- Performance indexes
-- =========================
create index if not exists idx_profiles_handle on public.profiles (handle);
create index if not exists idx_logs_created_at on public.workout_logs (created_at desc);
create index if not exists idx_logs_user_created_at on public.workout_logs (user_id, created_at desc);
create index if not exists idx_templates_user_created_at on public.workout_templates (user_id, created_at desc);
create index if not exists idx_lifts_user_created_at on public.lifts (user_id, created_at desc);
create index if not exists idx_reports_reporter_created_at on public.reports (reporter_id, created_at desc);
create index if not exists idx_reports_status_created_at on public.reports (status, created_at desc);
create index if not exists idx_blocks_blocker_blocked on public.blocks (blocker_id, blocked_id);

-- optional status guardrail
alter table public.reports
  drop constraint if exists reports_status_check;
alter table public.reports
  add constraint reports_status_check
  check (status in ('open', 'reviewed', 'resolved', 'dismissed'));

-- =========================
-- Moderation role table
-- =========================
create table if not exists public.moderators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

alter table public.moderators enable row level security;

drop policy if exists "Moderators can read own role" on public.moderators;
drop policy if exists "Moderators can read all roles" on public.moderators;

create policy "Moderators can read own role" on public.moderators
  for select using (auth.uid() = user_id);

-- =========================
-- Reports policy upgrades
-- =========================
-- allow moderators to read/update all reports while preserving reporter self-read

drop policy if exists "Reports owner read" on public.reports;
drop policy if exists "Reports moderator read" on public.reports;
drop policy if exists "Reports moderator update" on public.reports;

create policy "Reports owner read" on public.reports
  for select using (auth.uid() = reporter_id);

create policy "Reports moderator read" on public.reports
  for select using (
    exists (
      select 1 from public.moderators m
      where m.user_id = auth.uid()
    )
  );

create policy "Reports moderator update" on public.reports
  for update using (
    exists (
      select 1 from public.moderators m
      where m.user_id = auth.uid()
    )
  );
