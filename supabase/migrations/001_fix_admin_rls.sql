-- Run this if you already applied an older schema.sql without public.is_admin().
-- Safe to run on fresh installs too.

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

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "Admins can read all entries" on public.routine_entries;
create policy "Admins can read all entries"
  on public.routine_entries for select
  using (public.is_admin());
