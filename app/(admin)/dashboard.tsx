import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAdminStats, useRecentSubmissions } from '@/hooks/useAdmin';
import { useAuth } from '@/context/AuthContext';
import StatsCard from '@/components/StatsCard';
import EntryCard from '@/components/EntryCard';

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');
  const displayDate = format(new Date(), 'EEEE, MMMM d yyyy');

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useAdminStats(today);

  const {
    data: recentSubmissions,
    isLoading: submissionsLoading,
    refetch: refetchRecent,
  } = useRecentSubmissions();

  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchRecent()]);
    setRefreshing(false);
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          await signOut();
        },
      },
    ]);
  }

  const submissionRate = stats?.submission_rate ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <FlatList
        data={recentSubmissions ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View className="flex-row items-start justify-between mb-6">
              <View className="flex-1 pr-3">
                <Text className="text-2xl font-bold text-gray-900">Admin Dashboard</Text>
                <Text className="text-gray-500 text-sm mt-0.5">{displayDate}</Text>
              </View>
              <TouchableOpacity
                onPress={handleSignOut}
                disabled={signingOut}
                className="flex-row items-center bg-red-50 border border-red-200 rounded-xl px-3 py-2"
                activeOpacity={0.7}
              >
                <Ionicons name="log-out-outline" size={18} color="#dc2626" />
                <Text className="text-red-600 font-semibold text-sm ml-1.5">
                  {signingOut ? 'Signing out...' : 'Log out'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Stats */}
            {statsLoading ? (
              <View className="h-24 items-center justify-center">
                <ActivityIndicator color="#7c3aed" />
              </View>
            ) : (
              <>
                <View className="flex-row mb-3">
                  <StatsCard
                    label="Total Users"
                    value={stats?.total_users ?? 0}
                    color="#7c3aed"
                  />
                  <StatsCard
                    label="Submitted Today"
                    value={stats?.submitted_today ?? 0}
                    color="#059669"
                  />
                  <StatsCard
                    label="Missing"
                    value={stats?.missing_today ?? 0}
                    color="#dc2626"
                  />
                </View>

                {/* Submission rate progress */}
                <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-sm font-medium text-gray-700">Submission Rate</Text>
                    <Text className="text-sm font-bold text-purple-700">
                      {submissionRate.toFixed(0)}%
                    </Text>
                  </View>
                  <View className="bg-gray-100 rounded-full h-2.5">
                    <View
                      className="bg-purple-500 h-2.5 rounded-full"
                      style={{ width: `${Math.min(submissionRate, 100)}%` }}
                    />
                  </View>
                </View>
              </>
            )}

            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-semibold text-gray-800">Recent Submissions</Text>
              <TouchableOpacity onPress={handleRefresh}>
                <Text className="text-purple-600 text-sm">Refresh</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => <EntryCard entry={item} showUser />}
        ListEmptyComponent={
          !submissionsLoading ? (
            <View className="items-center py-10">
              <Text className="text-gray-400 text-sm">No submissions yet today</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
