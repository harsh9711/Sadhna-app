# Day Routine App

A React Native (Expo) + Supabase app for tracking daily health routines.

## Stack
- Expo SDK 51 + Expo Router (file-based routing)
- TypeScript
- Supabase (Auth + Postgres + RLS)
- NativeWind v4 (Tailwind CSS for React Native)
- React Query v5

---

## Setup

### 1. Supabase Project

1. Go to https://supabase.com and create a new project.
2. Navigate to **SQL Editor** and run the contents of `supabase/schema.sql`.
3. If you already ran an older schema, also run `supabase/migrations/001_fix_admin_rls.sql`.
4. (Optional) See `supabase/seed.sql` to promote a user to admin.

### 2. Create Admin User

1. Go to **Authentication > Users** in your Supabase dashboard.
2. Click **Add user** and create an account.
3. Copy that user's UUID.
4. In the SQL Editor, run:
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE id = 'PASTE_UUID_HERE';
   ```

### 3. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials (found in **Project Settings > API**):

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the App

```bash
# Start Expo dev server
npm start

# Or target a platform directly
npm run ios
npm run android
npm run web
```

---

## Features

### User Role
- Login / register with email + password
- Fill out daily routine form (wake time, sleep, meals, exercise, water, mood, notes)
- Draft auto-saved on field change (1s debounce)
- Explicit Submit button — one submission per day
- History screen with paginated past entries
- Profile screen with sign out

### Admin Role
- Dashboard with today's stats: total users, submitted count, missing count, submission rate
- Recent submissions list
- Entries screen: filter by date range and status, export filtered entries as CSV
- Users screen: search users, tap to view last 7 days of entries

---

## Project Structure

```
app/
  _layout.tsx         Root layout (QueryClient + AuthProvider)
  index.tsx           Auth-gated redirect
  (auth)/             Login and register screens
  (user)/             User tab navigator (Today, History, Profile)
  (admin)/            Admin tab navigator (Dashboard, Entries, Users)
components/           Shared UI components
context/              AuthContext
hooks/                React Query hooks
lib/                  Supabase client + API functions
types/                Shared TypeScript types
supabase/             SQL schema and seed
```
