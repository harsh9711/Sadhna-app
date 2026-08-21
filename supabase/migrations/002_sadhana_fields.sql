-- Replace the generic health parameters with sadhana-card parameters.
-- Destructive: drops old columns and their data.

alter table public.routine_entries
  add column if not exists chant_before_ma integer check (chant_before_ma between 0 and 108),
  add column if not exists rounds_till_730 integer check (rounds_till_730 between 0 and 108),
  add column if not exists last_round_time text,
  add column if not exists total_rounds integer check (total_rounds between 0 and 108),
  add column if not exists read_minutes integer check (read_minutes between 0 and 1440),
  add column if not exists book text,
  add column if not exists hear_minutes integer check (hear_minutes between 0 and 1440),
  add column if not exists speaker text,
  add column if not exists topic text,
  add column if not exists slept_at text,
  add column if not exists day_rest_minutes integer check (day_rest_minutes between 0 and 1440);

-- Free-form entry like "3:30am" instead of a strict time value.
alter table public.routine_entries
  alter column wake_time type text using wake_time::text;

alter table public.routine_entries
  drop column if exists sleep_hours,
  drop column if exists breakfast,
  drop column if exists lunch,
  drop column if exists dinner,
  drop column if exists exercise,
  drop column if exists exercise_minutes,
  drop column if exists water_glasses,
  drop column if exists mood,
  drop column if exists notes;
