import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import AuthErrorBanner from '@/components/AuthErrorBanner';
import type { AuthErrorInfo } from '@/lib/authErrors';
import { getSupabaseConfigDebug } from '@/lib/supabaseConfig';
import { testSupabaseConnection } from '@/lib/testSupabaseConnection';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [error, setError] = useState<AuthErrorInfo | null>(null);
  const { signIn, profileError } = useAuth();
  const configDebug = getSupabaseConfigDebug();

  async function handleSignIn() {
    if (!email.trim() || !password) {
      setError({
        message: 'Please enter email and password.',
        details: null,
        code: null,
      });
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { error: signInError } = await signIn(email.trim(), password);
      if (signInError) {
        setError(signInError);
      }
    } catch (caught) {
      setError({
        message: 'Sign in failed unexpectedly.',
        details: caught instanceof Error ? caught.message : String(caught),
        code: null,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleTestConnection() {
    setTestingConnection(true);
    setConnectionStatus(null);
    const result = await testSupabaseConnection();
    setTestingConnection(false);
    setConnectionStatus(`${result.message}\n${result.details}`);
    if (!result.ok) {
      setError({
        message: result.message,
        details: result.details,
        code: 'connection_test_failed',
      });
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 pt-24 pb-10">
          {/* Logo */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 rounded-3xl bg-indigo-500 items-center justify-center mb-4">
              <Text className="text-4xl">📅</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-900">Day Routine</Text>
            <Text className="text-gray-500 mt-1">Track your daily habits</Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Email</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-900"
                placeholder="you@example.com"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Password</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-900"
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <AuthErrorBanner error={error ?? profileError} />

            {__DEV__ ? (
              <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <Text className="text-xs text-gray-500 mb-1">Supabase URL in app</Text>
                <Text className="text-xs text-gray-800" selectable>
                  {configDebug.url}
                </Text>
                <Text className="text-xs text-gray-500 mt-2 mb-1">Anon key loaded</Text>
                <Text className="text-xs text-gray-800">{configDebug.anonKeyPreview}</Text>
                <TouchableOpacity
                  onPress={handleTestConnection}
                  disabled={testingConnection}
                  className="mt-3 bg-gray-200 rounded-lg py-2 items-center"
                >
                  <Text className="text-gray-700 text-xs font-semibold">
                    {testingConnection ? 'Testing connection...' : 'Test Supabase Connection'}
                  </Text>
                </TouchableOpacity>
                {connectionStatus ? (
                  <Text className="text-xs text-gray-600 mt-2" selectable>
                    {connectionStatus}
                  </Text>
                ) : null}
                <Text className="text-xs text-amber-700 mt-3 leading-4">
                  If both tests fail: quit Proxyman, disable macOS HTTP/HTTPS proxy, then restart Expo.
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleSignIn}
              disabled={loading}
              className={`rounded-xl py-4 items-center mt-2 ${
                loading ? 'bg-indigo-300' : 'bg-indigo-500'
              }`}
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-base">
                {loading ? 'Signing in...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mt-8">
            <Text className="text-gray-500 text-sm">Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text className="text-indigo-600 font-semibold text-sm">Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
