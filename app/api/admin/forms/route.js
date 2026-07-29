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
    .from('form_templates')
    .select('id, slug, title, description, is_active, google_sheet_tab, created_at')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  return NextResponse.json({ forms: data });
}

export async function POST(req) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const { slug, title, description, schemaText, googleSheetTab } = await req.json();
  if (!slug || !title || !schemaText) {
    return NextResponse.json({ error: 'الحقول الأساسية مطلوبة' }, { status: 400 });
  }
  let schema;
  try {
    schema = JSON.parse(schemaText);
    if (!Array.isArray(schema.fields)) throw new Error('missing fields[]');
  } catch {
    return NextResponse.json({ error: 'صيغة JSON غير صحيحة، يجب أن تحتوي على fields[]' }, { status: 400 });
  }
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from('form_templates')
    .insert({ slug, title, description, schema, google_sheet_tab: googleSheetTab || null })
    .select('id')
    .single();
  if (error) {
    return NextResponse.json({ error: 'حدث خطأ، تأكد أن الـ slug غير مكرر' }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: data.id });
}
