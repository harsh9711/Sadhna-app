-- Bootstrap script for a BRAND-NEW Supabase project only.
-- On a database that already has these tables it fails with 42P07 "already exists";
-- apply the files in supabase/migrations/ instead.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  employee_code text unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Routine entries
create table public.routine_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  chant_before_ma integer check (chant_before_ma between 0 and 108),
  rounds_till_730 integer check (rounds_till_730 between 0 and 108),
  last_round_time text,
  total_rounds integer check (total_rounds between 0 and 108),
  read_minutes integer check (read_minutes between 0 and 1440),
  book text,
  hear_minutes integer check (hear_minutes between 0 and 1440),
  speaker text,
  topic text,
  slept_at text,
  wake_time text,
  day_rest_minutes integer check (day_rest_minutes between 0 and 1440),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint one_entry_per_day unique (user_id, date)
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger routine_entries_updated_at
  before update on public.routine_entries
  for each row execute function update_updated_at();

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'user'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS helper (avoids infinite recursion on profiles policies)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.routine_entries enable row level security;

-- Profiles policies
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
  );

-- Entry policies
create policy "Users can manage own entries"
  on public.routine_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins can read all entries"
  on public.routine_entries for select
  using (public.is_admin());

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

create policy "Users can read own reminders"
  on public.reminders for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can mark own reminders read"
  on public.reminders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins can insert reminders"
  on public.reminders for insert
  with check (public.is_admin());
