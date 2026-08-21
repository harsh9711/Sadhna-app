import type { AuthError } from '@supabase/supabase-js';

export type AuthErrorInfo = {
  message: string;
  details: string | null;
  code: string | null;
};

function humanizeAuthMessage(message: string, code?: string | null): string {
  const lower = message.toLowerCase();

  if (code === 'signup_disabled' || lower.includes('signups not allowed for this instance')) {
    return 'New account signup is disabled in Supabase. Enable Email signups in your Supabase Auth settings.';
  }
  if (lower.includes('network request failed')) {
    return 'Cannot reach Supabase. Check internet, Project URL, and anon key in .env.local, then restart Expo.';
  }
  if (lower.includes('invalid login credentials')) {
    return 'Wrong email or password.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Email not confirmed. Check your inbox or disable email confirmation in Supabase.';
  }
  if (code === 'over_email_send_rate_limit' || lower.includes('email rate limit exceeded')) {
    return "Supabase's built-in email sender hit its hourly limit. Wait an hour, or turn off Confirm email (Authentication → Sign In / Providers → Email) so signup needs no email.";
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts. Wait a few minutes and try again.';
  }
  if (lower.includes('user already registered')) {
    return 'This email is already registered. Try signing in instead.';
  }
  if (lower.includes('password should be at least')) {
    return 'Password is too short. Use at least 6 characters.';
  }
  if (lower.includes('unable to validate email address')) {
    return 'Supabase rejected this email address.';
  }
  if (code === '23505') {
    return 'This account already exists.';
  }

  return message;
}

export function formatAuthError(error: unknown): AuthErrorInfo {
  if (!error) {
    return { message: 'Something went wrong.', details: null, code: null };
  }

  if (typeof error === 'string') {
    return {
      message: humanizeAuthMessage(error),
      details: error,
      code: null,
    };
  }

  const authError = error as AuthError & { code?: string; status?: number };
  const message = authError.message ?? 'Authentication failed.';
  const code = authError.code ?? null;
  const status = authError.status;

  const details = [
    code ? `code: ${code}` : null,
    message,
    status ? `status: ${status}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    message: humanizeAuthMessage(message, code),
    details,
    code,
  };
}

export function formatProfileError(error: unknown): AuthErrorInfo {
  const formatted = formatAuthError(error);
  return {
    ...formatted,
    message: formatted.message.startsWith('Cannot reach')
      ? formatted.message
      : `Profile load failed: ${formatted.message}`,
  };
}
