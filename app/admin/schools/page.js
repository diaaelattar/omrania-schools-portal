'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import SchoolTypeFilter from '@/app/components/SchoolTypeFilter';

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'public' | 'private'
  const [searchQuery, setSearchQuery] = useState('');

  const [newSchool, setNewSchool] = useState({
    code: '',
    name: '',
    type: 'public',
    username: '',
    password: '',
  });

  const [resetTarget, setResetTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [editingTypeTarget, setEditingTypeTarget] = useState(null);

  async function loadAll() {
    try {
      const [sRes, rRes] = await Promise.all([
        fetch('/api/admin/schools').then((r) => r.json()),
        fetch('/api/admin/reset-requests').then((r) => r.json()),
      ]);
      setSchools(sRes.schools || []);
      setRequests(rRes.requests || []);
    } catch {
      setError('تعذر تحميل البيانات من الخادم');
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  // Compute counts for the filter pills
  const counts = useMemo(() => {
    let pub = 0;
    let priv = 0;
    schools.forEach((s) => {
      if ((s.type || 'public') === 'private') priv++;
      else pub++;
    });
    return { all: schools.length, public: pub, private: priv };
  }, [schools]);

  // Filtered schools based on selected type and search query
  const filteredSchools = useMemo(() => {
    return schools.filter((s) => {
      const matchesType =
        typeFilter === 'all' ? true : (s.type || 'public') === typeFilter;
      if (!matchesType) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        s.name?.toLowerCase().includes(q) ||
        s.code?.toLowerCase().includes(q) ||
        s.username?.toLowerCase().includes(q)
      );
    });
  }, [schools, typeFilter, searchQuery]);

  // Filtered reset requests based on selected type
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (typeFilter === 'all') return true;
      return (r.schools?.type || 'public') === typeFilter;
    });
  }, [requests, typeFilter]);

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
      setError(json.error || 'حدث خطأ أثناء إضافة المدرسة');
      return;
    }
    setNewSchool({ code: '', name: '', type: newSchool.type, username: '', password: '' });
    setMessage('تمت إضافة المدرسة بنجاح');
    loadAll();
  }

  async function handleToggleType(school) {
    const currentType = school.type || 'public';
    const nextType = currentType === 'public' ? 'private' : 'public';
    const label = nextType === 'public' ? 'رسمية (حكومية)' : 'خاصة';

    if (!confirm(`هل أنت متأكد من تغيير تصنيف مدرسة "${school.name}" لتصبح مدرسة ${label}؟`)) {
      return;
    }

    const res = await fetch(`/api/admin/schools/${school.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: nextType }),
    });

    if (res.ok) {
      setMessage(`تم تحويل تصنيف المدرسة إلى ${label}`);
      loadAll();
    } else {
      setError('تعذر تحديث تصنيف المدرسة');
    }
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
    <main className="mx-auto max-w-5xl p-6">
      <Link href="/admin/dashboard" className="mb-4 inline-block text-sm text-brand-600 underline">
        ← لوحة التحكم
      </Link>
      
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-700">إدارة حسابات المدارس</h1>
          <p className="text-sm text-gray-500">إدارة المدارس الرسمية والخاصة، كلمات المرور، والطلبات</p>
        </div>
      </div>

      {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600 border border-red-200">{error}</p>}
      {message && <p className="mb-4 rounded-xl bg-green-50 p-3 text-sm text-green-700 border border-green-200">{message}</p>}

      {/* Reset Requests Section */}
      {filteredRequests.length > 0 && (
        <div id="reset-requests" className="mb-6 rounded-2xl border border-yellow-300 bg-yellow-50/80 p-5 shadow-sm">
          <h2 className="mb-3 font-bold text-yellow-900 flex items-center gap-2">
            <span>🔑</span>
            <span>طلبات إعادة تعيين كلمة المرور المعلقة ({filteredRequests.length})</span>
          </h2>
          <ul className="flex flex-col gap-2">
            {filteredRequests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3 text-sm shadow-xs border border-yellow-200">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{r.schools?.name}</span>
                  <span className="text-xs text-slate-400">({r.schools?.username})</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                      (r.schools?.type || 'public') === 'private'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    {(r.schools?.type || 'public') === 'private' ? 'خاصة' : 'رسمية'}
                  </span>
                </div>
                <button
                  onClick={() => setResetTarget(r.schools?.id)}
                  className="rounded-lg bg-yellow-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-yellow-700 transition"
                >
                  تعيين كلمة مرور جديدة
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add School Form */}
      <form onSubmit={handleAddSchool} className="mb-8 rounded-2xl bg-white p-6 shadow border border-slate-100">
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <h2 className="font-bold text-slate-800 text-base">إضافة مدرسة جديدة</h2>
          <span className="text-xs text-slate-400">حدد نوع المدرسة بعناية (رسمي أو خاص)</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">كود المدرسة:</label>
            <input
              placeholder="مثال: 10234"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={newSchool.code}
              onChange={(e) => setNewSchool({ ...newSchool, code: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">اسم المدرسة:</label>
            <input
              placeholder="مثال: مدرسة الفاروق الابتدائية"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={newSchool.name}
              onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">نوع وتصنيف المدرسة:</label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={newSchool.type}
              onChange={(e) => setNewSchool({ ...newSchool, type: e.target.value })}
            >
              <option value="public">🏛️ مدرسة رسمية (حكومية)</option>
              <option value="private">🏢 مدرسة خاصة</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">اسم المستخدم (للدخول):</label>
            <input
              placeholder="مثال: alfaroq"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={newSchool.username}
              onChange={(e) => setNewSchool({ ...newSchool, username: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">كلمة المرور المبدئية:</label>
            <input
              placeholder="كلمة مرور مبدئية"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={newSchool.password}
              onChange={(e) => setNewSchool({ ...newSchool, password: e.target.value })}
              required
            />
          </div>

          <div className="flex items-end">
            <button className="w-full rounded-xl bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700 transition shadow">
              + إضافة المدرسة للنظام
            </button>
          </div>
        </div>
      </form>

      {/* Filter and Search Bar */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <SchoolTypeFilter
          value={typeFilter}
          onChange={setTypeFilter}
          counts={counts}
        />

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="🔍 بحث باسم المدرسة أو الكود..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Schools Table */}
      <div className="overflow-x-auto rounded-2xl bg-white shadow border border-slate-100">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
            <tr>
              <th className="p-3.5">الكود</th>
              <th className="p-3.5">اسم المدرسة</th>
              <th className="p-3.5 whitespace-nowrap">النوع والتصنيف</th>
              <th className="p-3.5">اسم المستخدم</th>
              <th className="p-3.5 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSchools.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500">
                  لا توجد أي مدرسة مطابقة للتصفية الحالية.
                </td>
              </tr>
            ) : (
              filteredSchools.map((s) => {
                const isPriv = (s.type || 'public') === 'private';
                return (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 font-mono text-slate-600">{s.code}</td>
                    <td className="p-3.5 font-semibold text-slate-900">{s.name}</td>
                    <td className="p-3.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleType(s)}
                        title="انقر لتغيير تصنيف المدرسة بين رسمي وخاص"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition hover:opacity-80 cursor-pointer ${
                          isPriv
                            ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                            : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                        }`}
                      >
                        <span>{isPriv ? '🏢 خاصة' : '🏛️ رسمية'}</span>
                        <span className="text-[10px] text-slate-400">⇄ تغيير</span>
                      </button>
                    </td>
                    <td className="p-3.5 font-mono text-xs text-slate-500">{s.username}</td>
                    <td className="p-3.5">
                      <div className="flex items-center justify-center gap-3">
                        {resetTarget === s.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              placeholder="كلمة جديدة"
                              className="w-28 rounded border border-slate-300 px-2 py-1 text-xs"
                              value={resetPassword}
                              onChange={(e) => setResetPassword(e.target.value)}
                            />
                            <button
                              onClick={() => handleResetPassword(s.id)}
                              className="rounded bg-brand-600 px-2 py-1 text-xs text-white hover:bg-brand-700"
                            >
                              حفظ
                            </button>
                            <button
                              onClick={() => setResetTarget(null)}
                              className="text-xs text-slate-400 hover:text-slate-600"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setResetTarget(s.id)}
                            className="text-xs text-brand-600 hover:underline"
                          >
                            إعادة كلمة المرور
                          </button>
                        )}
                        <span className="text-slate-200">|</span>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
