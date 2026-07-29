'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

function SubmissionsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const formId = searchParams.get('form') || '';

  const [forms, setForms] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/forms')
      .then((r) => r.json())
      .then((json) => setForms(json.forms || []));
  }, []);

  useEffect(() => {
    if (!formId) {
      setResult(null);
      return;
    }
    setLoading(true);
    fetch(`/api/admin/submissions?form=${formId}`)
      .then((r) => r.json())
      .then((json) => setResult(json))
      .finally(() => setLoading(false));
  }, [formId]);

  const fields = result?.form?.schema?.fields || [];

  return (
    <main className="mx-auto max-w-5xl p-6">
      <Link href="/admin/dashboard" className="mb-4 inline-block text-sm text-brand-600 underline">
        ← لوحة التحكم
      </Link>
      <h1 className="mb-6 text-xl font-bold text-brand-700">البيانات المُرسلة</h1>

      <select
        className="mb-6 rounded border px-3 py-2"
        value={formId}
        onChange={(e) => router.push(`/admin/submissions?form=${e.target.value}`)}
      >
        <option value="">اختر النموذج...</option>
        {forms.map((f) => (
          <option key={f.id} value={f.id}>
            {f.title}
          </option>
        ))}
      </select>

      {loading && <p>جاري التحميل...</p>}

      {result?.form && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              عدد المدارس التي أرسلت: {result.submissions.length} — لم ترسل بعد: {result.missingSchools.length}
            </p>
            <a
              href={`/api/admin/export/${formId}`}
              className="rounded bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700"
            >
              تصدير إلى إكسيل
            </a>
          </div>

          <div className="overflow-x-auto rounded-xl bg-white shadow">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3">المدرسة</th>
                  <th className="p-3">الكود</th>
                  {fields.map((f) => (
                    <th key={f.key} className="p-3">
                      {f.label}
                    </th>
                  ))}
                  <th className="p-3">آخر تحديث</th>
                </tr>
              </thead>
              <tbody>
                {result.submissions.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="p-3">{s.schools?.name}</td>
                    <td className="p-3">{s.schools?.code}</td>
                    {fields.map((f) => (
                      <td key={f.key} className="p-3">
                        {Array.isArray(s.data?.[f.key]) ? s.data[f.key].join('، ') : s.data?.[f.key] ?? ''}
                      </td>
                    ))}
                    <td className="p-3">{new Date(s.updated_at).toLocaleString('ar-EG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.missingSchools.length > 0 && (
            <div className="mt-6 rounded-xl border border-yellow-300 bg-yellow-50 p-4">
              <h2 className="mb-2 font-semibold text-yellow-800">مدارس لم ترسل بعد</h2>
              <ul className="flex flex-wrap gap-2 text-sm">
                {result.missingSchools.map((s) => (
                  <li key={s.id} className="rounded bg-white px-3 py-1 shadow-sm">
                    {s.name} ({s.code})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default function AdminSubmissionsPage() {
  return (
    <Suspense fallback={<main className="p-6">جاري التحميل...</main>}>
      <SubmissionsInner />
    </Suspense>
  );
}
