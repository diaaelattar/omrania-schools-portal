import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyPassword, createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';

export async function POST(req) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: 'من فضلك أدخل اسم المستخدم وكلمة المرور' }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: school, error } = await supabase
    .from('schools')
    .select('id, code, name, username, password_hash, must_change_password')
    .eq('username', username)
    .single();

  if (error || !school) {
    return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
  }

  const ok = await verifyPassword(password, school.password_hash);
  if (!ok) {
    return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
  }

  const token = await createSessionToken({
    role: 'school',
    id: school.id,
    name: school.name,
    code: school.code,
    mustChangePassword: school.must_change_password,
  });
  const res = NextResponse.json({ ok: true, mustChangePassword: school.must_change_password });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
