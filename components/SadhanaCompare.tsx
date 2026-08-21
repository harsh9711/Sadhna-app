import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { addMonths, addWeeks, addYears } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useUserEntriesRange } from '@/hooks/useRoutine';
import {
  type CompareGrain,
  type SadhanaTotals,
  compareWindow,
  fmtMinutes,
  groupEntries,
  inRange,
  sumEntries,
} from '@/lib/sadhanaStats';

const GRAINS: { id: CompareGrain; label: string }[] = [
  { id: 'day', label: 'Days' },
  { id: 'month', label: 'Months' },
  { id: 'year', label: 'Years' },
];

function delta(now: number, was: number) {
  const diff = now - was;
  if (diff === 0) return { text: 'same', color: 'text-gray-400' };
  return {
    text: `${diff > 0 ? '+' : ''}${diff}`,
    color: diff > 0 ? 'text-emerald-600' : 'text-rose-500',
  };
}

function MetricRow({
  label,
  current,
  previous,
  formatValue = String,
}: {
  label: string;
  current: number;
  previous: number;
  formatValue?: (n: number) => string;
}) {
  const change = delta(current, previous);
  return (
    <View className="flex-row items-center py-2.5 border-b border-gray-50">
      <Text className="flex-1 text-sm text-gray-600">{label}</Text>
      <Text className="w-20 text-right text-sm font-semibold text-gray-900">
        {formatValue(current)}
      </Text>
      <Text className="w-20 text-right text-sm text-gray-400">{formatValue(previous)}</Text>
      <Text className={`w-14 text-right text-xs font-semibold ${change.color}`}>{change.text}</Text>
    </View>
  );
}

function BucketCard({ row }: { row: SadhanaTotals }) {
  return (
    <View className="bg-white rounded-2xl p-4 mb-2 border border-gray-100">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-bold text-gray-800">{row.label}</Text>
        <Text className="text-xs text-gray-400">
          {row.days} day{row.days === 1 ? '' : 's'}
        </Text>
      </View>
      <View className="flex-row flex-wrap gap-x-4 gap-y-1">
        <Text className="text-xs text-gray-500">
          Rounds <Text className="font-semibold text-amber-700">{row.rounds}</Text>
        </Text>
        <Text className="text-xs text-gray-500">
          Read <Text className="font-semibold text-gray-800">{fmtMinutes(row.read)}</Text>
        </Text>
        <Text className="text-xs text-gray-500">
          Hear <Text className="font-semibold text-gray-800">{fmtMinutes(row.hear)}</Text>
        </Text>
        <Text className="text-xs text-gray-500">
          B4 MA <Text className="font-semibold text-gray-800">{row.chant}</Text>
        </Text>
      </View>
    </View>
  );
}

export default function SadhanaCompare({ userId }: { userId: string }) {
  const [grain, setGrain] = useState<CompareGrain>('day');
  const [anchor, setAnchor] = useState(() => new Date());

  const window = useMemo(() => compareWindow(anchor, grain), [anchor, grain]);
  const { data, isLoading } = useUserEntriesRange(userId, window.fetchFrom, window.fetchTo);
  const entries = data ?? [];

  const current = useMemo(
    () =>
      sumEntries(
        inRange(entries, window.current.from, window.current.to),
        window.current.from,
        window.current.label
      ),
    [entries, window]
  );
  const previous = useMemo(
    () =>
      sumEntries(
        inRange(entries, window.previous.from, window.previous.to),
        window.previous.from,
        window.previous.label
      ),
    [entries, window]
  );
  const rows = useMemo(
    () => groupEntries(inRange(entries, window.current.from, window.current.to), window.listGrain),
    [entries, window]
  );

  function shift(direction: -1 | 1) {
    if (grain === 'day') setAnchor((d) => addWeeks(d, direction));
    else if (grain === 'month') setAnchor((d) => addMonths(d, direction));
    else setAnchor((d) => addYears(d, direction));
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View className="flex-row bg-gray-100 rounded-2xl p-1 mb-4">
        {GRAINS.map((item) => {
          const active = grain === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => {
                setGrain(item.id);
                setAnchor(new Date());
              }}
              className={`flex-1 py-2 rounded-xl ${active ? 'bg-white' : ''}`}
              activeOpacity={0.8}
            >
              <Text
                className={`text-center text-sm font-semibold ${
                  active ? 'text-indigo-600' : 'text-gray-500'
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View className="flex-row items-center justify-between bg-white rounded-2xl border border-gray-100 px-2 py-2 mb-4">
        <TouchableOpacity onPress={() => shift(-1)} className="p-2" activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color="#6366f1" />
        </TouchableOpacity>
        <Text className="text-sm font-semibold text-gray-900">{window.title}</Text>
        <TouchableOpacity onPress={() => shift(1)} className="p-2" activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={20} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="py-16 items-center">
          <ActivityIndicator color="#6366f1" />
        </View>
      ) : (
        <>
          <View className="bg-white rounded-2xl px-4 py-3 mb-4 border border-gray-100">
            <View className="flex-row items-center pb-2 border-b border-gray-100">
              <Text className="flex-1 text-xs font-semibold text-gray-400 uppercase">Sadhana</Text>
              <Text className="w-20 text-right text-[11px] font-semibold text-indigo-600">
                {window.current.label}
              </Text>
              <Text className="w-20 text-right text-[11px] font-semibold text-gray-400">
                {window.previous.label}
              </Text>
              <Text className="w-14 text-right text-[11px] font-semibold text-gray-400">Δ</Text>
            </View>
            <MetricRow label="Days filled" current={current.days} previous={previous.days} />
            <MetricRow label="Total rounds" current={current.rounds} previous={previous.rounds} />
            <MetricRow
              label="Reading"
              current={current.read}
              previous={previous.read}
              formatValue={fmtMinutes}
            />
            <MetricRow
              label="Hearing"
              current={current.hear}
              previous={previous.hear}
              formatValue={fmtMinutes}
            />
            <MetricRow label="Chant B4 MA" current={current.chant} previous={previous.chant} />
            <MetricRow label="Till 7:30" current={current.till730} previous={previous.till730} />
            <MetricRow
              label="Day rest"
              current={current.rest}
              previous={previous.rest}
              formatValue={fmtMinutes}
            />
          </View>

          <Text className="text-xs font-semibold text-gray-400 uppercase mb-2">Breakdown</Text>
          {rows.length ? (
            rows.map((row) => <BucketCard key={row.key} row={row} />)
          ) : (
            <View className="items-center py-10">
              <Text className="text-gray-500">No sadhana in this period</Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
