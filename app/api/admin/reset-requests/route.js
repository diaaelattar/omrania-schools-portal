import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function requireAdmin() {
  const session = await getSession();
  return session && session.role === 'admin' ? session : null;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from('password_reset_requests')
    .select('id, status, requested_at, schools(id, code, name, username, type)')
    .eq('status', 'pending')
    .order('requested_at', { ascending: true });
  if (error) return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  return NextResponse.json({ requests: data });
}
