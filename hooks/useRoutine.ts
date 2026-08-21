import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  getEntryForDate,
  getTodayEntry,
  getUserEntriesRange,
  getUserHistory,
  submitEntry,
  upsertEntry,
} from '@/lib/api';
import { listMissedDays } from '@/lib/sadhanaStats';
import type { RoutineFormData } from '@/types';

export function useTodayEntry(userId: string | undefined) {
  return useQuery({
    queryKey: ['todayEntry', userId],
    queryFn: () => getTodayEntry(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60,
  });
}

export function useEntryForDate(userId: string | undefined, date: string | undefined) {
  return useQuery({
    queryKey: ['entry', userId, date],
    queryFn: () => getEntryForDate(userId!, date!),
    enabled: !!userId && !!date,
    staleTime: 1000 * 30,
  });
}

export function useUpsertEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      date,
      data,
    }: {
      userId: string;
      date: string;
      data: Partial<RoutineFormData>;
    }) => upsertEntry(userId, date, data),
    onSuccess: (updatedEntry, { userId, date }) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      queryClient.setQueryData(['entry', userId, date], updatedEntry);
      if (date === today) queryClient.setQueryData(['todayEntry', userId], updatedEntry);
      queryClient.invalidateQueries({ queryKey: ['missedDays', userId] });
      queryClient.invalidateQueries({ queryKey: ['userHistoryPage', userId] });
      queryClient.invalidateQueries({ queryKey: ['userEntriesRange', userId] });
    },
  });
}

export function useSubmitEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId }: { entryId: string; userId: string }) =>
      submitEntry(entryId),
    onSuccess: (updatedEntry, { userId }) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      queryClient.setQueryData(['entry', userId, updatedEntry.date], updatedEntry);
      if (updatedEntry.date === today) {
        queryClient.setQueryData(['todayEntry', userId], updatedEntry);
      }
      queryClient.invalidateQueries({ queryKey: ['userHistory', userId] });
      queryClient.invalidateQueries({ queryKey: ['userHistoryPage', userId] });
      queryClient.invalidateQueries({ queryKey: ['userEntriesRange', userId] });
      queryClient.invalidateQueries({ queryKey: ['missedDays', userId] });
    },
  });
}

export function useUserHistory(userId: string | undefined) {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['userHistory', userId, today],
    queryFn: async () => {
      if (!userId) return { entries: [], hasMore: false };
      let page = 0;
      const allEntries = [];
      let hasMore = true;

      // Load first page only; infinite scroll handled by component
      const result = await getUserHistory(userId, page);
      return result;
    },
    enabled: !!userId,
  });
}

export function useUserHistoryPaginated(userId: string | undefined, page: number) {
  return useQuery({
    queryKey: ['userHistoryPage', userId, page],
    queryFn: () => getUserHistory(userId!, page),
    enabled: !!userId,
  });
}

export function useUserEntriesRange(
  userId: string | undefined,
  from: string,
  to: string
) {
  return useQuery({
    queryKey: ['userEntriesRange', userId, from, to],
    queryFn: () => getUserEntriesRange(userId!, from, to),
    enabled: !!userId && !!from && !!to,
    staleTime: 1000 * 60,
  });
}

export function useMissedDays(
  userId: string | undefined,
  from: string | undefined,
  to: string | undefined
) {
  return useQuery({
    queryKey: ['missedDays', userId, from, to],
    queryFn: async () => {
      const entries = await getUserEntriesRange(userId!, from!, to!);
      return listMissedDays(from!, to!, entries);
    },
    enabled: !!userId && !!from && !!to,
    staleTime: 1000 * 30,
  });
}
