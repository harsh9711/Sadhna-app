import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEFAULT_ROUNDS_TARGET = 16;

function keyFor(userId: string) {
  return `rounds_target:${userId}`;
}

export function useRoundsTarget(userId: string | undefined) {
  const [target, setTarget] = useState(DEFAULT_ROUNDS_TARGET);

  useEffect(() => {
    if (!userId) return;
    AsyncStorage.getItem(keyFor(userId)).then((raw) => {
      const parsed = parseInt(raw ?? '', 10);
      if (parsed >= 1) setTarget(Math.min(108, parsed));
    });
  }, [userId]);

  const save = useCallback(
    (next: number) => {
      const clamped = Math.min(108, Math.max(1, Math.round(next) || DEFAULT_ROUNDS_TARGET));
      setTarget(clamped);
      if (userId) AsyncStorage.setItem(keyFor(userId), String(clamped));
    },
    [userId]
  );

  return { target, save };
}
