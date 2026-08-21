import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatAuthError, formatProfileError, type AuthErrorInfo } from '@/lib/authErrors';
import { registerPushToken } from '@/lib/notifications';
import type { Profile, Role } from '@/types';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: Role | null;
  loading: boolean;
  profileError: AuthErrorInfo | null;
  signIn: (email: string, password: string) => Promise<{ error: AuthErrorInfo | null }>;
  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ error: AuthErrorInfo | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  clearProfileError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<AuthErrorInfo | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      const formatted = formatProfileError(error);
      console.warn('Failed to load profile:', formatted.details ?? formatted.message);
      setProfile(null);
      setProfileError(formatted);
      return;
    }

    setProfile(data as Profile);
    setProfileError(null);
    registerPushToken(userId).catch(() => {});
  }

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        await fetchProfile(s.user.id);
      } else {
        setProfile(null);
        setProfileError(null);
      }

      if (mounted) setLoading(false);
    }

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        setLoading(true);
        await fetchProfile(s.user.id);
        setLoading(false);
      } else {
        setProfile(null);
        setProfileError(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: formatAuthError(error) };

      if (data.user && !data.session) {
        return {
          error: formatAuthError({
            message: 'Email not confirmed',
            code: 'email_not_confirmed',
          }),
        };
      }

      return { error: null };
    } catch (error) {
      return { error: formatAuthError(error) };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });

      if (error) return { error: formatAuthError(error), needsEmailConfirmation: false };
      // With "Confirm email" off, Supabase returns a session and the user is already signed in.
      return { error: null, needsEmailConfirmation: !data.session };
    } catch (error) {
      return { error: formatAuthError(error), needsEmailConfirmation: false };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('Sign out error:', error.message);
    }
    setProfile(null);
    setProfileError(null);
  };

  const clearProfileError = () => setProfileError(null);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        role: profile?.role ?? null,
        loading,
        profileError,
        signIn,
        signUp,
        signOut,
        clearProfileError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
