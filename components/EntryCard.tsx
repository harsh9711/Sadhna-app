import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { format, parseISO } from 'date-fns';
import type { AdminEntryRow, RoutineEntry } from '@/types';

interface EntryCardProps {
  entry: RoutineEntry | AdminEntryRow;
  onPress?: () => void;
  showUser?: boolean;
}

export default function EntryCard({ entry, onPress, showUser = false }: EntryCardProps) {
  const isSubmitted = entry.status === 'submitted';
  const adminEntry = entry as AdminEntryRow;

  let dateLabel = entry.date;
  try {
    dateLabel = format(parseISO(entry.date), 'EEE, MMM d yyyy');
  } catch {
    // keep raw date if parse fails
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-800">{dateLabel}</Text>
          {showUser && adminEntry.profile?.name ? (
            <Text className="text-sm text-gray-500 mt-0.5">
              {adminEntry.profile.name}
              {adminEntry.profile.employee_code
                ? ` · ${adminEntry.profile.employee_code}`
                : ''}
            </Text>
          ) : null}
        </View>

        <View className="flex-row items-center gap-2">
          <View className="px-2.5 py-1 rounded-full bg-amber-100">
            <Text className="text-xs font-semibold text-amber-700">
              {entry.total_rounds ?? 0} rounds
            </Text>
          </View>
          <View
            className={`px-2.5 py-1 rounded-full ${
              isSubmitted ? 'bg-green-100' : 'bg-yellow-100'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                isSubmitted ? 'text-green-700' : 'text-yellow-700'
              }`}
            >
              {isSubmitted ? 'Submitted' : 'Draft'}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row flex-wrap mt-3 gap-3">
        {entry.read_minutes != null && (
          <View className="flex-row items-center">
            <Text className="text-xs text-gray-400">Read </Text>
            <Text className="text-xs font-medium text-gray-600">{entry.read_minutes}m</Text>
          </View>
        )}
        {entry.hear_minutes != null && (
          <View className="flex-row items-center">
            <Text className="text-xs text-gray-400">Hear </Text>
            <Text className="text-xs font-medium text-gray-600">{entry.hear_minutes}m</Text>
          </View>
        )}
        {entry.wake_time && (
          <View className="flex-row items-center">
            <Text className="text-xs text-gray-400">Wake </Text>
            <Text className="text-xs font-medium text-gray-600">{entry.wake_time}</Text>
          </View>
        )}
        {entry.last_round_time && (
          <View className="flex-row items-center">
            <Text className="text-xs text-gray-400">Last round </Text>
            <Text className="text-xs font-medium text-gray-600">{entry.last_round_time}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
