'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [newSchool, setNewSchool] = useState({ code: '', name: '', username: '', password: '' });
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState('');

  async function loadAll() {
    const [sRes, rRes] = await Promise.all([
      fetch('/api/admin/schools').then((r) => r.json()),
      fetch('/api/admin/reset-requests').then((r) => r.json()),
    ]);
    setSchools(sRes.schools || []);
    setRequests(rRes.requests || []);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleAddSchool(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    const res = await fetch('/api/admin/schools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSchool),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'حدث خطأ');
      return;
    }
    setNewSchool({ code: '', name: '', username: '', password: '' });
    setMessage('تمت إضافة المدرسة');
    loadAll();
  }

  async function handleResetPassword(schoolId) {
    setError('');
    setMessage('');
    const res = await fetch(`/api/admin/schools/${schoolId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: resetPassword }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'حدث خطأ');
      return;
    }
    setMessage('تم تعيين كلمة مرور جديدة، أرسلها للمدرسة');
    setResetTarget(null);
    setResetPassword('');
    loadAll();
  }

  async function handleDelete(schoolId) {
    if (!confirm('متأكد من حذف المدرسة؟ سيتم حذف كل بياناتها المُرسلة أيضًا.')) return;
    await fetch(`/api/admin/schools/${schoolId}`, { method: 'DELETE' });
    loadAll();
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <Link href="/admin/dashboard" className="mb-4 inline-block text-sm text-brand-600 underline">
        ← لوحة التحكم
      </Link>
      <h1 className="mb-6 text-xl font-bold text-brand-700">إدارة المدارس</h1>

      {error && <p className="mb-4 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
      {message && <p className="mb-4 rounded bg-green-50 p-2 text-sm text-green-700">{message}</p>}

      {requests.length > 0 && (
        <div id="reset-requests" className="mb-6 rounded-xl border border-yellow-300 bg-yellow-50 p-4">
          <h2 className="mb-2 font-semibold text-yellow-800">طلبات إعادة تعيين كلمة المرور ({requests.length})</h2>
          <ul className="flex flex-col gap-2">
            {requests.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded bg-white p-2 text-sm">
                <span>{r.schools?.name} ({r.schools?.username})</span>
                <button
                  onClick={() => setResetTarget(r.schools?.id)}
                  className="rounded bg-yellow-500 px-3 py-1 text-white hover:bg-yellow-600"
                >
                  تعيين كلمة مرور جديدة
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleAddSchool} className="mb-6 grid grid-cols-1 gap-3 rounded-xl bg-white p-5 shadow sm:grid-cols-2">
        <h2 className="col-span-full font-semibold">إضافة مدرسة جديدة</h2>
        <input
          placeholder="كود المدرسة"
          className="rounded border px-3 py-2"
          value={newSchool.code}
          onChange={(e) => setNewSchool({ ...newSchool, code: e.target.value })}
          required
        />
        <input
          placeholder="اسم المدرسة"
          className="rounded border px-3 py-2"
          value={newSchool.name}
          onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
          required
        />
        <input
          placeholder="اسم المستخدم (للدخول)"
          className="rounded border px-3 py-2"
          value={newSchool.username}
          onChange={(e) => setNewSchool({ ...newSchool, username: e.target.value })}
          required
        />
        <input
          placeholder="كلمة مرور مبدئية"
          className="rounded border px-3 py-2"
          value={newSchool.password}
          onChange={(e) => setNewSchool({ ...newSchool, password: e.target.value })}
          required
        />
        <button className="col-span-full rounded bg-brand-600 py-2 text-white hover:bg-brand-700">
          إضافة
        </button>
      </form>

      <div className="rounded-xl bg-white shadow">
        <table className="w-full text-right text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">الكود</th>
              <th className="p-3">الاسم</th>
              <th className="p-3">اسم المستخدم</th>
              <th className="p-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3">{s.code}</td>
                <td className="p-3">{s.name}</td>
                <td className="p-3">{s.username}</td>
                <td className="flex gap-2 p-3">
                  {resetTarget === s.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        placeholder="كلمة مرور جديدة"
                        className="rounded border px-2 py-1"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                      />
                      <button
                        onClick={() => handleResetPassword(s.id)}
                        className="rounded bg-brand-600 px-2 py-1 text-white"
                      >
                        حفظ
                      </button>
                      <button onClick={() => setResetTarget(null)} className="text-gray-500">
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setResetTarget(s.id)} className="text-brand-600 underline">
                      إعادة تعيين كلمة المرور
                    </button>
                  )}
                  <button onClick={() => handleDelete(s.id)} className="text-red-600 underline">
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
