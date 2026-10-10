import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { buildXlsxBuffer, flattenSubmission } from '@/lib/xlsx';

export async function GET(req, { params }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const typeFilter = searchParams.get('type'); // 'public' | 'private' | 'all'

  const supabase = supabaseAdmin();
  const { data: form } = await supabase
    .from('form_templates')
    .select('id, title, schema')
    .eq('id', params.formId)
    .single();

  if (!form) return NextResponse.json({ error: 'النموذج غير موجود' }, { status: 404 });

  const { data: rawSubmissions } = await supabase
    .from('submissions')
    .select('data, submitted_at, schools(code, name, type)')
    .eq('form_id', form.id)
    .order('submitted_at', { ascending: true });

  let submissions = rawSubmissions || [];
  let typeLabel = 'الكل';
  if (typeFilter === 'public') {
    submissions = submissions.filter((s) => (s.schools?.type || 'public') === 'public');
    typeLabel = 'رسمي';
  } else if (typeFilter === 'private') {
    submissions = submissions.filter((s) => (s.schools?.type || 'public') === 'private');
    typeLabel = 'خاص';
  }

  const fields = form.schema.fields || [];
  const rows = submissions.map((s) => flattenSubmission(fields, s, s.schools));
  const sheetName = `${form.title.slice(0, 20)}_${typeLabel}`.slice(0, 31);
  const buffer = buildXlsxBuffer(rows, sheetName);

  const baseTitle = form.title.replace(/[^\w\u0600-\u06FF-]+/g, '_');
  const filename = `${baseTitle}_${typeLabel}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
