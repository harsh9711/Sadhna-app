import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, parseISO, subDays } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useMissedUsers } from '@/hooks/useAdmin';
import { createReminders, type MissedUserRow } from '@/lib/api';
import { sendMissedPushes } from '@/lib/notifications';

function isYmd(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function formatDates(dates: string[]) {
  const shown = dates.slice(0, 4).map((d) => {
    try {
      return format(parseISO(d), 'dd MMM');
    } catch {
      return d;
    }
  });
  const extra = dates.length > 4 ? ` +${dates.length - 4}` : '';
  return shown.join(', ') + extra;
}

function reminderMessage(dates: string[]) {
  if (dates.length === 1) {
    return `Please fill your missed sadhana for ${formatDates(dates)}. Hare Krishna.`;
  }
  return `Please fill ${dates.length} missed sadhana days (${formatDates(dates)}). Hare Krishna.`;
}

export default function AdminMissedScreen() {
  const { user } = useAuth();
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const [fromDate, setFromDate] = useState(yesterday);
  const [toDate, setToDate] = useState(yesterday);
  const [range, setRange] = useState<{ from: string; to: string } | null>({
    from: yesterday,
    to: yesterday,
  });
  const [busyId, setBusyId] = useState<string | 'all' | null>(null);

  const { data, isLoading, isFetching, refetch } = useMissedUsers(
    range?.from ?? '',
    range?.to ?? '',
    !!range
  );
  const rows = data ?? [];

  function fetchDates() {
    if (!isYmd(fromDate) || !isYmd(toDate)) {
      Alert.alert('Dates', 'Use YYYY-MM-DD for both dates.');
      return;
    }
    setRange(fromDate <= toDate ? { from: fromDate, to: toDate } : { from: toDate, to: fromDate });
  }

  async function remind(targets: MissedUserRow[]) {
    if (!user || !targets.length) return;
    const key = targets.length === 1 ? targets[0].user.id : 'all';
    setBusyId(key);
    try {
      const payload = targets.map((row) => {
        const dates = row.missed.map((d) => d.date);
        return {
          user_id: row.user.id,
          missed_dates: dates,
          message: reminderMessage(dates),
          token: row.user.expo_push_token,
        };
      });
      await createReminders(
        payload.map(({ user_id, missed_dates, message }) => ({ user_id, missed_dates, message })),
        user.id
      );
      const push = await sendMissedPushes(
        payload.map((p) => ({
          token: p.token,
          title: 'Missed sadhana',
          body: p.message,
        }))
      );
      Alert.alert(
        'Reminder sent',
        `${payload.length} user${payload.length === 1 ? '' : 's'} notified in-app` +
          (push.sent ? `, ${push.sent} push${push.sent === 1 ? '' : 'es'} sent` : '') +
          (push.skipped ? `. ${push.skipped} had no notification permission yet.` : '.')
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/does not exist|schema cache|reminders/i.test(message)) {
        Alert.alert(
          'Database',
          'Run supabase/migrations/003_reminders.sql in the Supabase SQL editor, then try again.'
        );
      } else {
        Alert.alert('Could not remind', message);
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-2xl font-bold text-gray-900">Missed</Text>
            <Text className="text-gray-500 text-sm mt-0.5">
              {range
                ? `${rows.length} user${rows.length === 1 ? '' : 's'} still to fill`
                : 'Pick dates and fetch'}
            </Text>
          </View>
          {rows.length > 0 ? (
            <TouchableOpacity
              onPress={() => remind(rows)}
              disabled={busyId !== null}
              className="flex-row items-center bg-amber-100 rounded-xl px-3 py-2"
              activeOpacity={0.7}
            >
              {busyId === 'all' ? (
                <ActivityIndicator size="small" color="#b45309" />
              ) : (
                <Ionicons name="notifications-outline" size={16} color="#b45309" />
              )}
              <Text className="text-amber-800 text-xs font-semibold ml-1.5">Remind all</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View className="bg-white rounded-2xl border border-gray-100 p-3 mt-3">
          <View className="flex-row gap-2 mb-2">
            <TextInput
              className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-sm text-gray-800"
              placeholder="From (YYYY-MM-DD)"
              placeholderTextColor="#9ca3af"
              value={fromDate}
              onChangeText={setFromDate}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
            <TextInput
              className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-sm text-gray-800"
              placeholder="To (YYYY-MM-DD)"
              placeholderTextColor="#9ca3af"
              value={toDate}
              onChangeText={setToDate}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
          </View>
          <TouchableOpacity
            onPress={fetchDates}
            className="bg-purple-500 rounded-xl py-2.5 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-white text-sm font-semibold">
              {isFetching ? 'Fetching…' : 'Fetch'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#7c3aed" />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.user.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshing={isFetching}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
              <View className="flex-row items-center">
                <View className="flex-1 pr-2">
                  <Text className="text-base font-semibold text-gray-800">{item.user.name}</Text>
                  {item.user.employee_code ? (
                    <Text className="text-xs text-gray-400 mt-0.5">{item.user.employee_code}</Text>
                  ) : null}
                  <Text className="text-sm text-rose-600 mt-1">
                    {item.missed.length} day{item.missed.length === 1 ? '' : 's'}:{' '}
                    {formatDates(item.missed.map((d) => d.date))}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => remind([item])}
                  disabled={busyId !== null}
                  className="flex-row items-center bg-amber-50 rounded-xl px-3 py-2"
                  activeOpacity={0.7}
                >
                  {busyId === item.user.id ? (
                    <ActivityIndicator size="small" color="#b45309" />
                  ) : (
                    <Ionicons name="notifications-outline" size={16} color="#b45309" />
                  )}
                  <Text className="text-amber-800 text-xs font-semibold ml-1">Remind</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center pt-16">
              <Text className="text-5xl mb-3">🌿</Text>
              <Text className="text-gray-500 font-medium">No missed users</Text>
              <Text className="text-gray-400 text-sm mt-1">Everyone filled this range</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
