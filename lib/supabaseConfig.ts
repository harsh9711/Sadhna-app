import Constants from 'expo-constants';

type SupabaseExtra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

export function getSupabaseConfig() {
  const extra = Constants.expoConfig?.extra as SupabaseExtra | undefined;

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra?.supabaseUrl ?? '';
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra?.supabaseAnonKey ?? '';

  return { url, anonKey };
}

export function getSupabaseConfigDebug() {
  const { url, anonKey } = getSupabaseConfig();

  return {
    url: url || '(missing)',
    hasAnonKey: Boolean(anonKey),
    anonKeyPreview: anonKey ? `${anonKey.slice(0, 12)}...` : '(missing)',
  };
}
