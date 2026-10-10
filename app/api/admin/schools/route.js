import { NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function requireAdmin() {
  const session = await getSession();
  return session && session.role === 'admin' ? session : null;
}

export async function GET(req) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const typeFilter = searchParams.get('type');

  const supabase = supabaseAdmin();
  let query = supabase
    .from('schools')
    .select('id, code, name, type, username, must_change_password, created_at')
    .order('created_at', { ascending: false });

  if (typeFilter === 'public' || typeFilter === 'private') {
    query = query.eq('type', typeFilter);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  return NextResponse.json({ schools: data });
}

export async function POST(req) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const { code, name, username, password, type } = await req.json();
  if (!code || !name || !username || !password) {
    return NextResponse.json({ error: 'كل الحقول مطلوبة' }, { status: 400 });
  }
  const schoolType = type === 'private' ? 'private' : 'public';
  const supabase = supabaseAdmin();
  const password_hash = await hashPassword(password);
  const { data, error } = await supabase
    .from('schools')
    .insert({ code, name, type: schoolType, username, password_hash, must_change_password: true })
    .select('id')
    .single();
  if (error) {
    return NextResponse.json({ error: 'حدث خطأ، تأكد أن الكود واسم المستخدم غير مكررين' }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: data.id });
}
