import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-800 text-xs font-semibold shadow-xs">
        إدارة العمرانية التعليمية - التعليم الابتدائي
      </div>
      <div>
        <h1 className="text-3xl font-extrabold text-brand-700">بوابة تجميع بيانات وإحصاءات المدارس</h1>
        <p className="mt-2 text-sm text-slate-600 max-w-md">
          المنظومة الإلكترونية الموحدة لجمع وتدقيق الإحصاءات والبيانات الدورية للمدارس الابتدائية
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/school/login"
          className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-md hover:bg-brand-700 transition"
        >
          دخول المدرسة ←
        </Link>
        <Link
          href="/admin/login"
          className="rounded-xl border border-brand-600 px-6 py-3 font-semibold text-brand-700 hover:bg-brand-50 transition"
        >
          دخول لوحة الإدارة
        </Link>
      </div>

      <footer className="mt-8 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700">إدارة العمرانية التعليمية - التعليم الابتدائي</p>
        <p>
          مدير عام الإدارة: <strong className="text-slate-800">أ / غادة شحاتة</strong> • مدير التعليم الابتدائي: <strong className="text-slate-800">أ / هشام محمود كامل</strong>
        </p>
      </footer>
    </main>
  );
}
