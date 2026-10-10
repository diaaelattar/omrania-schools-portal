import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const formId = searchParams.get('form');
  const typeFilter = searchParams.get('type'); // 'public' | 'private' | 'all'
  if (!formId) return NextResponse.json({ error: 'form مطلوب' }, { status: 400 });

  const supabase = supabaseAdmin();

  try {
    const [formRes, subsRes, schoolsRes] = await Promise.all([
      supabase
        .from('form_templates')
        .select('id, title, schema, is_active')
        .eq('id', formId)
        .maybeSingle(),
      supabase
        .from('submissions')
        .select('id, data, submitted_at, updated_at, schools(id, code, name, type)')
        .eq('form_id', formId)
        .order('updated_at', { ascending: false }),
      supabase
        .from('schools')
        .select('id, code, name, type')
        .order('name', { ascending: true }),
    ]);

    if (formRes.error) {
      return NextResponse.json({ error: 'خطأ في جلب بيانات النموذج: ' + formRes.error.message }, { status: 500 });
    }
    if (!formRes.data) {
      return NextResponse.json({ error: 'النموذج غير موجود أو تم حذفه' }, { status: 404 });
    }
    if (schoolsRes.error) {
      return NextResponse.json({ error: 'خطأ في جلب قائمة المدارس: ' + schoolsRes.error.message }, { status: 500 });
    }
    if (subsRes.error) {
      return NextResponse.json({ error: 'خطأ في جلب الردود: ' + subsRes.error.message }, { status: 500 });
    }

    const form = formRes.data;
    let rawSubmissions = subsRes.data || [];
    let allSchools = schoolsRes.data || [];

    // Apply type filter if specified and not 'all'
    if (typeFilter === 'public' || typeFilter === 'private') {
      allSchools = allSchools.filter((s) => (s.type || 'public') === typeFilter);
      rawSubmissions = rawSubmissions.filter(
        (s) => (s.schools?.type || 'public') === typeFilter
      );
    }

    const submittedIds = new Set(
      rawSubmissions
        .map((s) => s.schools?.id)
        .filter(Boolean)
    );
    const missing = allSchools.filter((s) => !submittedIds.has(s.id));

    return NextResponse.json({
      form,
      submissions: rawSubmissions,
      missingSchools: missing,
      totalSchoolsCount: allSchools.length,
    });
  } catch (err) {
    return NextResponse.json({ error: 'حدث خطأ غير متوقع: ' + (err.message || 'فشل الاتصال') }, { status: 500 });
  }
}

