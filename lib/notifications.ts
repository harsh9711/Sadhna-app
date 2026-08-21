import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { savePushToken } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function projectId(): string | undefined {
  return (
    Constants.easConfig?.projectId ??
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId
  );
}

export async function registerPushToken(userId: string): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('sadhana', {
        name: 'Sadhana reminders',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return;

    const id = projectId();
    const token = (
      await Notifications.getExpoPushTokenAsync(id ? { projectId: id } : undefined)
    ).data;
    await savePushToken(userId, token);
  } catch {
    // No EAS projectId / permission — in-app reminders still work.
  }
}

export async function sendMissedPushes(
  targets: { token?: string | null; title: string; body: string }[]
): Promise<{ sent: number; skipped: number }> {
  const messages = targets
    .filter((t) => t.token)
    .map((t) => ({
      to: t.token as string,
      sound: 'default' as const,
      title: t.title,
      body: t.body,
      data: { screen: 'missed' },
      channelId: 'sadhana',
    }));

  const skipped = targets.length - messages.length;
  if (!messages.length) return { sent: 0, skipped };

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Push failed (${res.status})`);
  }
  return { sent: messages.length, skipped };
}
