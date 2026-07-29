import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import LogoutButton from '@/app/components/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = supabaseAdmin();

  const [{ count: schoolsCount }, { count: formsCount }, { count: pendingResets }] = await Promise.all([
    supabase.from('schools').select('*', { count: 'exact', head: true }),
    supabase.from('form_templates').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('password_reset_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const cards = [
    { href: '/admin/schools', title: 'المدارس', value: schoolsCount ?? 0, desc: 'إدارة حسابات المدارس وكلمات المرور' },
    { href: '/admin/forms', title: 'النماذج', value: formsCount ?? 0, desc: 'إدارة نماذج تجميع البيانات لكل فترة' },
    { href: '/admin/submissions', title: 'البيانات المُرسلة', value: '—', desc: 'عرض وتصدير البيانات إلى إكسيل' },
    { href: '/admin/schools#reset-requests', title: 'طلبات إعادة تعيين كلمة المرور', value: pendingResets ?? 0, desc: 'طلبات معلقة من المدارس' },
  ];

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand-700">لوحة تحكم الأدمن</h1>
        <LogoutButton />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="rounded-xl bg-white p-5 shadow hover:bg-brand-50">
            <p className="text-sm text-gray-500">{c.title}</p>
            <p className="text-2xl font-bold text-brand-700">{c.value}</p>
            <p className="mt-1 text-xs text-gray-400">{c.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
