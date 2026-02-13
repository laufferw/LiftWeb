-- LiftCycle MVP schema + RLS policies

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null,
  display_name text not null,
  avatar_url text,
  bio text,
  created_at timestamp with time zone default now()
);

create table if not exists public.lifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  goal_weight numeric not null,
  week_number integer not null,
  top_set_start_percent numeric not null,
  backoff_percent numeric not null,
  cycle_start_weight numeric not null,
  top_set_sets integer not null,
  top_set_reps integer not null,
  backoff_sets integer not null,
  backoff_reps integer not null,
  alt_top_set_sets integer not null,
  alt_top_set_reps integer not null,
  alt_backoff_sets integer not null,
  alt_backoff_reps integer not null,
  alt_day_top_set_percent numeric not null,
  alt_day_backoff_percent numeric not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  lift_ids uuid[] not null,
  main_lift_id uuid references public.lifts(id),
  created_at timestamp with time zone default now()
);

create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  lift_name text not null,
  top_set_weight numeric not null,
  top_set_reps integer not null,
  backoff_weight numeric not null,
  backoff_reps integer not null,
  notes text,
  tags text[]
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_log_id uuid references public.workout_logs(id) on delete cascade,
  target_user_id uuid references public.profiles(id) on delete cascade,
  reason text not null,
  status text not null default 'open',
  created_at timestamp with time zone default now()
);

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique (blocker_id, blocked_id)
);

alter table public.profiles enable row level security;
alter table public.lifts enable row level security;
alter table public.workout_templates enable row level security;
alter table public.workout_logs enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;

drop policy if exists "Profiles are public" on public.profiles;
drop policy if exists "Users can create their profile" on public.profiles;
drop policy if exists "Users can update their profile" on public.profiles;
drop policy if exists "Lifts public read" on public.lifts;
drop policy if exists "Lifts owner write" on public.lifts;
drop policy if exists "Lifts owner update" on public.lifts;
drop policy if exists "Lifts owner delete" on public.lifts;
drop policy if exists "Templates public read" on public.workout_templates;
drop policy if exists "Templates owner write" on public.workout_templates;
drop policy if exists "Templates owner update" on public.workout_templates;
drop policy if exists "Templates owner delete" on public.workout_templates;
drop policy if exists "Logs public read" on public.workout_logs;
drop policy if exists "Logs owner write" on public.workout_logs;
drop policy if exists "Logs owner update" on public.workout_logs;
drop policy if exists "Logs owner delete" on public.workout_logs;
drop policy if exists "Reports insert" on public.reports;
drop policy if exists "Reports owner read" on public.reports;
drop policy if exists "Blocks owner read" on public.blocks;
drop policy if exists "Blocks owner write" on public.blocks;
drop policy if exists "Blocks owner delete" on public.blocks;

create policy "Profiles are public" on public.profiles
  for select using (true);

create policy "Users can create their profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Lifts public read" on public.lifts
  for select using (true);

create policy "Lifts owner write" on public.lifts
  for insert with check (auth.uid() = user_id);

create policy "Lifts owner update" on public.lifts
  for update using (auth.uid() = user_id);

create policy "Lifts owner delete" on public.lifts
  for delete using (auth.uid() = user_id);

create policy "Templates public read" on public.workout_templates
  for select using (true);

create policy "Templates owner write" on public.workout_templates
  for insert with check (auth.uid() = user_id);

create policy "Templates owner update" on public.workout_templates
  for update using (auth.uid() = user_id);

create policy "Templates owner delete" on public.workout_templates
  for delete using (auth.uid() = user_id);

create policy "Logs public read" on public.workout_logs
  for select using (true);

create policy "Logs owner write" on public.workout_logs
  for insert with check (auth.uid() = user_id);

create policy "Logs owner update" on public.workout_logs
  for update using (auth.uid() = user_id);

create policy "Logs owner delete" on public.workout_logs
  for delete using (auth.uid() = user_id);

create policy "Reports insert" on public.reports
  for insert with check (auth.uid() = reporter_id);

create policy "Reports owner read" on public.reports
  for select using (auth.uid() = reporter_id);

create policy "Blocks owner read" on public.blocks
  for select using (auth.uid() = blocker_id);

create policy "Blocks owner write" on public.blocks
  for insert with check (auth.uid() = blocker_id);

create policy "Blocks owner delete" on public.blocks
  for delete using (auth.uid() = blocker_id);
