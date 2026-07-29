import { NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function requireAdmin() {
  const session = await getSession();
  return session && session.role === 'admin' ? session : null;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from('schools')
    .select('id, code, name, username, must_change_password, created_at')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  return NextResponse.json({ schools: data });
}

export async function POST(req) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const { code, name, username, password } = await req.json();
  if (!code || !name || !username || !password) {
    return NextResponse.json({ error: 'كل الحقول مطلوبة' }, { status: 400 });
  }
  const supabase = supabaseAdmin();
  const password_hash = await hashPassword(password);
  const { data, error } = await supabase
    .from('schools')
    .insert({ code, name, username, password_hash, must_change_password: true })
    .select('id')
    .single();
  if (error) {
    return NextResponse.json({ error: 'حدث خطأ، تأكد أن الكود واسم المستخدم غير مكررين' }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: data.id });
}
