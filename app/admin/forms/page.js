'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const EXAMPLE_SCHEMA = `{
  "fields": [
    { "key": "students_count", "label": "عدد الطلاب", "type": "number", "required": true },
    { "key": "stage", "label": "المرحلة", "type": "select", "options": ["ابتدائي", "اعدادي", "ثانوي"], "required": true },
    { "key": "notes", "label": "ملاحظات", "type": "textarea", "required": false }
  ]
}`;

export default function AdminFormsPage() {
  const [forms, setForms] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [newForm, setNewForm] = useState({
    slug: '',
    title: '',
    description: '',
    schemaText: EXAMPLE_SCHEMA,
    googleSheetTab: '',
  });

  async function loadForms() {
    const res = await fetch('/api/admin/forms').then((r) => r.json());
    setForms(res.forms || []);
  }

  useEffect(() => {
    loadForms();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    const res = await fetch('/api/admin/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newForm),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'حدث خطأ');
      return;
    }
    setMessage('تم إنشاء النموذج');
    setNewForm({ slug: '', title: '', description: '', schemaText: EXAMPLE_SCHEMA, googleSheetTab: '' });
    loadForms();
  }

  async function toggleActive(form) {
    await fetch(`/api/admin/forms/${form.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !form.is_active }),
    });
    loadForms();
  }

  async function handleDelete(id) {
    if (!confirm('متأكد من حذف النموذج؟ سيتم حذف كل الردود المرتبطة به.')) return;
    await fetch(`/api/admin/forms/${id}`, { method: 'DELETE' });
    loadForms();
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <Link href="/admin/dashboard" className="mb-4 inline-block text-sm text-brand-600 underline">
        ← لوحة التحكم
      </Link>
      <h1 className="mb-6 text-xl font-bold text-brand-700">إدارة النماذج</h1>

      {error && <p className="mb-4 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
      {message && <p className="mb-4 rounded bg-green-50 p-2 text-sm text-green-700">{message}</p>}

      <form onSubmit={handleCreate} className="mb-6 flex flex-col gap-3 rounded-xl bg-white p-5 shadow">
        <h2 className="font-semibold">إنشاء نموذج جديد</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            placeholder="slug (بالإنجليزي، مثال: round1-2026)"
            className="rounded border px-3 py-2"
            value={newForm.slug}
            onChange={(e) => setNewForm({ ...newForm, slug: e.target.value })}
            required
          />
          <input
            placeholder="عنوان النموذج"
            className="rounded border px-3 py-2"
            value={newForm.title}
            onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
            required
          />
        </div>
        <input
          placeholder="وصف مختصر (اختياري)"
          className="rounded border px-3 py-2"
          value={newForm.description}
          onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
        />
        <input
          placeholder="اسم تاب جوجل شيت (اختياري، لو مفعّل التزامن)"
          className="rounded border px-3 py-2"
          value={newForm.googleSheetTab}
          onChange={(e) => setNewForm({ ...newForm, googleSheetTab: e.target.value })}
        />
        <label className="text-sm font-medium">تعريف الحقول (JSON)</label>
        <textarea
          className="h-48 rounded border px-3 py-2 font-mono text-sm"
          value={newForm.schemaText}
          onChange={(e) => setNewForm({ ...newForm, schemaText: e.target.value })}
        />
        <p className="text-xs text-gray-400">
          أنواع الحقول المتاحة: text, number, textarea, select (مع options[]), date
        </p>
        <button className="rounded bg-brand-600 py-2 text-white hover:bg-brand-700">إنشاء</button>
      </form>

      <div className="flex flex-col gap-3">
        {forms.map((f) => (
          <div key={f.id} className="rounded-xl bg-white p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{f.title}</p>
                <p className="text-xs text-gray-400">slug: {f.slug}</p>
              </div>
              <span
                className={`rounded px-2 py-1 text-xs ${
                  f.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {f.is_active ? 'مفعّل' : 'متوقف'}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <Link href={`/admin/forms/${f.id}`} className="text-brand-600 underline">
                تعديل الحقول
              </Link>
              <Link href={`/admin/submissions?form=${f.id}`} className="text-brand-600 underline">
                عرض الردود / تصدير إكسيل
              </Link>
              <button onClick={() => toggleActive(f)} className="text-yellow-700 underline">
                {f.is_active ? 'إيقاف' : 'تفعيل'}
              </button>
              <button onClick={() => handleDelete(f.id)} className="text-red-600 underline">
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
