import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import '../global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60,
    },
  },
});

function NotificationTapHandler() {
  const router = useRouter();
  const { role } = useAuth();

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      router.push(role === 'admin' ? '/(admin)/missed' : '/(user)/missed');
    });
    return () => sub.remove();
  }, [router, role]);

  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationTapHandler />
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
