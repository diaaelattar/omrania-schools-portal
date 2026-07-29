import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import DynamicForm from '@/app/components/DynamicForm';

export const dynamic = 'force-dynamic';

export default async function SchoolFormPage({ params }) {
  const session = await getSession();
  const supabase = supabaseAdmin();

  const { data: form } = await supabase
    .from('form_templates')
    .select('id, title, description, schema, is_active')
    .eq('id', params.id)
    .single();

  if (!form || !form.is_active) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <p className="rounded bg-white p-4 shadow">هذا النموذج غير متاح حاليًا.</p>
        <Link href="/school/dashboard" className="mt-4 inline-block text-brand-600 underline">
          العودة للرئيسية
        </Link>
      </main>
    );
  }

  const { data: existing } = await supabase
    .from('submissions')
    .select('data')
    .eq('form_id', form.id)
    .eq('school_id', session.id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-xl p-6">
      <Link href="/school/dashboard" className="mb-4 inline-block text-sm text-brand-600 underline">
        ← العودة للرئيسية
      </Link>
      <h1 className="mb-1 text-xl font-bold text-brand-700">{form.title}</h1>
      {form.description && <p className="mb-4 text-sm text-gray-500">{form.description}</p>}
      <DynamicForm formId={form.id} fields={form.schema.fields || []} initialData={existing?.data} />
    </main>
  );
}
