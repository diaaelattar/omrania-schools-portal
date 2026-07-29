import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function requireAdmin() {
  const session = await getSession();
  return session && session.role === 'admin' ? session : null;
}

export async function GET(req, { params }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from('form_templates')
    .select('id, slug, title, description, schema, is_active, google_sheet_tab')
    .eq('id', params.id)
    .single();
  if (error || !data) return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
  return NextResponse.json({ form: data });
}

export async function PATCH(req, { params }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const body = await req.json();
  const update = { updated_at: new Date().toISOString() };

  if (typeof body.is_active === 'boolean') update.is_active = body.is_active;
  if (body.title) update.title = body.title;
  if (body.description !== undefined) update.description = body.description;
  if (body.googleSheetTab !== undefined) update.google_sheet_tab = body.googleSheetTab || null;
  if (body.schemaText) {
    try {
      const schema = JSON.parse(body.schemaText);
      if (!Array.isArray(schema.fields)) throw new Error('missing fields[]');
      update.schema = schema;
    } catch {
      return NextResponse.json({ error: 'صيغة JSON غير صحيحة' }, { status: 400 });
    }
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase.from('form_templates').update(update).eq('id', params.id);
  if (error) return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const supabase = supabaseAdmin();
  const { error } = await supabase.from('form_templates').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
