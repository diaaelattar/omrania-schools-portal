// Run once after setting up Supabase and your .env(.local) file:
//   node scripts/seed-admin.js
// Creates (or updates the password of) the admin account defined by
// ADMIN_USERNAME / ADMIN_PASSWORD in your environment.
require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!url || !key || !username || !password) {
    console.error('Missing required env vars. Check .env.local against .env.example');
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const password_hash = await bcrypt.hash(password, 10);

  const { data: existing } = await supabase
    .from('admins')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (existing) {
    await supabase.from('admins').update({ password_hash }).eq('id', existing.id);
    console.log(`Updated password for existing admin "${username}".`);
  } else {
    await supabase.from('admins').insert({ username, password_hash });
    console.log(`Created admin "${username}".`);
  }
}

main().then(() => process.exit(0));
