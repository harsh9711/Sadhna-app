import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  getAllUsers,
  getAdminStats,
  getMissedUsers,
  getRecentSubmissions,
  getUsersComparison,
} from '@/lib/api';

export function useAdminStats(date?: string) {
  const targetDate = date ?? format(new Date(), 'yyyy-MM-dd');
  return useQuery({
    queryKey: ['adminStats', targetDate],
    queryFn: () => getAdminStats(targetDate),
    staleTime: 1000 * 30,
  });
}

export function useRecentSubmissions() {
  return useQuery({
    queryKey: ['recentSubmissions'],
    queryFn: () => getRecentSubmissions(10),
    staleTime: 1000 * 30,
  });
}

export function useAllUsers(search: string, page: number) {
  return useQuery({
    queryKey: ['adminUsers', search, page],
    queryFn: () => getAllUsers(search, page),
    staleTime: 1000 * 60,
  });
}

export function useUsersComparison(date: string) {
  return useQuery({
    queryKey: ['usersComparison', date],
    queryFn: () => getUsersComparison(date),
    staleTime: 1000 * 30,
  });
}

export function useMissedUsers(from: string, to: string, enabled: boolean) {
  return useQuery({
    queryKey: ['adminMissedUsers', from, to],
    queryFn: () => getMissedUsers(from, to),
    enabled: enabled && !!from && !!to,
    staleTime: 1000 * 30,
  });
}
