import React, { useMemo, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';
import { useAllUsers } from '@/hooks/useAdmin';
import { useUserEntriesRange } from '@/hooks/useRoutine';
import { getAllUserEntries } from '@/lib/api';
import { buildSadhanaCsv, sadhanaCsvFilename, saveSadhanaFile } from '@/lib/sadhanaExport';
import { fmtMinutes, sumEntries } from '@/lib/sadhanaStats';
import RoutineDetailCard from '@/components/RoutineDetailCard';
import UsersCompareView from '@/components/UsersCompareView';
import type { Profile } from '@/types';

function UserCard({
  user,
  onPress,
}: {
  user: Profile;
  onPress: () => void;
}) {
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 flex-row items-center"
    >
      <View className="w-12 h-12 rounded-full bg-purple-100 items-center justify-center mr-3">
        <Text className="text-purple-700 font-bold">{initials}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-800">{user.name}</Text>
        {user.employee_code ? (
          <Text className="text-sm text-gray-500">{user.employee_code}</Text>
        ) : null}
      </View>
      <View
        className={`px-2.5 py-1 rounded-full mr-2 ${
          user.is_active ? 'bg-green-100' : 'bg-red-100'
        }`}
      >
        <Text
          className={`text-xs font-semibold ${
            user.is_active ? 'text-green-700' : 'text-red-700'
          }`}
        >
          {user.is_active ? 'Active' : 'Inactive'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
    </TouchableOpacity>
  );
}

function isYmd(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

const ymd = (date: Date) => format(date, 'yyyy-MM-dd');

const PRESETS = [
  { id: 'today', label: 'Today', build: () => ({ from: ymd(new Date()), to: ymd(new Date()) }) },
  {
    id: 'week',
    label: 'This week',
    build: () => ({
      from: ymd(startOfWeek(new Date(), { weekStartsOn: 1 })),
      to: ymd(endOfWeek(new Date(), { weekStartsOn: 1 })),
    }),
  },
  {
    id: 'month',
    label: 'This month',
    build: () => ({ from: ymd(startOfMonth(new Date())), to: ymd(endOfMonth(new Date())) }),
  },
  {
    id: 'year',
    label: 'This year',
    build: () => ({ from: ymd(startOfYear(new Date())), to: ymd(endOfYear(new Date())) }),
  },
] as const;

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-base font-bold text-gray-900">{value}</Text>
      <Text className="text-[11px] text-gray-400 mt-0.5">{label}</Text>
    </View>
  );
}

function UserDetail({ user, onBack }: { user: Profile; onBack: () => void }) {
  const [preset, setPreset] = useState<string | null>('month');
  const [range, setRange] = useState(() => PRESETS[2].build());
  const [fromDate, setFromDate] = useState(range.from);
  const [toDate, setToDate] = useState(range.to);
  const [exporting, setExporting] = useState(false);

  const { data: ranged, isLoading, isFetching } = useUserEntriesRange(
    user.id,
    range.from,
    range.to
  );
  const entries = ranged ?? [];
  const totals = useMemo(() => sumEntries(entries, 'range', 'Range'), [entries]);

  function applyPreset(item: (typeof PRESETS)[number]) {
    const next = item.build();
    setPreset(item.id);
    setRange(next);
    setFromDate(next.from);
    setToDate(next.to);
  }

  function fetchDates() {
    if (!isYmd(fromDate) || !isYmd(toDate)) {
      Alert.alert('Dates', 'Use YYYY-MM-DD for both dates.');
      return;
    }
    setPreset(null);
    setRange(
      fromDate > toDate ? { from: toDate, to: fromDate } : { from: fromDate, to: toDate }
    );
  }

  async function handleExportCsv() {
    if (exporting) return;
    setExporting(true);
    try {
      const all = await getAllUserEntries(user.id);
      if (all.length === 0) {
        Alert.alert('Nothing to download', 'This user has no sadhana yet.');
        return;
      }
      const result = await saveSadhanaFile(buildSadhanaCsv(all), sadhanaCsvFilename(user.name));
      if (result === 'cancelled') return;
      if (result === 'saved') {
        Alert.alert('Saved', `CSV for ${user.name} is in the folder you picked.`);
      }
    } catch (error) {
      Alert.alert(
        'Could not export',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2 flex-row items-center">
        <TouchableOpacity onPress={onBack} className="mr-3 p-1" activeOpacity={0.7}>
          <Text className="text-purple-600 font-medium text-base">← Back</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
            {user.name}
          </Text>
          {user.employee_code ? (
            <Text className="text-xs text-gray-500">{user.employee_code}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={handleExportCsv}
          disabled={exporting}
          className="flex-row items-center bg-indigo-50 rounded-xl px-3 py-2"
          activeOpacity={0.7}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#4f46e5" />
          ) : (
            <Ionicons name="download-outline" size={16} color="#4f46e5" />
          )}
          <Text className="text-indigo-600 text-xs font-semibold ml-1.5">
            {exporting ? 'Saving…' : 'CSV'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        ListHeaderComponent={
          <View className="mb-3">
            <View className="bg-white rounded-2xl border border-gray-100 p-3">
              <View className="flex-row flex-wrap gap-2 mb-3">
                {PRESETS.map((item) => {
                  const active = preset === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => applyPreset(item)}
                      className={`px-3 py-2 rounded-xl ${active ? 'bg-purple-500' : 'bg-gray-100'}`}
                      activeOpacity={0.8}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          active ? 'text-white' : 'text-gray-600'
                        }`}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

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
                  {isFetching ? 'Fetching…' : 'Fetch these dates'}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="bg-white rounded-2xl border border-gray-100 p-3 mt-3">
              <Text className="text-xs text-gray-400 text-center mb-2">
                {range.from} → {range.to}
              </Text>
              <View className="flex-row">
                <SummaryCell label="Days filled" value={String(totals.days)} />
                <SummaryCell label="Rounds" value={String(totals.rounds)} />
                <SummaryCell label="Read" value={fmtMinutes(totals.read)} />
                <SummaryCell label="Hear" value={fmtMinutes(totals.hear)} />
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => <RoutineDetailCard entry={item} />}
        ListEmptyComponent={
          isLoading ? (
            <View className="py-16 items-center">
              <ActivityIndicator color="#7c3aed" />
            </View>
          ) : (
            <View className="items-center py-16">
              <Text className="text-4xl mb-3">📭</Text>
              <Text className="text-gray-500">No sadhana in these dates</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

export default function UsersScreen() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [comparing, setComparing] = useState(false);
  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading, isFetching } = useAllUsers(debouncedSearch, page);

  React.useEffect(() => {
    if (data) {
      if (page === 0) {
        setAllUsers(data.users);
      } else {
        setAllUsers((prev) => {
          const ids = new Set(prev.map((u) => u.id));
          return [...prev, ...data.users.filter((u) => !ids.has(u.id))];
        });
      }
      setHasMore(data.hasMore);
    }
  }, [data, page]);

  function handleSearchChange(text: string) {
    setSearch(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(text);
      setPage(0);
      setAllUsers([]);
    }, 400);
  }

  if (selectedUser) {
    return (
      <UserDetail
        user={selectedUser}
        onBack={() => setSelectedUser(null)}
      />
    );
  }

  if (comparing) {
    return (
      <UsersCompareView
        onBack={() => setComparing(false)}
        onSelectUser={(user) => {
          setComparing(false);
          setSelectedUser(user);
        }}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-2xl font-bold text-gray-900">Users</Text>
          <TouchableOpacity
            onPress={() => setComparing(true)}
            className="flex-row items-center bg-purple-100 rounded-xl px-3 py-2"
            activeOpacity={0.7}
          >
            <Ionicons name="git-compare-outline" size={16} color="#6d28d9" />
            <Text className="text-purple-700 font-semibold text-sm ml-1.5">Compare</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 shadow-sm"
          placeholder="Search by name or employee code..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={handleSearchChange}
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={allUsers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        renderItem={({ item }) => (
          <UserCard user={item} onPress={() => setSelectedUser(item)} />
        )}
        onEndReached={() => {
          if (hasMore && !isFetching) setPage((p) => p + 1);
        }}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center py-20">
              <Text className="text-4xl mb-3">👥</Text>
              <Text className="text-gray-500">
                {debouncedSearch ? 'No users match your search' : 'No users found'}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isFetching ? (
            <View className="py-4 items-center">
              <ActivityIndicator color="#7c3aed" />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
