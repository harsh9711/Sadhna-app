-- Reminders from admin to users who missed sadhana, plus Expo push tokens.

alter table public.profiles
  add column if not exists expo_push_token text;

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  missed_dates date[] not null,
  message text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

alter table public.reminders enable row level security;

drop policy if exists "Users can read own reminders" on public.reminders;
create policy "Users can read own reminders"
  on public.reminders for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can mark own reminders read" on public.reminders;
create policy "Users can mark own reminders read"
  on public.reminders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins can insert reminders" on public.reminders;
create policy "Admins can insert reminders"
  on public.reminders for insert
  with check (public.is_admin());
