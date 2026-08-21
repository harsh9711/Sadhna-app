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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validationError(message: string): AuthErrorInfo {
  return { message, details: null, code: null };
}

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthErrorInfo | null>(null);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();

  async function handleRegister() {
    setError(null);

    if (!name.trim()) { setError(validationError('Full name is required.')); return; }
    if (!isValidEmail(email.trim())) { setError(validationError('Enter a valid email address.')); return; }
    if (password.length < 6) { setError(validationError('Password must be at least 6 characters.')); return; }
    if (password !== confirmPassword) { setError(validationError('Passwords do not match.')); return; }

    setLoading(true);
    try {
      const { error: signUpError, needsEmailConfirmation } = await signUp(
        email.trim(),
        password,
        name.trim()
      );
      if (signUpError) {
        setError(signUpError);
      } else if (needsEmailConfirmation) {
        setSuccess(true);
      }
    } catch (caught) {
      setError({
        message: 'Sign up failed unexpectedly.',
        details: caught instanceof Error ? caught.message : String(caught),
        code: null,
      });
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-5xl mb-4">📬</Text>
        <Text className="text-2xl font-bold text-gray-900 mb-2">Check your email</Text>
        <Text className="text-gray-500 text-center mb-8">
          We sent a confirmation link to {email}. Confirm your email then sign in.
        </Text>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity className="bg-indigo-500 rounded-xl py-4 px-8">
            <Text className="text-white font-semibold">Go to Sign In</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6 pt-16 pb-10">
          <Text className="text-3xl font-bold text-gray-900 mb-1">Create Account</Text>
          <Text className="text-gray-500 mb-8">Start tracking your daily routine</Text>

          <View className="gap-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Full Name</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-900"
                placeholder="Jane Doe"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

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
                placeholder="Min. 6 characters"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Confirm Password</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-900"
                placeholder="Re-enter password"
                placeholderTextColor="#9ca3af"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <AuthErrorBanner error={error} />

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              className={`rounded-xl py-4 items-center mt-2 ${
                loading ? 'bg-indigo-300' : 'bg-indigo-500'
              }`}
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-base">
                {loading ? 'Creating account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mt-8">
            <Text className="text-gray-500 text-sm">Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-indigo-600 font-semibold text-sm">Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
