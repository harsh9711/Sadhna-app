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
import { useAuth } from '@/context/AuthContext';
import { useUserHistoryPaginated } from '@/hooks/useRoutine';
import { getAllUserEntries } from '@/lib/api';
import { buildSadhanaExcel, sadhanaExcelFilename, saveSadhanaExcel } from '@/lib/sadhanaExport';
import RoutineDetailCard from '@/components/RoutineDetailCard';
import SadhanaCompare from '@/components/SadhanaCompare';
import SadhanaEditor from '@/components/SadhanaEditor';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { RoutineEntry } from '@/types';

type Tab = 'entries' | 'compare';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('entries');
  const [editDate, setEditDate] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [allEntries, setAllEntries] = useState<RoutineEntry[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading, refetch, isFetching } = useUserHistoryPaginated(user?.id, page);

  React.useEffect(() => {
    if (data) {
      if (page === 0) {
        setAllEntries(data.entries);
      } else {
        setAllEntries((prev) => {
          const ids = new Set(prev.map((e) => e.id));
          const newOnes = data.entries.filter((e) => !ids.has(e.id));
          return [...prev, ...newOnes];
        });
      }
      setHasMore(data.hasMore);
    }
  }, [data, page]);

  function handleRefresh() {
    setPage(0);
    setAllEntries([]);
    setHasMore(true);
    refetch();
  }

  function handleLoadMore() {
    if (hasMore && !isFetching) {
      setPage((p) => p + 1);
    }
  }

  async function handleExportExcel() {
    if (!user || exporting) return;
    setExporting(true);
    try {
      const entries = await getAllUserEntries(user.id);
      if (entries.length === 0) {
        Alert.alert('Nothing to download', 'Fill a sadhana card first, then export.');
        return;
      }
      const result = await saveSadhanaExcel(buildSadhanaExcel(entries), sadhanaExcelFilename());
      if (result === 'cancelled') return;
      if (result === 'saved') {
        Alert.alert('Saved', 'Your sadhana Excel file is in the folder you picked (choose Downloads).');
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

  if (isLoading && page === 0 && tab === 'entries' && !editDate) {
    return <LoadingSpinner message="Loading history..." />;
  }

  if (editDate) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <SadhanaEditor
          date={editDate}
          title="Edit sadhana"
          backLabel="← Back to history"
          onBack={() => setEditDate(null)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-2xl font-bold text-gray-900">My History</Text>
            <Text className="text-gray-500 text-sm mt-0.5">
              {tab === 'entries' ? `${allEntries.length} entries` : 'Compare your sadhana'}
            </Text>
          </View>
          {tab === 'entries' ? (
            <TouchableOpacity
              onPress={handleExportExcel}
              disabled={exporting}
              className="flex-row items-center bg-indigo-50 rounded-xl px-3 py-2 mt-1"
              activeOpacity={0.7}
            >
              {exporting ? (
                <ActivityIndicator size="small" color="#4f46e5" />
              ) : (
                <Ionicons name="download-outline" size={16} color="#4f46e5" />
              )}
              <Text className="text-indigo-600 text-xs font-semibold ml-1.5">
                {exporting ? 'Saving…' : 'Excel'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View className="flex-row bg-gray-100 rounded-2xl p-1 mt-3">
          {(
            [
              { id: 'entries', label: 'Sadhana' },
              { id: 'compare', label: 'Compare' },
            ] as const
          ).map((item) => {
            const active = tab === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setTab(item.id)}
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
      </View>

      {tab === 'compare' && user ? (
        <SadhanaCompare userId={user.id} />
      ) : (
        <FlatList
          data={allEntries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <RoutineDetailCard entry={item} onEdit={() => setEditDate(item.date)} />
          )}
          refreshControl={
            <RefreshControl refreshing={isLoading && page === 0} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            !isLoading ? (
              <View className="items-center justify-center pt-20">
                <Text className="text-5xl mb-4">📋</Text>
                <Text className="text-gray-500 text-base font-medium">No sadhana yet</Text>
                <Text className="text-gray-400 text-sm mt-1">Start by filling today's entry</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            isFetching && page > 0 ? (
              <View className="py-4 items-center">
                <ActivityIndicator color="#6366f1" />
              </View>
            ) : hasMore && allEntries.length > 0 ? (
              <TouchableOpacity
                onPress={handleLoadMore}
                className="py-3 items-center"
                activeOpacity={0.7}
              >
                <Text className="text-indigo-600 font-medium">Load More</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
