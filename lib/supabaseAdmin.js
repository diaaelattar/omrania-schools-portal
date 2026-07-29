import { createClient } from '@supabase/supabase-js';

// This client uses the SERVICE ROLE key and must only ever be imported
// from server-side code (API routes / server components) - never from
// client components. It bypasses Row Level Security on purpose.
let _client;

export function supabaseAdmin() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
    }
    _client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _client;
}
