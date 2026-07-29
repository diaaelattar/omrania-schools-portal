import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== 'school') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const supabase = supabaseAdmin();

  // Avoid duplicate pending requests
  const { data: existing } = await supabase
    .from('password_reset_requests')
    .select('id')
    .eq('school_id', session.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, message: 'طلبك موجود بالفعل وينتظر مراجعة الأدمن' });
  }

  await supabase.from('password_reset_requests').insert({ school_id: session.id });
  return NextResponse.json({ ok: true, message: 'تم إرسال طلبك للأدمن' });
}
