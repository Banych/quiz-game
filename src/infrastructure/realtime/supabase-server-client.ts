import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

const getServerEnv = () => {
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;

  return { url, serviceKey } as const;
};

export const getSupabaseServerClient = (): SupabaseClient | null => {
  if (cachedClient) {
    return cachedClient;
  }

  const { url, serviceKey } = getServerEnv();

  if (!url || !serviceKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'Supabase server credentials missing; realtime broadcasts disabled.'
      );
    }
    return null;
  }

  cachedClient = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 5,
      },
    },
  });

  return cachedClient;
};
