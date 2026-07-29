import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { buildXlsxBuffer, flattenSubmission } from '@/lib/xlsx';

export async function GET(req, { params }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const supabase = supabaseAdmin();
  const { data: form } = await supabase
    .from('form_templates')
    .select('id, title, schema')
    .eq('id', params.formId)
    .single();

  if (!form) return NextResponse.json({ error: 'النموذج غير موجود' }, { status: 404 });

  const { data: submissions } = await supabase
    .from('submissions')
    .select('data, submitted_at, schools(code, name)')
    .eq('form_id', form.id)
    .order('submitted_at', { ascending: true });

  const fields = form.schema.fields || [];
  const rows = (submissions || []).map((s) => flattenSubmission(fields, s, s.schools));
  const buffer = buildXlsxBuffer(rows, form.title.slice(0, 30) || 'Data');

  const filename = `${form.title.replace(/[^\w\u0600-\u06FF-]+/g, '_')}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
