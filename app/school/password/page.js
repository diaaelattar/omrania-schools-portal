'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SchoolPasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleChange(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    const res = await fetch('/api/school/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || 'حدث خطأ');
      return;
    }
    router.push('/school/dashboard');
    router.refresh();
  }

  async function handleRequestReset() {
    setError('');
    setMessage('');
    const res = await fetch('/api/school/request-reset', { method: 'POST' });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'حدث خطأ');
      return;
    }
    setMessage(json.message);
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-6 text-xl font-bold text-brand-700">تغيير كلمة المرور</h1>
      {error && <p className="mb-4 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
      {message && <p className="mb-4 rounded bg-green-50 p-2 text-sm text-green-700">{message}</p>}
      <form onSubmit={handleChange} className="rounded-xl bg-white p-6 shadow">
        <label className="mb-1 block text-sm font-medium">كلمة المرور الحالية (اتركها فارغة لو دي أول مرة)</label>
        <input
          type="password"
          className="mb-4 w-full rounded border px-3 py-2"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <label className="mb-1 block text-sm font-medium">كلمة المرور الجديدة</label>
        <input
          type="password"
          className="mb-6 w-full rounded border px-3 py-2"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
        />
        <button
          disabled={loading}
          className="w-full rounded bg-brand-600 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        نسيت كلمة المرور الحالية؟{' '}
        <button onClick={handleRequestReset} className="text-brand-600 underline">
          اطلب من الأدمن إعادة تعيينها
        </button>
      </p>
    </main>
  );
}
