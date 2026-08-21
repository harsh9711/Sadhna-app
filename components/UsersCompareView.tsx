import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addDays, format, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useUsersComparison } from '@/hooks/useAdmin';
import type { Profile } from '@/types';

const COL = {
  name: 132,
  status: 88,
  b4ma: 76,
  till730: 84,
  lastRound: 88,
  total: 64,
  read: 64,
  book: 150,
  hear: 64,
  speaker: 130,
  topic: 130,
  slept: 76,
  wake: 76,
  dayRest: 76,
};

function num(value?: number) {
  return value != null ? String(value) : '—';
}

function Cell({
  width,
  children,
  last,
}: {
  width: number;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <View
      style={{ width }}
      className={`justify-center py-3 px-2 ${last ? '' : 'border-r border-gray-100'}`}
    >
      {children}
    </View>
  );
}

function HeaderCell({ width, label, last }: { width: number; label: string; last?: boolean }) {
  return (
    <Cell width={width} last={last}>
      <Text className="text-[11px] font-semibold text-gray-500 uppercase">{label}</Text>
    </Cell>
  );
}

export default function UsersCompareView({
  onBack,
  onSelectUser,
}: {
  onBack: () => void;
  onSelectUser: (user: Profile) => void;
}) {
  const [date, setDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const { data, isLoading } = useUsersComparison(date);

  const displayDate = React.useMemo(() => {
    try {
      return format(parseISO(date), 'EEE, MMM d');
    } catch {
      return date;
    }
  }, [date]);

  const submittedCount = data?.filter((row) => row.entry?.status === 'submitted').length ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={onBack} className="p-1" activeOpacity={0.7}>
            <Text className="text-purple-600 font-medium text-base">← Back</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Compare users</Text>
          <View className="w-12" />
        </View>

        <View className="flex-row items-center justify-between bg-white rounded-2xl border border-gray-100 px-3 py-2">
          <TouchableOpacity
            onPress={() => setDate(format(addDays(parseISO(date), -1), 'yyyy-MM-dd'))}
            className="p-2"
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color="#7c3aed" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-base font-semibold text-gray-900">{displayDate}</Text>
            <Text className="text-xs text-gray-500">
              {submittedCount}/{data?.length ?? 0} submitted
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setDate(format(addDays(parseISO(date), 1), 'yyyy-MM-dd'))}
            className="p-2"
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={20} color="#7c3aed" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#7c3aed" />
        </View>
      ) : !data?.length ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-4xl mb-3">👥</Text>
          <Text className="text-gray-500 text-center">No users to compare</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View>
            <View className="flex-row bg-purple-50 border-y border-purple-100 mx-4 rounded-t-xl overflow-hidden">
              <HeaderCell width={COL.name} label="User" />
              <HeaderCell width={COL.status} label="Status" />
              <HeaderCell width={COL.b4ma} label="B4 MA" />
              <HeaderCell width={COL.till730} label="Till 7:30" />
              <HeaderCell width={COL.lastRound} label="Last round" />
              <HeaderCell width={COL.total} label="Total" />
              <HeaderCell width={COL.read} label="Read" />
              <HeaderCell width={COL.book} label="Book" />
              <HeaderCell width={COL.hear} label="Hear" />
              <HeaderCell width={COL.speaker} label="Speaker" />
              <HeaderCell width={COL.topic} label="Topic" />
              <HeaderCell width={COL.slept} label="Slept at" />
              <HeaderCell width={COL.wake} label="Wake up" />
              <HeaderCell width={COL.dayRest} label="Day rest" last />
            </View>

            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
              nestedScrollEnabled
            >
              {data.map((row, index) => {
                const entry = row.entry;
                const submitted = entry?.status === 'submitted';
                return (
                  <TouchableOpacity
                    key={row.user.id}
                    onPress={() => onSelectUser(row.user)}
                    activeOpacity={0.7}
                    className={`flex-row bg-white border-b border-gray-100 ${
                      index === data.length - 1 ? 'rounded-b-xl overflow-hidden' : ''
                    }`}
                  >
                    <Cell width={COL.name}>
                      <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>
                        {row.user.name}
                      </Text>
                      {row.user.employee_code ? (
                        <Text className="text-[11px] text-gray-400" numberOfLines={1}>
                          {row.user.employee_code}
                        </Text>
                      ) : null}
                    </Cell>
                    <Cell width={COL.status}>
                      <Text
                        className={`text-xs font-semibold ${
                          !entry
                            ? 'text-gray-400'
                            : submitted
                              ? 'text-green-700'
                              : 'text-yellow-700'
                        }`}
                      >
                        {!entry ? 'Missing' : submitted ? 'Submitted' : 'Draft'}
                      </Text>
                    </Cell>
                    <Cell width={COL.b4ma}>
                      <Text className="text-sm text-gray-700">{num(entry?.chant_before_ma)}</Text>
                    </Cell>
                    <Cell width={COL.till730}>
                      <Text className="text-sm text-gray-700">{num(entry?.rounds_till_730)}</Text>
                    </Cell>
                    <Cell width={COL.lastRound}>
                      <Text className="text-sm text-gray-700">{entry?.last_round_time ?? '—'}</Text>
                    </Cell>
                    <Cell width={COL.total}>
                      <Text className="text-sm font-semibold text-amber-700">
                        {num(entry?.total_rounds)}
                      </Text>
                    </Cell>
                    <Cell width={COL.read}>
                      <Text className="text-sm text-gray-700">
                        {entry?.read_minutes != null ? `${entry.read_minutes}m` : '—'}
                      </Text>
                    </Cell>
                    <Cell width={COL.book}>
                      <Text className="text-xs text-gray-500" numberOfLines={2}>
                        {entry?.book || '—'}
                      </Text>
                    </Cell>
                    <Cell width={COL.hear}>
                      <Text className="text-sm text-gray-700">
                        {entry?.hear_minutes != null ? `${entry.hear_minutes}m` : '—'}
                      </Text>
                    </Cell>
                    <Cell width={COL.speaker}>
                      <Text className="text-xs text-gray-500" numberOfLines={2}>
                        {entry?.speaker || '—'}
                      </Text>
                    </Cell>
                    <Cell width={COL.topic}>
                      <Text className="text-xs text-gray-500" numberOfLines={2}>
                        {entry?.topic || '—'}
                      </Text>
                    </Cell>
                    <Cell width={COL.slept}>
                      <Text className="text-sm text-gray-700">{entry?.slept_at ?? '—'}</Text>
                    </Cell>
                    <Cell width={COL.wake}>
                      <Text className="text-sm text-gray-700">{entry?.wake_time ?? '—'}</Text>
                    </Cell>
                    <Cell width={COL.dayRest} last>
                      <Text className="text-sm text-gray-700">
                        {entry?.day_rest_minutes != null
                          ? `${Math.floor(entry.day_rest_minutes / 60)}:${String(entry.day_rest_minutes % 60).padStart(2, '0')}`
                          : '—'}
                      </Text>
                    </Cell>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
