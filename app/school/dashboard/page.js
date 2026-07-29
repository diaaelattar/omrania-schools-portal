import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import LogoutButton from '@/app/components/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function SchoolDashboard() {
  const session = await getSession();
  const supabase = supabaseAdmin();

  const { data: forms } = await supabase
    .from('form_templates')
    .select('id, slug, title, description, is_active, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const { data: mySubmissions } = await supabase
    .from('submissions')
    .select('form_id, submitted_at')
    .eq('school_id', session.id);

  const submittedMap = new Map((mySubmissions || []).map((s) => [s.form_id, s.submitted_at]));

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-700">مرحبًا، {session.name}</h1>
          <p className="text-sm text-gray-500">كود المدرسة: {session.code}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/school/password" className="text-sm text-brand-600 underline">
            تغيير كلمة المرور
          </Link>
          <LogoutButton />
        </div>
      </div>

      <h2 className="mb-3 font-semibold">النماذج المطلوبة حاليًا</h2>
      {(!forms || forms.length === 0) && (
        <p className="rounded bg-white p-4 text-gray-500 shadow">لا توجد نماذج مفتوحة حاليًا.</p>
      )}
      <div className="flex flex-col gap-3">
        {forms?.map((form) => {
          const submittedAt = submittedMap.get(form.id);
          return (
            <Link
              key={form.id}
              href={`/school/forms/${form.id}`}
              className="rounded-lg bg-white p-4 shadow hover:bg-brand-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{form.title}</p>
                  {form.description && <p className="text-sm text-gray-500">{form.description}</p>}
                </div>
                {submittedAt ? (
                  <span className="rounded bg-green-100 px-3 py-1 text-xs text-green-700">
                    تم الإرسال ✓ (يمكن التعديل)
                  </span>
                ) : (
                  <span className="rounded bg-yellow-100 px-3 py-1 text-xs text-yellow-700">
                    لم يتم الإرسال بعد
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
