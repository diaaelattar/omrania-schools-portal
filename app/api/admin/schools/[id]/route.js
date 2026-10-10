import { NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function requireAdmin() {
  const session = await getSession();
  return session && session.role === 'admin' ? session : null;
}

// Reset a school's password or update school type/name
export async function PATCH(req, { params }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const body = await req.json();
  const supabase = supabaseAdmin();

  const updates = {};
  if (body.newPassword) {
    if (body.newPassword.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 });
    }
    updates.password_hash = await hashPassword(body.newPassword);
    updates.must_change_password = true;
  }

  if (body.type && (body.type === 'public' || body.type === 'private')) {
    updates.type = body.type;
  }

  if (body.name && body.name.trim()) {
    updates.name = body.name.trim();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'لا توجد بيانات للتعديل' }, { status: 400 });
  }

  const { error } = await supabase
    .from('schools')
    .update(updates)
    .eq('id', params.id);
  if (error) return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });

  // Auto-resolve any pending reset request for this school if password was updated
  if (updates.password_hash) {
    await supabase
      .from('password_reset_requests')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('school_id', params.id)
      .eq('status', 'pending');
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const supabase = supabaseAdmin();
  const { error } = await supabase.from('schools').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
