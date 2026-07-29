'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DynamicForm({ formId, fields, initialData }) {
  const router = useRouter();
  const [values, setValues] = useState(initialData || {});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function setField(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    for (const field of fields) {
      if (field.required && (values[field.key] === undefined || values[field.key] === '')) {
        setError(`الحقل "${field.label}" مطلوب`);
        return;
      }
    }
    setLoading(true);
    const res = await fetch(`/api/forms/${formId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: values }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || 'حدث خطأ أثناء الإرسال');
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow">
      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
      {success && <p className="rounded bg-green-50 p-2 text-sm text-green-700">تم إرسال البيانات بنجاح ✓</p>}

      {fields.map((field) => (
        <div key={field.key}>
          <label className="mb-1 block text-sm font-medium">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>

          {field.type === 'textarea' ? (
            <textarea
              className="w-full rounded border px-3 py-2"
              rows={3}
              value={values[field.key] || ''}
              onChange={(e) => setField(field.key, e.target.value)}
            />
          ) : field.type === 'select' ? (
            <select
              className="w-full rounded border px-3 py-2"
              value={values[field.key] || ''}
              onChange={(e) => setField(field.key, e.target.value)}
            >
              <option value="">اختر...</option>
              {(field.options || []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : field.type === 'number' ? (
            <input
              type="number"
              className="w-full rounded border px-3 py-2"
              value={values[field.key] ?? ''}
              onChange={(e) => setField(field.key, e.target.value)}
            />
          ) : field.type === 'date' ? (
            <input
              type="date"
              className="w-full rounded border px-3 py-2"
              value={values[field.key] || ''}
              onChange={(e) => setField(field.key, e.target.value)}
            />
          ) : (
            <input
              type="text"
              className="w-full rounded border px-3 py-2"
              value={values[field.key] || ''}
              onChange={(e) => setField(field.key, e.target.value)}
            />
          )}
        </div>
      ))}

      <button
        disabled={loading}
        className="mt-2 w-full rounded bg-brand-600 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? 'جاري الإرسال...' : 'إرسال / تحديث البيانات'}
      </button>
    </form>
  );
}
