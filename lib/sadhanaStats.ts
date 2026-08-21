import {
  addDays,
  addMonths,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';
import type { RoutineEntry } from '@/types';

export type CompareGrain = 'day' | 'month' | 'year';

export type SadhanaTotals = {
  key: string;
  label: string;
  days: number;
  rounds: number;
  read: number;
  hear: number;
  chant: number;
  till730: number;
  rest: number;
};

const EMPTY = {
  days: 0,
  rounds: 0,
  read: 0,
  hear: 0,
  chant: 0,
  till730: 0,
  rest: 0,
};

export function fmtMinutes(n: number) {
  if (!n) return '0m';
  if (n < 60) return `${n}m`;
  const hours = Math.floor(n / 60);
  const mins = n % 60;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

function addEntry(row: SadhanaTotals, entry: RoutineEntry) {
  row.days += 1;
  row.rounds += entry.total_rounds ?? 0;
  row.read += entry.read_minutes ?? 0;
  row.hear += entry.hear_minutes ?? 0;
  row.chant += entry.chant_before_ma ?? 0;
  row.till730 += entry.rounds_till_730 ?? 0;
  row.rest += entry.day_rest_minutes ?? 0;
}

function bucketKey(date: string, grain: CompareGrain) {
  if (grain === 'day') return date;
  if (grain === 'month') return date.slice(0, 7);
  return date.slice(0, 4);
}

function bucketLabel(key: string, grain: CompareGrain) {
  if (grain === 'day') return format(parseISO(key), 'EEE dd/MM');
  if (grain === 'month') return format(parseISO(`${key}-01`), 'MMM yyyy');
  return key;
}

export function sumEntries(entries: RoutineEntry[], key: string, label: string): SadhanaTotals {
  const row: SadhanaTotals = { key, label, ...EMPTY };
  for (const entry of entries) addEntry(row, entry);
  return row;
}

export function groupEntries(entries: RoutineEntry[], grain: CompareGrain): SadhanaTotals[] {
  const map = new Map<string, SadhanaTotals>();
  for (const entry of entries) {
    const key = bucketKey(entry.date, grain);
    let row = map.get(key);
    if (!row) {
      row = { key, label: bucketLabel(key, grain), ...EMPTY };
      map.set(key, row);
    }
    addEntry(row, entry);
  }
  return [...map.values()].sort((a, b) => b.key.localeCompare(a.key));
}

export function inRange(entries: RoutineEntry[], from: string, to: string) {
  return entries.filter((entry) => entry.date >= from && entry.date <= to);
}

export type MissedDay = { date: string; isDraft: boolean };

export function listMissedDays(
  from: string,
  to: string,
  entries: RoutineEntry[]
): MissedDay[] {
  const submitted = new Set(
    entries.filter((entry) => entry.status === 'submitted').map((entry) => entry.date)
  );
  const drafts = new Set(
    entries.filter((entry) => entry.status !== 'submitted').map((entry) => entry.date)
  );
  const days = eachDayOfInterval({ start: parseISO(from), end: parseISO(to) });
  const missed: MissedDay[] = [];
  for (let i = days.length - 1; i >= 0; i -= 1) {
    const date = format(days[i], 'yyyy-MM-dd');
    if (submitted.has(date)) continue;
    missed.push({ date, isDraft: drafts.has(date) });
  }
  return missed;
}

export function compareWindow(anchor: Date, grain: CompareGrain) {
  if (grain === 'day') {
    const currentStart = startOfWeek(anchor, { weekStartsOn: 1 });
    const currentEnd = endOfWeek(anchor, { weekStartsOn: 1 });
    const prevStart = addDays(currentStart, -7);
    const prevEnd = addDays(currentEnd, -7);
    return {
      title: `${format(currentStart, 'dd MMM')} – ${format(currentEnd, 'dd MMM yyyy')}`,
      current: {
        from: format(currentStart, 'yyyy-MM-dd'),
        to: format(currentEnd, 'yyyy-MM-dd'),
        label: 'This week',
      },
      previous: {
        from: format(prevStart, 'yyyy-MM-dd'),
        to: format(prevEnd, 'yyyy-MM-dd'),
        label: 'Last week',
      },
      fetchFrom: format(prevStart, 'yyyy-MM-dd'),
      fetchTo: format(currentEnd, 'yyyy-MM-dd'),
      listGrain: 'day' as const,
    };
  }

  if (grain === 'month') {
    const currentStart = startOfMonth(anchor);
    const currentEnd = endOfMonth(anchor);
    const prevStart = startOfMonth(addMonths(anchor, -1));
    const prevEnd = endOfMonth(addMonths(anchor, -1));
    return {
      title: format(anchor, 'MMMM yyyy'),
      current: {
        from: format(currentStart, 'yyyy-MM-dd'),
        to: format(currentEnd, 'yyyy-MM-dd'),
        label: format(anchor, 'MMM yyyy'),
      },
      previous: {
        from: format(prevStart, 'yyyy-MM-dd'),
        to: format(prevEnd, 'yyyy-MM-dd'),
        label: format(addMonths(anchor, -1), 'MMM yyyy'),
      },
      fetchFrom: format(prevStart, 'yyyy-MM-dd'),
      fetchTo: format(currentEnd, 'yyyy-MM-dd'),
      listGrain: 'day' as const,
    };
  }

  const currentStart = startOfYear(anchor);
  const currentEnd = endOfYear(anchor);
  const prevStart = startOfYear(addYears(anchor, -1));
  const prevEnd = endOfYear(addYears(anchor, -1));
  return {
    title: format(anchor, 'yyyy'),
    current: {
      from: format(currentStart, 'yyyy-MM-dd'),
      to: format(currentEnd, 'yyyy-MM-dd'),
      label: format(anchor, 'yyyy'),
    },
    previous: {
      from: format(prevStart, 'yyyy-MM-dd'),
      to: format(prevEnd, 'yyyy-MM-dd'),
      label: format(addYears(anchor, -1), 'yyyy'),
    },
    fetchFrom: format(prevStart, 'yyyy-MM-dd'),
    fetchTo: format(currentEnd, 'yyyy-MM-dd'),
    listGrain: 'month' as const,
  };
}
