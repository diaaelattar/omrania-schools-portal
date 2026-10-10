import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import LogoutButton from '@/app/components/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard({ searchParams }) {
  const sp = await Promise.resolve(searchParams);
  const currentType = sp?.type || 'all'; // 'all' | 'public' | 'private'

  const supabase = supabaseAdmin();

  let schoolsList = [];
  let formsCount = 0;
  let resetRequests = [];
  let activeForms = [];

  try {
    const [schoolsRes, formsRes, resetsRes, activeFormsRes] = await Promise.all([
      supabase.from('schools').select('id, type'),
      supabase.from('form_templates').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('password_reset_requests').select('id, schools(type)').eq('status', 'pending'),
      supabase.from('form_templates').select('id, title, slug, is_active').eq('is_active', true).order('created_at', { ascending: false }),
    ]);

    schoolsList = schoolsRes.data || [];
    formsCount = formsRes.count ?? 0;
    resetRequests = resetsRes.data || [];
    activeForms = activeFormsRes.data ?? [];
  } catch (err) {
    console.error('Error fetching dashboard counts:', err);
  }

  // Calculate counts by school type
  const totalSchools = schoolsList.length;
  const publicCount = schoolsList.filter((s) => (s.type || 'public') === 'public').length;
  const privateCount = schoolsList.filter((s) => (s.type || 'public') === 'private').length;

  const currentSchoolsCount =
    currentType === 'public'
      ? publicCount
      : currentType === 'private'
      ? privateCount
      : totalSchools;

  // Filter pending password resets by school type
  const currentPendingResets = resetRequests.filter((r) => {
    if (currentType === 'all') return true;
    return (r.schools?.type || 'public') === currentType;
  }).length;

  const typeSuffix = currentType !== 'all' ? `?type=${currentType}` : '';

  const cards = [
    {
      href: `/admin/schools${typeSuffix}`,
      title: currentType === 'public' ? 'المدارس الرسمية' : currentType === 'private' ? 'المدارس الخاصة' : 'المدارس',
      value: currentSchoolsCount,
      desc: currentType === 'public' ? 'إدارة حسابات المدارس الحكومية' : currentType === 'private' ? 'إدارة حسابات المدارس الخاصة' : 'إدارة جميع حسابات المدارس',
      icon: currentType === 'public' ? '🏛️' : currentType === 'private' ? '🏢' : '🏫',
    },
    {
      href: '/admin/forms',
      title: 'النماذج والإحصاءات',
      value: formsCount,
      desc: 'إدارة استمارات تجميع البيانات',
      icon: '📝',
    },
    {
      href: `/admin/submissions${typeSuffix}`,
      title: 'متابعة الإرسال والردود',
      value: activeForms.length > 0 ? `${activeForms.length} نشط` : '—',
      desc: `متابعة المتأخرين وتصدير إكسيل (${currentType === 'public' ? 'رسمي' : currentType === 'private' ? 'خاص' : 'الكل'})`,
      icon: '📊',
    },
    {
      href: `/admin/schools${typeSuffix}#reset-requests`,
      title: 'طلبات إعادة تعيين كلمة المرور',
      value: currentPendingResets,
      desc: `طلبات معلقة (${currentType === 'public' ? 'رسمي' : currentType === 'private' ? 'خاص' : 'الكل'})`,
      icon: '🔑',
    },
  ];

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-700">لوحة تحكم الأدمن</h1>
          <p className="text-sm text-gray-500">إدارة العمرانية التعليمية - قسم التعليم الابتدائي</p>
        </div>
        <LogoutButton />
      </div>

      {/* Main School Type Switcher */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">تصفية العرض حسب النوع:</span>
          <span className="text-xs text-slate-500">
            {currentType === 'public' ? '(المدارس الرسمية)' : currentType === 'private' ? '(المدارس الخاصة)' : '(عرض شامل للكل)'}
          </span>
        </div>

        <div className="inline-flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
          <Link
            href="/admin/dashboard"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              currentType === 'all'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <span>🌐</span>
            <span>عرض الكل</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] ${currentType === 'all' ? 'bg-white/20' : 'bg-slate-200'}`}>
              {totalSchools}
            </span>
          </Link>

          <Link
            href="/admin/dashboard?type=public"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              currentType === 'public'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <span>🏛️</span>
            <span>المدارس الرسمية</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] ${currentType === 'public' ? 'bg-white/20' : 'bg-slate-200'}`}>
              {publicCount}
            </span>
          </Link>

          <Link
            href="/admin/dashboard?type=private"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              currentType === 'private'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <span>🏢</span>
            <span>المدارس الخاصة</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] ${currentType === 'private' ? 'bg-white/20' : 'bg-slate-200'}`}>
              {privateCount}
            </span>
          </Link>
        </div>
      </div>

      {/* Notice if no schools exist */}
      {totalSchools === 0 && (
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
          <Link
            key={c.href}
            href={c.href}
            className="rounded-2xl bg-white p-5 shadow transition hover:shadow-md hover:bg-brand-50/40 border border-slate-100 flex items-start justify-between"
          >
            <div>
              <p className="text-sm font-medium text-gray-500">{c.title}</p>
              <p className="text-2xl font-bold text-brand-700 mt-1">{c.value}</p>
              <p className="mt-1 text-xs text-gray-400">{c.desc}</p>
            </div>
            <span className="text-2xl p-2 rounded-xl bg-slate-50 border border-slate-100">
              {c.icon}
            </span>
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
          <div className="rounded-xl bg-white p-6 text-center text-sm text-gray-500 shadow border border-slate-100">
            لا يوجد أي إحصاء أو نموذج نشط حالياً. يمكنك تفعيل النماذج من صفحة <Link href="/admin/forms" className="text-brand-600 underline">إدارة النماذج</Link>.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeForms.map((f) => (
              <div
                key={f.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl bg-white p-4 shadow border-r-4 border-brand-500 gap-3 border border-slate-100"
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
                    href={`/admin/submissions?form=${f.id}${typeSuffix}`}
                    className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-brand-700 text-center"
                  >
                    متابعة الردود والمتأخرين ({currentType === 'public' ? 'رسمي' : currentType === 'private' ? 'خاص' : 'الكل'}) ←
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
