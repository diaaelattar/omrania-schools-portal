import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold text-brand-700">بوابة تجميع بيانات المدارس</h1>
      <div className="flex gap-4">
        <Link
          href="/school/login"
          className="rounded-lg bg-brand-600 px-6 py-3 text-white hover:bg-brand-700"
        >
          دخول المدرسة
        </Link>
        <Link
          href="/admin/login"
          className="rounded-lg border border-brand-600 px-6 py-3 text-brand-700 hover:bg-brand-50"
        >
          دخول الأدمن
        </Link>
      </div>
    </main>
  );
}
