import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyPassword, createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';

export async function POST(req) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: 'من فضلك أدخل اسم المستخدم وكلمة المرور' }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  if (supabase.isPlaceholder) {
    return NextResponse.json({ error: 'لم يتم الاتصال بقاعدة البيانات. تحقق من إضافة NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في Vercel' }, { status: 500 });
  }

  const { data: admin, error } = await supabase
    .from('admins')
    .select('id, username, password_hash')
    .eq('username', username)
    .single();

  if (error || !admin) {
    return NextResponse.json({ error: 'اسم المستخدم غير موجود أو البيانات غير صحيحة' }, { status: 401 });
  }

  const ok = await verifyPassword(password, admin.password_hash);
  if (!ok) {
    return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
  }

  const token = await createSessionToken({ role: 'admin', id: admin.id, name: admin.username });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
