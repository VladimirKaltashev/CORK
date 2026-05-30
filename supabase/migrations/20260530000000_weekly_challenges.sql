create table public.challenges (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null default '',
  category    text,
  goal_type   text not null default 'count',
  unit        text,
  proof_config jsonb not null default '{"fields": ["text", "photo", "url", "value"], "valueLabel": "прогресс", "valueRequired": false}',
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  status      text not null default 'pending',
  created_by  uuid references public.profiles(id) not null,
  created_at  timestamptz not null default now()
);

create table public.challenge_submissions (
  id           uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.challenges(id) on delete cascade not null,
  user_id      uuid references public.profiles(id) not null,
  proof_type   text not null default 'text',
  proof_value  text not null default '',
  value        numeric,
  description  text not null default '',
  submitted_at timestamptz not null default now()
);

create table public.badges (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) not null,
  type         text not null,
  label        text not null,
  challenge_id uuid references public.challenges(id) on delete set null,
  awarded_at   timestamptz not null default now()
);

create index idx_challenges_status on public.challenges(status);
create index idx_challenge_submissions_challenge on public.challenge_submissions(challenge_id, user_id);
create index idx_badges_user on public.badges(user_id);

-- Enable RLS
alter table public.challenges enable row level security;
alter table public.challenge_submissions enable row level security;
alter table public.badges enable row level security;

-- RLS policies
-- Challenges: anyone can read active/completed, only admins can create
CREATE POLICY "challenges_read_all" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "challenges_insert_admin" ON public.challenges FOR INSERT WITH CHECK (exists(select 1 from public.profiles where id = auth.uid() and is_admin = true));
CREATE POLICY "challenges_update_admin" ON public.challenges FOR UPDATE USING (exists(select 1 from public.profiles where id = auth.uid() and is_admin = true));
CREATE POLICY "challenges_delete_admin" ON public.challenges FOR DELETE USING (exists(select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- Submissions: anyone can read, own user can create, admin can delete
CREATE POLICY "submissions_read_all" ON public.challenge_submissions FOR SELECT USING (true);
CREATE POLICY "submissions_insert_own" ON public.challenge_submissions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "submissions_delete_admin" ON public.challenge_submissions FOR DELETE USING (exists(select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- Badges: anyone can read, only system can create (via triggers or admin)
CREATE POLICY "badges_read_all" ON public.badges FOR SELECT USING (true);
CREATE POLICY "badges_insert_admin" ON public.badges FOR INSERT WITH CHECK (exists(select 1 from public.profiles where id = auth.uid() and is_admin = true));
