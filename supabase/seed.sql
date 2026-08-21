-- Run AFTER creating an admin user via Supabase Auth dashboard.
-- Replace YOUR_UUID with the user's id from Authentication > Users.

-- UPDATE public.profiles
--   SET role = 'admin'
--   WHERE id = 'YOUR_UUID';

-- Optional: assign employee codes after users sign up
-- UPDATE public.profiles SET employee_code = 'EMP-001' WHERE name = 'Test User';
