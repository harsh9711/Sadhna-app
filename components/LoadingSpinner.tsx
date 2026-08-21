import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

export default function LoadingSpinner({
  message,
  size = 'large',
  color = '#6366f1',
}: LoadingSpinnerProps) {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size={size} color={color} />
      {message ? (
        <Text className="mt-3 text-gray-500 text-sm">{message}</Text>
      ) : null}
    </View>
  );
}
