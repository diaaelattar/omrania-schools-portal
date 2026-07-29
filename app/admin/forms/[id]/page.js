'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function EditFormPage() {
  const { id } = useParams();
  const router = useRouter();
  const [form, setForm] = useState(null);
  const [schemaText, setSchemaText] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/forms/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.form) {
          setForm(json.form);
          setSchemaText(JSON.stringify(json.form.schema, null, 2));
        }
      });
  }, [id]);

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    const res = await fetch(`/api/admin/forms/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        googleSheetTab: form.google_sheet_tab,
        schemaText,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || 'حدث خطأ');
      return;
    }
    setMessage('تم الحفظ');
  }

  if (!form) return <main className="p-6">جاري التحميل...</main>;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link href="/admin/forms" className="mb-4 inline-block text-sm text-brand-600 underline">
        ← إدارة النماذج
      </Link>
      <h1 className="mb-6 text-xl font-bold text-brand-700">تعديل النموذج</h1>

      {error && <p className="mb-4 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
      {message && <p className="mb-4 rounded bg-green-50 p-2 text-sm text-green-700">{message}</p>}

      <form onSubmit={handleSave} className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow">
        <label className="text-sm font-medium">العنوان</label>
        <input
          className="rounded border px-3 py-2"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <label className="text-sm font-medium">الوصف</label>
        <input
          className="rounded border px-3 py-2"
          value={form.description || ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <label className="text-sm font-medium">اسم تاب جوجل شيت (اختياري)</label>
        <input
          className="rounded border px-3 py-2"
          value={form.google_sheet_tab || ''}
          onChange={(e) => setForm({ ...form, google_sheet_tab: e.target.value })}
        />
        <label className="text-sm font-medium">تعريف الحقول (JSON)</label>
        <textarea
          className="h-64 rounded border px-3 py-2 font-mono text-sm"
          value={schemaText}
          onChange={(e) => setSchemaText(e.target.value)}
        />
        <button disabled={loading} className="rounded bg-brand-600 py-2 text-white hover:bg-brand-700 disabled:opacity-50">
          {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
        </button>
      </form>
    </main>
  );
}
