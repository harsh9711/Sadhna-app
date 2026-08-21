import React from 'react';
import { Text, View } from 'react-native';
import type { AuthErrorInfo } from '@/lib/authErrors';

interface AuthErrorBannerProps {
  error: AuthErrorInfo | string | null;
}

export default function AuthErrorBanner({ error }: AuthErrorBannerProps) {
  if (!error) return null;

  const message = typeof error === 'string' ? error : error.message;
  const details = typeof error === 'string' ? null : error.details;

  return (
    <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
      <Text className="text-red-700 font-semibold text-sm">{message}</Text>
      {details ? (
        <Text className="text-red-500 text-xs mt-1.5 leading-4" selectable>
          {details}
        </Text>
      ) : null}
    </View>
  );
}
