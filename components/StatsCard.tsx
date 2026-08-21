import React from 'react';
import { Text, View } from 'react-native';

interface StatsCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

export default function StatsCard({ label, value, subtitle, color = '#6366f1' }: StatsCardProps) {
  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex-1 mx-1">
      <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</Text>
      <Text
        className="text-3xl font-bold mt-1"
        style={{ color }}
      >
        {value}
      </Text>
      {subtitle ? (
        <Text className="text-xs text-gray-400 mt-1">{subtitle}</Text>
      ) : null}
    </View>
  );
}
