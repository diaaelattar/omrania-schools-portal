import { NextResponse } from 'next/server';
import { getSession, hashPassword, verifyPassword, createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req) {
  const session = await getSession();
  if (!session || session.role !== 'school') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();
  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: school, error } = await supabase
    .from('schools')
    .select('id, password_hash, must_change_password')
    .eq('id', session.id)
    .single();

  if (error || !school) {
    return NextResponse.json({ error: 'المدرسة غير موجودة' }, { status: 404 });
  }

  // Skip the "current password" check the very first time (must_change_password flow)
  if (!school.must_change_password) {
    if (!currentPassword) {
      return NextResponse.json({ error: 'من فضلك أدخل كلمة المرور الحالية' }, { status: 400 });
    }
    const ok = await verifyPassword(currentPassword, school.password_hash);
    if (!ok) {
      return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 401 });
    }
  }

  const newHash = await hashPassword(newPassword);
  await supabase
    .from('schools')
    .update({ password_hash: newHash, must_change_password: false })
    .eq('id', session.id);

  const token = await createSessionToken({
    role: 'school',
    id: session.id,
    name: session.name,
    code: session.code,
    mustChangePassword: false,
  });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
