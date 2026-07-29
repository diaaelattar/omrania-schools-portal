'use client';

import { useEffect, useState } from 'react';

export default function SchoolLoginPage() {
  const [schools, setSchools] = useState([]);
  const [search, setSearch] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(true);

  useEffect(() => {
    fetch('/api/schools/list')
      .then((r) => r.json())
      .then((data) => {
        setSchools(data.schools || []);
      })
      .finally(() => setLoadingSchools(false));
  }, []);

  const filteredSchools = schools.filter(
    (s) =>
      s.name.includes(search) ||
      s.code.includes(search) ||
      s.username.includes(search)
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!username) {
      setError('من فضلك اختر المدرسة من القائمة');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/auth/school-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || 'حدث خطأ');
      return;
    }
    window.location.href = json.mustChangePassword ? '/school/password' : '/school/dashboard';
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-slate-50">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg border border-slate-100">
        <h1 className="mb-2 text-center text-2xl font-bold text-brand-700">بوابة المدارس</h1>
        <p className="mb-6 text-center text-xs text-slate-500">اختر اسم المدرسة وأدخل كلمة المرور لدخول البوابة</p>

        {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">{error}</p>}

        <label className="mb-1 block text-sm font-medium text-slate-700">بحث بالاسم أو الكود</label>
        <input
          type="text"
          placeholder="ابحث عن اسم المدرسة..."
          className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <label className="mb-1 block text-sm font-medium text-slate-700">اختر المدرسة</label>
        {loadingSchools ? (
          <div className="mb-4 text-xs text-slate-400 p-2">جاري تحميل قائمة المدارس...</div>
        ) : (
          <select
            className="mb-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          >
            <option value="">-- اختر المدرسة من القائمة ({filteredSchools.length}) --</option>
            {filteredSchools.map((s) => (
              <option key={s.id} value={s.username}>
                [{s.code}] {s.name}
              </option>
            ))}
          </select>
        )}

        <label className="mb-1 block text-sm font-medium text-slate-700">كلمة المرور</label>
        <input
          type="password"
          placeholder="أدخل كلمة المرور"
          className="mb-6 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          disabled={loading || loadingSchools}
          className="w-full rounded-lg bg-brand-600 py-3 text-white font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 shadow"
        >
          {loading ? 'جاري الدخول...' : 'دخول المدرسة'}
        </button>
      </form>
    </main>
  );
}
