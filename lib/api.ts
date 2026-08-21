import { format } from 'date-fns';
import { supabase } from './supabase';
import { listMissedDays, type MissedDay } from './sadhanaStats';
import type {
  AdminEntryRow,
  AdminStats,
  Profile,
  Reminder,
  RoutineEntry,
  RoutineFormData,
  UserComparisonRow,
} from '@/types';

const PAGE_SIZE = 20;

export async function getEntryForDate(
  userId: string,
  date: string
): Promise<RoutineEntry | null> {
  const { data, error } = await supabase
    .from('routine_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as RoutineEntry | null;
}

export async function getTodayEntry(userId: string): Promise<RoutineEntry | null> {
  return getEntryForDate(userId, format(new Date(), 'yyyy-MM-dd'));
}

const NUMBER_FIELDS = [
  'chant_before_ma',
  'rounds_till_730',
  'total_rounds',
  'read_minutes',
  'hear_minutes',
  'day_rest_minutes',
] as const satisfies readonly (keyof RoutineFormData)[];

const TEXT_FIELDS = [
  'last_round_time',
  'book',
  'speaker',
  'topic',
  'slept_at',
  'wake_time',
] as const satisfies readonly (keyof RoutineFormData)[];

export async function upsertEntry(
  userId: string,
  date: string,
  data: Partial<RoutineFormData>
): Promise<RoutineEntry> {
  const payload: Record<string, unknown> = {
    user_id: userId,
    date,
    updated_at: new Date().toISOString(),
  };

  for (const field of NUMBER_FIELDS) {
    const raw = data[field];
    if (raw === undefined) continue;
    const parsed = parseInt(raw, 10);
    if (raw === '' || Number.isNaN(parsed)) {
      payload[field] = null;
      continue;
    }
    const cap = field === 'day_rest_minutes' ? 12 * 60 : Number.POSITIVE_INFINITY;
    payload[field] = Math.min(cap, Math.max(0, parsed));
  }

  for (const field of TEXT_FIELDS) {
    const raw = data[field];
    if (raw === undefined) continue;
    payload[field] = raw.trim() || null;
  }

  const { data: result, error } = await supabase
    .from('routine_entries')
    .upsert(payload, { onConflict: 'user_id,date' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result as RoutineEntry;
}

export async function submitEntry(entryId: string): Promise<RoutineEntry> {
  const { data, error } = await supabase
    .from('routine_entries')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', entryId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as RoutineEntry;
}

export async function getUserEntriesRange(
  userId: string,
  from: string,
  to: string
): Promise<RoutineEntry[]> {
  const { data, error } = await supabase
    .from('routine_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: false })
    .limit(2000);
  if (error) throw new Error(error.message);
  return (data ?? []) as RoutineEntry[];
}

export async function getUserHistory(
  userId: string,
  page: number
): Promise<{ entries: RoutineEntry[]; hasMore: boolean }> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from('routine_entries')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);
  const entries = (data ?? []) as RoutineEntry[];
  return { entries, hasMore: (count ?? 0) > to + 1 };
}

export async function getAllUserEntries(userId: string): Promise<RoutineEntry[]> {
  const all: RoutineEntry[] = [];
  let page = 0;
  for (;;) {
    const { entries, hasMore } = await getUserHistory(userId, page);
    all.push(...entries);
    if (!hasMore) break;
    page += 1;
    if (page > 500) break;
  }
  return all;
}

export async function getEntryById(entryId: string): Promise<RoutineEntry> {
  const { data, error } = await supabase
    .from('routine_entries')
    .select('*')
    .eq('id', entryId)
    .single();
  if (error) throw new Error(error.message);
  return data as RoutineEntry;
}

export async function getAllEntries(filters: {
  from?: string;
  to?: string;
  userId?: string;
  status?: string;
  page: number;
}): Promise<{ entries: AdminEntryRow[]; hasMore: boolean }> {
  const from = filters.page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('routine_entries')
    .select('*, profile:profiles(name, employee_code)', { count: 'exact' })
    .order('date', { ascending: false })
    .range(from, to);

  if (filters.from) query = query.gte('date', filters.from);
  if (filters.to) query = query.lte('date', filters.to);
  if (filters.userId) query = query.eq('user_id', filters.userId);
  if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  const entries = (data ?? []) as AdminEntryRow[];
  return { entries, hasMore: (count ?? 0) > to + 1 };
}

export async function getAdminStats(date: string): Promise<AdminStats> {
  const [usersRes, submittedRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'user').eq('is_active', true),
    supabase
      .from('routine_entries')
      .select('id', { count: 'exact' })
      .eq('date', date)
      .eq('status', 'submitted'),
  ]);

  if (usersRes.error) throw new Error(usersRes.error.message);
  if (submittedRes.error) throw new Error(submittedRes.error.message);

  const total_users = usersRes.count ?? 0;
  const submitted_today = submittedRes.count ?? 0;
  const missing_today = Math.max(0, total_users - submitted_today);
  const submission_rate = total_users > 0 ? (submitted_today / total_users) * 100 : 0;

  return { total_users, submitted_today, missing_today, submission_rate };
}

export async function getAllUsers(
  search: string,
  page: number
): Promise<{ users: Profile[]; hasMore: boolean }> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .eq('role', 'user')
    .order('name')
    .range(from, to);

  if (search.trim()) {
    query = query.or(`name.ilike.%${search}%,employee_code.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  const users = (data ?? []) as Profile[];
  return { users, hasMore: (count ?? 0) > to + 1 };
}

export async function getUsersComparison(date: string): Promise<UserComparisonRow[]> {
  const [usersRes, entriesRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('role', 'user').order('name'),
    supabase.from('routine_entries').select('*').eq('date', date),
  ]);

  if (usersRes.error) throw new Error(usersRes.error.message);
  if (entriesRes.error) throw new Error(entriesRes.error.message);

  const users = (usersRes.data ?? []) as Profile[];
  const entries = (entriesRes.data ?? []) as RoutineEntry[];
  const byUser = new Map(entries.map((entry) => [entry.user_id, entry]));

  return users.map((user) => ({
    user,
    entry: byUser.get(user.id) ?? null,
  }));
}

export async function getRecentSubmissions(limit = 10): Promise<AdminEntryRow[]> {
  const { data, error } = await supabase
    .from('routine_entries')
    .select('*, profile:profiles(name, employee_code)')
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as AdminEntryRow[];
}

export function buildCsvFromEntries(entries: AdminEntryRow[]): string {
  const headers = [
    'Date',
    'User',
    'Employee Code',
    'Status',
    'Chant B4 MA',
    'Till 7:30 am',
    'Last Round',
    'Total Rounds',
    'Read (min)',
    'Book',
    'Hear (min)',
    'Speaker',
    'Topic',
    'Slept At',
    'Wake Up',
    'Day Rest (min)',
    'Submitted At',
  ];

  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = entries.map((e) => [
    escape(e.date),
    escape(e.profile?.name),
    escape(e.profile?.employee_code),
    escape(e.status),
    escape(e.chant_before_ma),
    escape(e.rounds_till_730),
    escape(e.last_round_time),
    escape(e.total_rounds),
    escape(e.read_minutes),
    escape(e.book),
    escape(e.hear_minutes),
    escape(e.speaker),
    escape(e.topic),
    escape(e.slept_at),
    escape(e.wake_time),
    escape(e.day_rest_minutes),
    escape(e.submitted_at),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export type MissedUserRow = {
  user: Profile;
  missed: MissedDay[];
};

export async function getMissedUsers(from: string, to: string): Promise<MissedUserRow[]> {
  const [usersRes, entriesRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('role', 'user').eq('is_active', true).order('name'),
    supabase
      .from('routine_entries')
      .select('user_id, date, status')
      .gte('date', from)
      .lte('date', to)
      .limit(5000),
  ]);
  if (usersRes.error) throw new Error(usersRes.error.message);
  if (entriesRes.error) throw new Error(entriesRes.error.message);

  const byUser = new Map<string, RoutineEntry[]>();
  for (const row of (entriesRes.data ?? []) as Pick<RoutineEntry, 'user_id' | 'date' | 'status'>[]) {
    const list = byUser.get(row.user_id) ?? [];
    list.push(row as RoutineEntry);
    byUser.set(row.user_id, list);
  }

  const result: MissedUserRow[] = [];
  for (const user of (usersRes.data ?? []) as Profile[]) {
    const joined = user.created_at.slice(0, 10);
    const start = joined > from ? joined : from;
    if (start > to) continue;
    const missed = listMissedDays(start, to, byUser.get(user.id) ?? []);
    if (missed.length) result.push({ user, missed });
  }
  return result;
}

export async function savePushToken(userId: string, token: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ expo_push_token: token }).eq('id', userId);
  if (error) throw new Error(error.message);
}

export async function getMyReminders(userId: string): Promise<Reminder[]> {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []) as Reminder[];
}

export async function markRemindersRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('reminders')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);
  if (error) throw new Error(error.message);
}

export async function createReminders(
  rows: { user_id: string; missed_dates: string[]; message: string }[],
  createdBy: string
): Promise<void> {
  if (!rows.length) return;
  const { error } = await supabase.from('reminders').insert(
    rows.map((row) => ({
      ...row,
      created_by: createdBy,
    }))
  );
  if (error) throw new Error(error.message);
}
