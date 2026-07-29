import { createClient } from '@supabase/supabase-js';

let _client;

export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (_client && url && !_client.isPlaceholder) {
    return _client;
  }

  if (url && key && url !== 'https://placeholder.supabase.co') {
    _client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return _client;
  }

  const placeholderClient = createClient('https://placeholder.supabase.co', 'placeholder_key', {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  placeholderClient.isPlaceholder = true;
  return placeholderClient;
}
