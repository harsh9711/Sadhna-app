import { Redirect, Stack } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import AuthErrorBanner from '@/components/AuthErrorBanner';

export default function AuthLayout() {
  const { session, profile, role, loading, profileError, signOut } = useAuth();

  if (loading) return <LoadingSpinner />;

  if (session && profileError && !profile) {
    return (
      <View className="flex-1 bg-white px-6 justify-center">
        <Text className="text-2xl font-bold text-gray-900 mb-2">Signed in, but profile failed</Text>
        <Text className="text-gray-500 mb-4">
          Auth worked, but the app could not load your profile from Supabase.
        </Text>
        <AuthErrorBanner error={profileError} />
        <TouchableOpacity
          onPress={signOut}
          className="bg-indigo-500 rounded-xl py-4 items-center mt-6"
        >
          <Text className="text-white font-semibold">Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (session && profile) {
    if (role === 'admin') return <Redirect href="/(admin)/dashboard" />;
    return <Redirect href="/(user)/today" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
