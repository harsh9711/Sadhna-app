import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { RoutineFormData } from '@/types';
import { DEFAULT_ROUNDS_TARGET } from '@/hooks/useRoundsTarget';

interface RoutineFormProps {
  initialData: RoutineFormData;
  onSave: (field: keyof RoutineFormData, value: RoutineFormData[keyof RoutineFormData]) => void;
  onSubmit: () => void;
  isSubmitted: boolean;
  isEditing?: boolean;
  onCancelEdit?: () => void;
  isSaving: boolean;
  roundsTarget: number;
  onRoundsTargetChange: (value: number) => void;
}

type IconName = keyof typeof Ionicons.glyphMap;

function FormSection({
  title,
  icon,
  tint,
  children,
}: {
  title: string;
  icon: IconName;
  tint: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-4">
      <View className="flex-row items-center mb-2">
        <View className={`w-7 h-7 rounded-lg items-center justify-center ${tint}`}>
          <Ionicons name={icon} size={15} color="#fff" />
        </View>
        <Text className="ml-2 text-sm font-bold text-gray-800">{title}</Text>
      </View>
      <View className="bg-white rounded-2xl px-4 py-1 shadow-sm border border-gray-100">
        {children}
      </View>
    </View>
  );
}

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between py-2.5 border-b border-gray-50">
      <View className="flex-1 pr-3">
        <Text className="text-sm font-medium text-gray-700">{label}</Text>
        {hint ? <Text className="text-[11px] text-gray-400 mt-0.5">{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function StackedField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="py-2.5 border-b border-gray-50">
      <Text className="text-sm font-medium text-gray-700 mb-1.5">{label}</Text>
      {children}
    </View>
  );
}

function digitsOnly(value: string) {
  return value.replace(/[^0-9]/g, '');
}

function formatMinutes(value: string) {
  const minutes = parseInt(value, 10);
  if (!minutes || minutes < 60) return undefined;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  step?: number;
  min?: number;
  max: number;
  disabled?: boolean;
}) {
  const current = parseInt(value, 10) || 0;
  const clamp = (n: number) => String(Math.min(max, Math.max(min, n)));
  const shift = (delta: number) => onChange(clamp(current + delta));

  return (
    <View className="flex-row items-center bg-gray-50 rounded-xl p-1">
      <TouchableOpacity
        onPress={() => shift(-step)}
        disabled={disabled || current <= min}
        className="w-8 h-8 rounded-lg bg-white items-center justify-center border border-gray-200"
        activeOpacity={0.7}
      >
        <Ionicons name="remove" size={16} color={disabled ? '#d1d5db' : '#4b5563'} />
      </TouchableOpacity>
      <TextInput
        className="w-12 text-center text-base font-semibold text-gray-900"
        value={value}
        editable={!disabled}
        placeholder="0"
        placeholderTextColor="#c7cbd1"
        keyboardType="number-pad"
        maxLength={4}
        onChangeText={(v) => onChange(digitsOnly(v))}
        onBlur={() => {
          const n = parseInt(value, 10);
          if (value === '' || Number.isNaN(n)) {
            if (min > 0) onChange(String(min));
            return;
          }
          onChange(clamp(n));
        }}
      />
      <TouchableOpacity
        onPress={() => shift(step)}
        disabled={disabled || current >= max}
        className="w-8 h-8 rounded-lg bg-white items-center justify-center border border-gray-200"
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={16} color={disabled ? '#d1d5db' : '#4b5563'} />
      </TouchableOpacity>
    </View>
  );
}

type ClockParts = { hh: string; mm: string; meridiem: 'am' | 'pm' };

function clockToParts(value: string): ClockParts {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!match) return { hh: '', mm: '', meridiem: 'am' };
  return {
    hh: String(parseInt(match[1], 10)),
    mm: match[2],
    meridiem: match[3].toLowerCase() as 'am' | 'pm',
  };
}

function minutesToParts(value: string): { hh: string; mm: string } {
  const total = parseInt(value, 10);
  if (value === '' || Number.isNaN(total)) return { hh: '', mm: '' };
  return {
    hh: String(Math.min(12, Math.floor(total / 60))),
    mm: String(total % 60).padStart(2, '0'),
  };
}

function clampNumber(raw: string, min: number, max: number): number {
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

/** Small number box for one half of a time value. */
function TimeBox({
  value,
  placeholder,
  disabled,
  onChangeText,
  onBlur,
  inputRef,
}: {
  value: string;
  placeholder: string;
  disabled?: boolean;
  onChangeText: (value: string) => void;
  onBlur: () => void;
  inputRef?: React.RefObject<TextInput | null>;
}) {
  return (
    <TextInput
      ref={inputRef}
      className="w-11 py-2 text-center text-base font-semibold text-gray-900 bg-gray-50 rounded-xl"
      value={value}
      editable={!disabled}
      placeholder={placeholder}
      placeholderTextColor="#c7cbd1"
      keyboardType="number-pad"
      maxLength={2}
      selectTextOnFocus
      onChangeText={(v) => onChangeText(digitsOnly(v))}
      onBlur={onBlur}
    />
  );
}

function TimeField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const minuteRef = useRef<TextInput>(null);
  const [hh, setHh] = useState(() => clockToParts(value).hh);
  const [mm, setMm] = useState(() => clockToParts(value).mm);
  const [meridiem, setMeridiem] = useState(() => clockToParts(value).meridiem);
  const emitted = useRef(value);

  // Re-sync only when the value changed somewhere else (loaded entry, reset).
  useEffect(() => {
    if (value === emitted.current) return;
    const next = clockToParts(value);
    setHh(next.hh);
    setMm(next.mm);
    setMeridiem(next.meridiem);
    emitted.current = value;
  }, [value]);

  function emit(nextHh: string, nextMm: string, nextMeridiem: 'am' | 'pm') {
    if (!nextHh || !nextMm) return;
    const next = `${clampNumber(nextHh, 1, 12)}:${String(clampNumber(nextMm, 0, 59)).padStart(2, '0')} ${nextMeridiem}`;
    emitted.current = next;
    onChange(next);
  }

  return (
    <View className="flex-row items-center">
      <TimeBox
        value={hh}
        placeholder="--"
        disabled={disabled}
        onChangeText={(v) => {
          setHh(v);
          emit(v, mm, meridiem);
          if (v.length === 2) minuteRef.current?.focus();
        }}
        onBlur={() => {
          const fixed = hh ? String(clampNumber(hh, 1, 12)) : clockToParts(value).hh;
          setHh(fixed);
          emit(fixed, mm, meridiem);
        }}
      />
      <Text className="mx-1 text-base font-bold text-gray-400">:</Text>
      <TimeBox
        value={mm}
        placeholder="--"
        disabled={disabled}
        inputRef={minuteRef}
        onChangeText={(v) => {
          setMm(v);
          emit(hh, v, meridiem);
        }}
        onBlur={() => {
          const fixed = mm
            ? String(clampNumber(mm, 0, 59)).padStart(2, '0')
            : clockToParts(value).mm;
          setMm(fixed);
          emit(hh, fixed, meridiem);
        }}
      />
      <View className="flex-row ml-2 bg-gray-100 rounded-xl p-0.5">
        {(['am', 'pm'] as const).map((option) => {
          const active = meridiem === option;
          return (
            <TouchableOpacity
              key={option}
              onPress={() => {
                if (disabled) return;
                setMeridiem(option);
                emit(hh, mm, option);
              }}
              disabled={disabled}
              className={`px-2.5 py-1.5 rounded-lg ${active ? 'bg-white' : ''}`}
              activeOpacity={0.7}
            >
              <Text
                className={`text-xs font-bold uppercase ${
                  active ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function DurationField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const minuteRef = useRef<TextInput>(null);
  const [hh, setHh] = useState(() => minutesToParts(value).hh);
  const [mm, setMm] = useState(() => minutesToParts(value).mm);
  const emitted = useRef(value);

  useEffect(() => {
    if (value === emitted.current) return;
    const next = minutesToParts(value);
    setHh(next.hh);
    setMm(next.mm);
    emitted.current = value;
  }, [value]);

  function emit(nextHh: string, nextMm: string) {
    if (!nextHh && !nextMm) return;
    const total = Math.min(
      12 * 60,
      clampNumber(nextHh || '0', 0, 12) * 60 + clampNumber(nextMm || '0', 0, 59)
    );
    emitted.current = String(total);
    onChange(emitted.current);
  }

  return (
    <View className="flex-row items-center">
      <TimeBox
        value={hh}
        placeholder="0"
        disabled={disabled}
        onChangeText={(v) => {
          setHh(v);
          emit(v, mm);
          if (v.length === 2) minuteRef.current?.focus();
        }}
        onBlur={() => {
          const fixed = hh ? String(clampNumber(hh, 0, 12)) : minutesToParts(value).hh;
          setHh(fixed);
          emit(fixed, mm);
        }}
      />
      <Text className="mx-1 text-xs font-semibold text-gray-400">hr</Text>
      <TimeBox
        value={mm}
        placeholder="00"
        disabled={disabled}
        inputRef={minuteRef}
        onChangeText={(v) => {
          setMm(v);
          emit(hh, v);
        }}
        onBlur={() => {
          const fixed = mm
            ? String(clampNumber(mm, 0, 59)).padStart(2, '0')
            : minutesToParts(value).mm;
          setMm(fixed);
          emit(hh, fixed);
        }}
      />
      <Text className="ml-1 text-xs font-semibold text-gray-400">min</Text>
    </View>
  );
}

function TextField({
  value,
  onChange,
  placeholder,
  disabled,
  multiline,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  multiline?: boolean;
}) {
  return (
    <TextInput
      className={`bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900 ${
        multiline ? 'min-h-[56px]' : ''
      }`}
      placeholder={placeholder}
      placeholderTextColor="#c7cbd1"
      value={value}
      editable={!disabled}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      onChangeText={onChange}
    />
  );
}

function QuickAdd({
  options,
  onPick,
  disabled,
  suffix = 'm',
}: {
  options: number[];
  onPick: (value: number) => void;
  disabled?: boolean;
  suffix?: string;
}) {
  return (
    <View className="flex-row py-2 border-b border-gray-50">
      {options.map((value) => (
        <TouchableOpacity
          key={value}
          onPress={() => !disabled && onPick(value)}
          disabled={disabled}
          className="px-3 py-1.5 rounded-full bg-indigo-50 mr-2"
          activeOpacity={0.7}
        >
          <Text className="text-xs font-semibold text-indigo-600">
            {value}
            {suffix}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function targetChips(target: number) {
  const parts = [0.25, 0.5, 0.75, 1].map((p) =>
    Math.max(1, Math.min(target, Math.round(target * p)))
  );
  return [...new Set(parts)];
}

export default function RoutineForm({
  initialData,
  onSave,
  onSubmit,
  isSubmitted,
  isEditing = false,
  onCancelEdit,
  isSaving,
  roundsTarget,
  onRoundsTargetChange,
}: RoutineFormProps) {
  const readOnly = isSubmitted && !isEditing;
  const set = (field: keyof RoutineFormData) => (value: string) => {
    if (!readOnly) onSave(field, value);
  };

  const goal = roundsTarget > 0 ? roundsTarget : DEFAULT_ROUNDS_TARGET;
  const till730 = parseInt(initialData.rounds_till_730, 10) || 0;
  const totalRounds = parseInt(initialData.total_rounds, 10) || 0;
  const progress = Math.min(100, Math.round((totalRounds / goal) * 100));
  const remaining = Math.max(0, goal - totalRounds);

  return (
    <View className="flex-1">
      {/* Japa summary */}
      <View className="bg-amber-500 rounded-2xl p-4 mb-4">
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-amber-100 text-xs font-semibold uppercase tracking-wider">
              Today's rounds
            </Text>
            <Text className="text-white text-3xl font-bold mt-0.5">
              {totalRounds}
              <Text className="text-amber-100 text-base font-semibold"> / {goal}</Text>
            </Text>
          </View>
          <Text className="text-amber-50 text-sm font-semibold">{progress}%</Text>
        </View>
        <View className="h-2 bg-amber-400/60 rounded-full mt-3 overflow-hidden">
          <View className="h-2 bg-white rounded-full" style={{ width: `${progress}%` }} />
        </View>
        <Text className="text-amber-50 text-xs mt-2">
          {remaining === 0
            ? 'Daily target complete'
            : `${remaining} round${remaining === 1 ? '' : 's'} left for today's target`}
        </Text>
      </View>

      {/* Japa */}
      <FormSection title="Japa" icon="repeat" tint="bg-amber-500">
        <FieldRow label="Chant B4 MA" hint="How many rounds before mangala arati?">
          <Stepper
            value={initialData.chant_before_ma}
            onChange={set('chant_before_ma')}
            max={108}
            disabled={readOnly}
          />
        </FieldRow>
        <FieldRow label="Till 7:30 am" hint="How many rounds by 7:30 for Prabhupada?">
          <Stepper
            value={initialData.rounds_till_730}
            onChange={(v) => {
              set('rounds_till_730')(v);
              const next = parseInt(v, 10) || 0;
              if (next > totalRounds) set('total_rounds')(String(next));
            }}
            max={108}
            disabled={readOnly}
          />
        </FieldRow>
        <FieldRow label="Last round">
          <TimeField
            value={initialData.last_round_time}
            onChange={set('last_round_time')}
            disabled={readOnly}
          />
        </FieldRow>
        <FieldRow label="Daily target" hint="Your vowed rounds each day">
          <Stepper
            value={String(goal)}
            onChange={(v) => onRoundsTargetChange(parseInt(v, 10) || 1)}
            max={108}
          />
        </FieldRow>
        <FieldRow label="Total rounds" hint="At least your rounds by 7:30">
          <Stepper
            value={initialData.total_rounds}
            onChange={set('total_rounds')}
            min={till730}
            max={108}
            disabled={readOnly}
          />
        </FieldRow>
        <QuickAdd
          options={targetChips(goal)}
          onPick={(rounds) => set('total_rounds')(String(Math.max(till730, rounds)))}
          disabled={readOnly}
          suffix=""
        />
      </FormSection>

      {/* Reading */}
      <FormSection title="Reading" icon="book" tint="bg-indigo-500">
        <FieldRow
          label="Read"
          hint={formatMinutes(initialData.read_minutes) ?? "How long did you read Srila Prabhupada's books?"}
        >
          <Stepper
            value={initialData.read_minutes}
            onChange={set('read_minutes')}
            step={15}
            max={1440}
            disabled={readOnly}
          />
        </FieldRow>
        <QuickAdd
          options={[30, 60, 120]}
          onPick={(minutes) => set('read_minutes')(String(minutes))}
          disabled={readOnly}
        />
        <StackedField label="Book">
          <TextField
            value={initialData.book}
            onChange={set('book')}
            placeholder="Which of Srila Prabhupada's books did you read today?"
            disabled={readOnly}
          />
        </StackedField>
      </FormSection>

      {/* Hearing */}
      <FormSection title="Hearing" icon="headset" tint="bg-emerald-500">
        <FieldRow
          label="Hear"
          hint={formatMinutes(initialData.hear_minutes) ?? 'How long did you hear hari-katha today?'}
        >
          <Stepper
            value={initialData.hear_minutes}
            onChange={set('hear_minutes')}
            step={15}
            max={1440}
            disabled={readOnly}
          />
        </FieldRow>
        <QuickAdd
          options={[30, 60, 90]}
          onPick={(minutes) => set('hear_minutes')(String(minutes))}
          disabled={readOnly}
        />
        <StackedField label="Speaker">
          <TextField
            value={initialData.speaker}
            onChange={set('speaker')}
            placeholder="Whose class or kirtan did you hear for Prabhupada's pleasure?"
            disabled={readOnly}
          />
        </StackedField>
        <StackedField label="Topic">
          <TextField
            value={initialData.topic}
            onChange={set('topic')}
            placeholder="What topic of hari-katha did you hear today?"
            disabled={readOnly}
          />
        </StackedField>
      </FormSection>

      {/* Rest */}
      <FormSection title="Rest" icon="moon" tint="bg-violet-500">
        <FieldRow label="Slept at" hint="Last night">
          <TimeField
            value={initialData.slept_at}
            onChange={set('slept_at')}
            disabled={readOnly}
          />
        </FieldRow>
        <FieldRow label="Wake up">
          <TimeField
            value={initialData.wake_time}
            onChange={set('wake_time')}
            disabled={readOnly}
          />
        </FieldRow>
        <FieldRow label="Day rest" hint="Hours and minutes">
          <DurationField
            value={initialData.day_rest_minutes}
            onChange={set('day_rest_minutes')}
            disabled={readOnly}
          />
        </FieldRow>
      </FormSection>

      {/* Submit / Status */}
      {isSubmitted && !isEditing ? (
        <View className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex-row items-center justify-center">
          <Text className="text-green-700 font-semibold text-base">Submitted</Text>
          <Text className="text-green-600 ml-2 text-lg">✓</Text>
        </View>
      ) : (
        <>
          {isSubmitted && isEditing && onCancelEdit ? (
            <TouchableOpacity
              onPress={onCancelEdit}
              disabled={isSaving}
              className="rounded-2xl py-3 mb-3 items-center justify-center border border-gray-200 bg-white"
              activeOpacity={0.8}
            >
              <Text className="text-gray-600 font-semibold text-base">Cancel</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={onSubmit}
            disabled={isSaving}
            className={`rounded-2xl py-4 mb-8 items-center justify-center ${
              isSaving ? 'bg-indigo-300' : 'bg-indigo-500'
            }`}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                {isSubmitted && isEditing ? 'Save changes' : "Submit Day's Entry"}
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
