import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import SadhanaEditor from '@/components/SadhanaEditor';

export default function TodayScreen() {
  const today = format(new Date(), 'yyyy-MM-dd');
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <SadhanaEditor date={today} title="Today's Sadhna" />
    </SafeAreaView>
  );
}
