import { NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function requireAdmin() {
  const session = await getSession();
  return session && session.role === 'admin' ? session : null;
}

// Reset a school's password (admin sets a new temporary password)
export async function PATCH(req, { params }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const { newPassword } = await req.json();
  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 });
  }
  const supabase = supabaseAdmin();
  const password_hash = await hashPassword(newPassword);
  const { error } = await supabase
    .from('schools')
    .update({ password_hash, must_change_password: true })
    .eq('id', params.id);
  if (error) return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });

  // Auto-resolve any pending reset request for this school
  await supabase
    .from('password_reset_requests')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('school_id', params.id)
    .eq('status', 'pending');

  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const supabase = supabaseAdmin();
  const { error } = await supabase.from('schools').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
