-- Strength Progression tables
-- Four new tables for exercise library, sessions, sets, and AI recommendations

-- strength_exercises: exercise library
create table if not exists strength_exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('power', 'squat', 'hinge', 'push', 'pull', 'accessory')),
  default_sets int not null default 3,
  default_reps int not null default 5,
  default_scheme text not null default '3x5',
  created_at timestamptz default now()
);

-- strength_sessions: a single workout session
create table if not exists strength_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  date date not null default current_date,
  notes text,
  created_at timestamptz default now()
);

-- strength_sets: individual sets within a session
create table if not exists strength_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references strength_sessions on delete cascade,
  exercise_id uuid references strength_exercises on delete cascade,
  set_number int not null,
  reps int not null,
  weight_lbs numeric not null,
  completed boolean not null default true,
  created_at timestamptz default now()
);

-- strength_recommendations: TimTam writes here, app reads here
create table if not exists strength_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  exercise_id uuid references strength_exercises on delete cascade,
  recommended_weight_lbs numeric not null,
  recommended_sets int not null default 3,
  recommended_reps int not null default 5,
  reasoning text,
  generated_at timestamptz default now(),
  unique(user_id, exercise_id)
);

-- Seed: William's program
insert into strength_exercises (name, category, default_sets, default_reps, default_scheme) values
  ('Clean', 'power', 3, 3, '3x3'),
  ('Squat', 'squat', 3, 5, '3x5'),
  ('Bench', 'push', 3, 5, '3x5'),
  ('OHP', 'push', 3, 5, '3x5'),
  ('Pull-up', 'pull', 3, 5, '3x5'),
  ('Romanian Deadlift', 'hinge', 3, 8, '3x8'),
  ('Pendlay Row', 'pull', 3, 8, '3x8'),
  ('Face Pull', 'accessory', 3, 20, '3x20')
on conflict do nothing;

-- RLS policies
alter table strength_sessions enable row level security;
alter table strength_sets enable row level security;
alter table strength_recommendations enable row level security;

create policy "Users manage own sessions" on strength_sessions for all using (auth.uid() = user_id);
create policy "Users manage own sets" on strength_sets for all using (
  session_id in (select id from strength_sessions where user_id = auth.uid())
);
create policy "Users read own recommendations" on strength_recommendations for select using (auth.uid() = user_id);
