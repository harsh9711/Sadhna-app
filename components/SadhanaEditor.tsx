import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useEntryForDate, useSubmitEntry, useUpsertEntry } from '@/hooks/useRoutine';
import { useRoundsTarget } from '@/hooks/useRoundsTarget';
import RoutineForm from '@/components/RoutineForm';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { RoutineEntry, RoutineFormData } from '@/types';

export const DEFAULT_FORM: RoutineFormData = {
  chant_before_ma: '',
  rounds_till_730: '',
  last_round_time: '',
  total_rounds: '',
  read_minutes: '',
  book: '',
  hear_minutes: '',
  speaker: '',
  topic: '',
  slept_at: '',
  wake_time: '',
  day_rest_minutes: '',
};

export function entryToForm(entry: RoutineEntry | Record<string, unknown> | null): RoutineFormData {
  if (!entry) return DEFAULT_FORM;
  const text = (key: keyof RoutineFormData) =>
    entry[key] != null ? String(entry[key]) : '';
  return {
    chant_before_ma: text('chant_before_ma'),
    rounds_till_730: text('rounds_till_730'),
    last_round_time: text('last_round_time'),
    total_rounds: text('total_rounds'),
    read_minutes: text('read_minutes'),
    book: text('book'),
    hear_minutes: text('hear_minutes'),
    speaker: text('speaker'),
    topic: text('topic'),
    slept_at: text('slept_at'),
    wake_time: text('wake_time'),
    day_rest_minutes: text('day_rest_minutes'),
  };
}

function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/does not exist|schema cache/i.test(message)) {
    return `${message}\n\nThe database is missing the sadhana columns. Run supabase/migrations/002_sadhana_fields.sql in the Supabase SQL editor.`;
  }
  return message || 'Please try again.';
}

export default function SadhanaEditor({
  date,
  title,
  backLabel = '← Back',
  onBack,
  onSubmitted,
}: {
  date: string;
  title?: string;
  backLabel?: string;
  onBack?: () => void;
  onSubmitted?: () => void;
}) {
  const { user } = useAuth();
  const { data: entry, isLoading, refetch } = useEntryForDate(user?.id, date);
  const { target: roundsTarget, save: saveRoundsTarget } = useRoundsTarget(user?.id);
  const upsertMutation = useUpsertEntry();
  const submitMutation = useSubmitEntry();

  const [formData, setFormData] = useState<RoutineFormData>(DEFAULT_FORM);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [editing, setEditing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const entryIdRef = useRef<string | undefined>(undefined);

  const displayDate = (() => {
    try {
      return format(parseISO(date), 'EEEE · dd/MM/yyyy');
    } catch {
      return date;
    }
  })();

  useEffect(() => {
    entryIdRef.current = undefined;
    setFormData(DEFAULT_FORM);
    setLastSaved(null);
    setEditing(false);
  }, [date]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  useEffect(() => {
    if (entry !== undefined) {
      setFormData(entryToForm(entry as Record<string, unknown> | null));
      if (entry) {
        entryIdRef.current = entry.id;
        setLastSaved(new Date(entry.updated_at));
      }
    }
  }, [entry]);

  const handleSave = useCallback(
    (field: keyof RoutineFormData, value: RoutineFormData[keyof RoutineFormData]) => {
      if (!user || (entry?.status === 'submitted' && !editing)) return;
      const updated = { ...formData, [field]: value };
      setFormData(updated);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          const result = await upsertMutation.mutateAsync({
            userId: user.id,
            date,
            data: { [field]: value },
          });
          entryIdRef.current = result.id;
          setLastSaved(new Date());
        } catch {
          // silently fail draft saves
        }
      }, 1000);
    },
    [user, formData, date, upsertMutation, entry?.status, editing]
  );

  const handleSubmit = useCallback(async () => {
    if (!user) return;

    // A queued draft save would overwrite this write after it lands.
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (entry?.status === 'submitted' && editing) {
      try {
        const result = await upsertMutation.mutateAsync({
          userId: user.id,
          date,
          data: formData,
        });
        entryIdRef.current = result.id;
        setLastSaved(new Date());
        setEditing(false);
      } catch (e) {
        Alert.alert('Could not save changes', describeError(e));
      }
      return;
    }

    let entryId = entryIdRef.current;
    if (!entryId) {
      try {
        const result = await upsertMutation.mutateAsync({
          userId: user.id,
          date,
          data: formData,
        });
        entryId = result.id;
        entryIdRef.current = entryId;
      } catch (e) {
        Alert.alert('Could not save entry', describeError(e));
        return;
      }
    }

    try {
      await submitMutation.mutateAsync({ entryId, userId: user.id });
      onSubmitted?.();
    } catch (e) {
      Alert.alert('Could not submit entry', describeError(e));
    }
  }, [user, date, formData, upsertMutation, submitMutation, onSubmitted, entry?.status, editing]);

  const isSubmitted = entry?.status === 'submitted';
  const isSaving = upsertMutation.isPending || submitMutation.isPending;

  if (isLoading) return <LoadingSpinner message="Loading sadhana..." />;

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16 }}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      <View className="mb-6">
        {onBack ? (
          <TouchableOpacity onPress={onBack} className="mb-2" activeOpacity={0.7}>
            <Text className="text-indigo-600 font-medium">{backLabel}</Text>
          </TouchableOpacity>
        ) : null}
        <Text className="text-2xl font-bold text-gray-900">{title ?? "Today's Sadhna"}</Text>
        <Text className="text-gray-500 mt-0.5">{displayDate}</Text>
        {lastSaved && (
          <Text className="text-xs text-gray-400 mt-1">
            Last saved {format(lastSaved, 'h:mm a')}
          </Text>
        )}
      </View>

      {isSubmitted && !editing && (
        <View className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-4">
          <View className="flex-row items-center">
            <Text className="text-green-700 font-medium text-sm flex-1">
              Entry submitted for this day
            </Text>
            <Text className="text-green-600 text-lg">✓</Text>
          </View>
          <TouchableOpacity
            onPress={() => setEditing(true)}
            className="mt-3 bg-white border border-green-200 rounded-xl py-2.5 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-green-700 font-semibold text-sm">Edit sadhana</Text>
          </TouchableOpacity>
        </View>
      )}

      <RoutineForm
        initialData={formData}
        onSave={handleSave}
        onSubmit={handleSubmit}
        isSubmitted={!!isSubmitted}
        isEditing={editing}
        onCancelEdit={() => {
          setEditing(false);
          if (entry) setFormData(entryToForm(entry));
        }}
        isSaving={isSaving}
        roundsTarget={roundsTarget}
        onRoundsTargetChange={saveRoundsTarget}
      />
    </ScrollView>
  );
}
