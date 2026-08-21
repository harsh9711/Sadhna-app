import React, { useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, max as maxDate, parseISO, subDays } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useMissedDays } from '@/hooks/useRoutine';
import { getMyReminders, markRemindersRead } from '@/lib/api';
import SadhanaEditor from '@/components/SadhanaEditor';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { MissedDay } from '@/lib/sadhanaStats';

const LOOKBACK_DAYS = 90;

export default function MissedScreen() {
  const { user, profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { from, to } = useMemo(() => {
    const yesterday = subDays(new Date(), 1);
    const joined = profile?.created_at ? parseISO(profile.created_at) : subDays(new Date(), LOOKBACK_DAYS);
    const start = maxDate([subDays(new Date(), LOOKBACK_DAYS), joined]);
    if (start > yesterday) {
      return { from: undefined, to: undefined };
    }
    return {
      from: format(start, 'yyyy-MM-dd'),
      to: format(yesterday, 'yyyy-MM-dd'),
    };
  }, [profile?.created_at]);

  const { data, isLoading, refetch, isFetching } = useMissedDays(user?.id, from, to);
  const missed = data ?? [];
  const remindersQuery = useQuery({
    queryKey: ['myReminders', user?.id],
    queryFn: () => getMyReminders(user!.id),
    enabled: !!user?.id,
  });
  const unread = (remindersQuery.data ?? []).filter((r) => !r.read_at);

  React.useEffect(() => {
    if (!user?.id || unread.length === 0) return;
    markRemindersRead(user.id).catch(() => {});
  }, [user?.id, unread.length]);

  if (selectedDate) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <SadhanaEditor
          date={selectedDate}
          title="Fill missed sadhana"
          backLabel="← Back to missed days"
          onBack={() => setSelectedDate(null)}
          onSubmitted={() => setSelectedDate(null)}
        />
      </SafeAreaView>
    );
  }

  if (isLoading) return <LoadingSpinner message="Finding missed days..." />;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900">Missed Sadhana</Text>
        <Text className="text-gray-500 text-sm mt-0.5">
          {missed.length
            ? `${missed.length} day${missed.length === 1 ? '' : 's'} still to fill`
            : 'All caught up'}
        </Text>
      </View>

      {unread.length > 0 ? (
        <View className="mx-4 mb-1 bg-amber-50 border border-amber-100 rounded-2xl p-3">
          <Text className="text-xs font-semibold text-amber-800 uppercase mb-1">Admin reminder</Text>
          <Text className="text-sm text-amber-900">{unread[0].message}</Text>
        </View>
      ) : null}

      <FlatList
        data={missed}
        keyExtractor={(item) => item.date}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => {
              refetch();
              remindersQuery.refetch();
            }}
          />
        }
        renderItem={({ item }) => <MissedRow day={item} onPress={() => setSelectedDate(item.date)} />}
        ListEmptyComponent={
          <View className="items-center justify-center pt-20">
            <Text className="text-5xl mb-4">🌿</Text>
            <Text className="text-gray-500 text-base font-medium">No missed days</Text>
            <Text className="text-gray-400 text-sm mt-1 text-center px-8">
              Srila Prabhupada is pleased — keep filling today's sadhana
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function MissedRow({ day, onPress }: { day: MissedDay; onPress: () => void }) {
  let label = day.date;
  try {
    label = format(parseISO(day.date), 'EEEE, dd/MM/yyyy');
  } catch {
    // keep raw
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 flex-row items-center"
    >
      <View className="w-10 h-10 rounded-xl bg-amber-50 items-center justify-center mr-3">
        <Ionicons name="alert-circle-outline" size={20} color="#d97706" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-800">{label}</Text>
        <Text className="text-xs text-gray-400 mt-0.5">
          {day.isDraft ? 'Draft started — tap to finish' : "Tap to fill this day's sadhana"}
        </Text>
      </View>
      <View
        className={`px-2.5 py-1 rounded-full ${day.isDraft ? 'bg-yellow-100' : 'bg-rose-50'}`}
      >
        <Text
          className={`text-xs font-semibold ${day.isDraft ? 'text-yellow-700' : 'text-rose-600'}`}
        >
          {day.isDraft ? 'Draft' : 'Empty'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
