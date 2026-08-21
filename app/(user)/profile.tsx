import React, { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const initials = profile?.name
    ? profile.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

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

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4">
        <Text className="text-2xl font-bold text-gray-900">Profile</Text>
      </View>

      <View className="flex-1 px-4 pt-8">
        {/* Avatar */}
        <View className="items-center mb-8">
          <View className="w-24 h-24 rounded-full bg-indigo-500 items-center justify-center mb-3">
            <Text className="text-white text-3xl font-bold">{initials}</Text>
          </View>
          <Text className="text-xl font-bold text-gray-900">{profile?.name ?? 'User'}</Text>
          <Text className="text-gray-500 mt-0.5">{user?.email}</Text>
          {profile?.employee_code ? (
            <View className="bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1 mt-2">
              <Text className="text-indigo-600 text-xs font-medium">
                {profile.employee_code}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Info Card */}
        <View className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4">
          <View className="px-4 py-3.5 flex-row justify-between border-b border-gray-100">
            <Text className="text-sm text-gray-500">Role</Text>
            <Text className="text-sm font-medium text-gray-800 capitalize">
              {profile?.role ?? 'user'}
            </Text>
          </View>
          <View className="px-4 py-3.5 flex-row justify-between border-b border-gray-100">
            <Text className="text-sm text-gray-500">Account Status</Text>
            <View
              className={`px-2 py-0.5 rounded-full ${
                profile?.is_active ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  profile?.is_active ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {profile?.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
          <View className="px-4 py-3.5 flex-row justify-between">
            <Text className="text-sm text-gray-500">Member Since</Text>
            <Text className="text-sm font-medium text-gray-800">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </Text>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          onPress={handleSignOut}
          disabled={signingOut}
          className="bg-red-50 border border-red-200 rounded-2xl py-4 items-center mt-4"
          activeOpacity={0.7}
        >
          <Text className="text-red-600 font-semibold">
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
