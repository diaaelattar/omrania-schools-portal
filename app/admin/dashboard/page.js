import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import LogoutButton from '@/app/components/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = supabaseAdmin();

  let schoolsCount = 0;
  let formsCount = 0;
  let pendingResets = 0;
  let activeForms = [];

  try {
    const [schoolsRes, formsRes, resetsRes, activeFormsRes] = await Promise.all([
      supabase.from('schools').select('*', { count: 'exact', head: true }),
      supabase.from('form_templates').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('password_reset_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('form_templates').select('id, title, slug, is_active').eq('is_active', true).order('created_at', { ascending: false }),
    ]);

    schoolsCount = schoolsRes.count ?? 0;
    formsCount = formsRes.count ?? 0;
    pendingResets = resetsRes.count ?? 0;
    activeForms = activeFormsRes.data ?? [];
  } catch (err) {
    console.error('Error fetching dashboard counts:', err);
  }

  const cards = [
    { href: '/admin/schools', title: 'المدارس', value: schoolsCount, desc: 'إدارة حسابات المدارس وكلمات المرور' },
    { href: '/admin/forms', title: 'النماذج', value: formsCount, desc: 'إدارة نماذج تجميع البيانات لكل فترة' },
    { href: '/admin/submissions', title: 'متابعة الإرسال والردود', value: activeForms.length > 0 ? `${activeForms.length} نشط` : '—', desc: 'عرض المدارس المتأخرة وتصدير إكسيل' },
    { href: '/admin/schools#reset-requests', title: 'طلبات إعادة تعيين كلمة المرور', value: pendingResets, desc: 'طلبات معلقة من المدارس' },
  ];

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-700">لوحة تحكم الأدمن</h1>
          <p className="text-sm text-gray-500">إدارة بوابة تجميع بيانات وإحصاءات المدارس</p>
        </div>
        <LogoutButton />
      </div>

      {/* Notice if no schools exist */}
      {schoolsCount === 0 && (
        <div className="mb-6 rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-yellow-900 shadow-sm flex items-center justify-between">
          <div>
            <p className="font-bold text-sm">⚠️ لم تتم إضافة مدارس للنظام بعد</p>
            <p className="text-xs text-yellow-800 mt-0.5">
              لتتمكن من معرفة المدارس التي لم ترسل الإحصاء، يجب أولاً إضافة حسابات المدارس.
            </p>
          </div>
          <Link
            href="/admin/schools"
            className="rounded bg-yellow-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-yellow-700 whitespace-nowrap"
          >
            إضافة مدارس ←
          </Link>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="rounded-xl bg-white p-5 shadow transition hover:shadow-md hover:bg-brand-50/50">
            <p className="text-sm text-gray-500">{c.title}</p>
            <p className="text-2xl font-bold text-brand-700 mt-1">{c.value}</p>
            <p className="mt-1 text-xs text-gray-400">{c.desc}</p>
          </Link>
        ))}
      </div>

      {/* Active Forms Quick Action Section */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">النماذج والإحصاءات النشطة حالياً</h2>
          <Link href="/admin/forms" className="text-xs text-brand-600 underline">
            + إدارة أو إنشاء نموذج
          </Link>
        </div>

        {activeForms.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-center text-sm text-gray-500 shadow">
            لا يوجد أي إحصاء أو نموذج نشط حالياً. يمكنك تفعيل النماذج من صفحة <Link href="/admin/forms" className="text-brand-600 underline">إدارة النماذج</Link>.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeForms.map((f) => (
              <div
                key={f.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl bg-white p-4 shadow border-r-4 border-brand-500 gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    <p className="font-semibold text-gray-800">{f.title}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">المعرف: {f.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/submissions?form=${f.id}`}
                    className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-brand-700 text-center"
                  >
                    متابعة الردود والمدارس المتأخرة ←
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
