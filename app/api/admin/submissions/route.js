import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const formId = searchParams.get('form');
  if (!formId) return NextResponse.json({ error: 'form مطلوب' }, { status: 400 });

  const supabase = supabaseAdmin();

  const { data: form } = await supabase
    .from('form_templates')
    .select('id, title, schema')
    .eq('id', formId)
    .single();

  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, data, submitted_at, updated_at, schools(id, code, name)')
    .eq('form_id', formId)
    .order('updated_at', { ascending: false });

  const { data: allSchools } = await supabase.from('schools').select('id, code, name');
  const submittedIds = new Set((submissions || []).map((s) => s.schools?.id));
  const missing = (allSchools || []).filter((s) => !submittedIds.has(s.id));

  return NextResponse.json({ form, submissions: submissions || [], missingSchools: missing });
}
