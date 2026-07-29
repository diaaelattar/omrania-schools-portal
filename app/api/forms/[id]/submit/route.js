import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { flattenSubmission } from '@/lib/xlsx';
import { googleSheetsEnabled, syncTabWithData } from '@/lib/googleSheets';

export async function POST(req, { params }) {
  const session = await getSession();
  if (!session || session.role !== 'school') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const { data } = await req.json();
  const supabase = supabaseAdmin();

  const { data: form } = await supabase
    .from('form_templates')
    .select('id, schema, is_active, google_sheet_tab, title')
    .eq('id', params.id)
    .single();

  if (!form || !form.is_active) {
    return NextResponse.json({ error: 'النموذج غير متاح' }, { status: 404 });
  }

  const { error: upsertError } = await supabase
    .from('submissions')
    .upsert(
      { form_id: form.id, school_id: session.id, data, updated_at: new Date().toISOString() },
      { onConflict: 'form_id,school_id' }
    );

  if (upsertError) {
    return NextResponse.json({ error: 'حدث خطأ أثناء حفظ البيانات' }, { status: 500 });
  }

  // Best-effort Google Sheets sync - never fails the request if it errors out.
  if (googleSheetsEnabled()) {
    try {
      const fields = form.schema.fields || [];
      const { data: allSubmissions } = await supabase
        .from('submissions')
        .select('data, submitted_at, schools(code, name)')
        .eq('form_id', form.id);

      const rows = (allSubmissions || []).map((s) =>
        flattenSubmission(fields, s, s.schools)
      );
      const headerRow = rows[0] ? Object.keys(rows[0]) : [];
      const dataRows = rows.map((r) => Object.values(r));
      await syncTabWithData(form.google_sheet_tab || form.title, headerRow, dataRows);
    } catch (e) {
      console.error('Google Sheets sync failed:', e);
    }
  }

  return NextResponse.json({ ok: true });
}
