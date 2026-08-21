async function probe(url: string, init?: RequestInit): Promise<string> {
  try {
    const response = await fetch(url, init);
    return `OK · HTTP ${response.status}`;
  } catch (error) {
    return `FAIL · ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function testSupabaseConnection(): Promise<{
  ok: boolean;
  message: string;
  details: string;
}> {
  const { getSupabaseConfig } = await import('./supabaseConfig');
  const { url, anonKey } = getSupabaseConfig();

  const internet = await probe('https://www.google.com/generate_204');
  const supabase = url
    ? await probe(`${url}/auth/v1/health`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      })
    : 'FAIL · missing Supabase URL';

  const details = [
    `Internet: ${internet}`,
    `Supabase: ${supabase}`,
    `URL: ${url || '(missing)'}`,
  ].join('\n');

  const ok = supabase.startsWith('OK');

  return {
    ok,
    message: ok
      ? 'Reached Supabase successfully.'
      : internet.startsWith('OK')
        ? 'Internet works, but Supabase request failed.'
        : 'Simulator has no internet (proxy/VPN likely blocking HTTPS).',
    details,
  };
}
