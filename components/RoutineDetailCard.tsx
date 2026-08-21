import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { format, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import type { RoutineEntry } from '@/types';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View className="w-1/2 mb-3 pr-2">
      <Text className="text-xs text-gray-400 mb-0.5">{label}</Text>
      <Text className="text-sm font-medium text-gray-800">{value}</Text>
    </View>
  );
}

function minutes(value?: number) {
  return value != null ? `${value} min` : '—';
}

function duration(value?: number) {
  if (value == null) return '—';
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  return `${hours}:${String(mins).padStart(2, '0')}`;
}

export default function RoutineDetailCard({
  entry,
  onEdit,
}: {
  entry: RoutineEntry;
  onEdit?: (entry: RoutineEntry) => void;
}) {
  const isSubmitted = entry.status === 'submitted';
  let dateLabel = entry.date;
  try {
    dateLabel = format(parseISO(entry.date), 'EEEE, dd/MM/yyyy');
  } catch {
    // keep raw date if parse fails
  }

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-semibold text-gray-800 flex-1">{dateLabel}</Text>
        <View className="flex-row items-center">
          <View className="px-2.5 py-1 rounded-full bg-amber-100 mr-2">
            <Text className="text-xs font-semibold text-amber-700">
              {entry.total_rounds ?? 0} rounds
            </Text>
          </View>
          <View className={`px-2.5 py-1 rounded-full ${isSubmitted ? 'bg-green-100' : 'bg-yellow-100'}`}>
            <Text className={`text-xs font-semibold ${isSubmitted ? 'text-green-700' : 'text-yellow-700'}`}>
              {isSubmitted ? 'Submitted' : 'Draft'}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row flex-wrap">
        <Field label="Chant B4 MA" value={entry.chant_before_ma?.toString() ?? '—'} />
        <Field label="Till 7:30 am" value={entry.rounds_till_730?.toString() ?? '—'} />
        <Field label="Last round" value={entry.last_round_time ?? '—'} />
        <Field label="Read" value={minutes(entry.read_minutes)} />
        <Field label="Hear" value={minutes(entry.hear_minutes)} />
        <Field label="Day rest" value={duration(entry.day_rest_minutes)} />
        <Field label="Slept at" value={entry.slept_at ?? '—'} />
        <Field label="Wake up" value={entry.wake_time ?? '—'} />
      </View>

      {entry.book || entry.speaker || entry.topic ? (
        <View className="mt-1 bg-gray-50 rounded-xl p-3">
          {entry.book ? (
            <Text className="text-sm text-gray-700">
              <Text className="text-gray-400">Book: </Text>
              {entry.book}
            </Text>
          ) : null}
          {entry.speaker ? (
            <Text className="text-sm text-gray-700 mt-1">
              <Text className="text-gray-400">Speaker: </Text>
              {entry.speaker}
            </Text>
          ) : null}
          {entry.topic ? (
            <Text className="text-sm text-gray-700 mt-1">
              <Text className="text-gray-400">Topic: </Text>
              {entry.topic}
            </Text>
          ) : null}
        </View>
      ) : null}

      {onEdit ? (
        <TouchableOpacity
          onPress={() => onEdit(entry)}
          className="mt-3 flex-row items-center justify-center bg-indigo-50 border border-indigo-100 rounded-xl py-2.5"
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={16} color="#6366f1" />
          <Text className="text-indigo-600 font-semibold text-sm ml-1.5">Edit sadhana</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
