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
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-brand-700">بوابة تجميع بيانات وإحصاءات المدارس</h1>
          <p className="mt-2 text-sm text-slate-600">
            المنظومة الإلكترونية الموحدة لجمع وتدقيق الإحصاءات والبيانات الدورية للمدارس
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* كارت تسجيل الدخول */}
          <div className="lg:col-span-5 order-1 lg:order-1">
            <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-7 shadow-lg border border-slate-100">
              <div className="mb-5 border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-800">تسجيل دخول المدرسة</h2>
                <p className="text-xs text-slate-500 mt-1">اختر مدرستك وأدخل كلمة المرور للمتابعة</p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100 flex items-start gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  1. ابحث عن المدرسة (بالاسم أو الكود):
                </label>
                <input
                  type="text"
                  placeholder="اكتب اسم المدرسة أو الكود للبحث..."
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  2. اختر المدرسة من القائمة:
                </label>
                {loadingSchools ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-400">
                    جاري تحميل قائمة المدارس...
                  </div>
                ) : (
                  <select
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  >
                    <option value="">-- اضغط هنا لاختيار المدرسة ({filteredSchools.length}) --</option>
                    {filteredSchools.map((s) => (
                      <option key={s.id} value={s.username}>
                        [{s.code}] {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="mb-6">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  3. كلمة المرور:
                </label>
                <input
                  type="password"
                  placeholder="أدخل كلمة المرور المعتمدة"
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || loadingSchools}
                className="w-full rounded-xl bg-brand-600 py-3 text-white font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></span>
                    <span>جاري التحقق والدخول...</span>
                  </>
                ) : (
                  <span>دخول لوحة المدرسة ←</span>
                )}
              </button>
            </form>
          </div>

          {/* لوحة دليل وخطوات العمل بالتفصيل */}
          <div className="lg:col-span-7 order-2 lg:order-2 space-y-4">
            <div className="rounded-2xl bg-white p-7 shadow-lg border border-slate-100">
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700 font-bold text-lg">
                  📋
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">خطوات تسجيل الدخول واستكمال الإحصاء بالتفصيل</h2>
                  <p className="text-xs text-slate-500">إرشادات هامة لمسؤولي ومديري المدارس لإتمام إرسال البيانات</p>
                </div>
              </div>

              <ol className="space-y-4 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="block text-slate-900 font-semibold mb-0.5">البحث عن المدرسة واختيارها:</strong>
                    اكتب جزءاً من اسم مدرستك أو كودها في خانة البحث لتسهيل العثور عليها، ثم اخترها من القائمة المنسدلة.
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="block text-slate-900 font-semibold mb-0.5">إدخال كلمة المرور المعتمدة:</strong>
                    أدخل كلمة المرور التي تم تسليمها للمدرسة من قبل إدارة الإحصاء، ثم اضغط على زر "دخول لوحة المدرسة".
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="block text-slate-900 font-semibold mb-0.5">اختيار النموذج أو الإحصاء المطلوب:</strong>
                    ستنتقل مباشرة إلى لوحة المدرسة؛ ستجد قائمة بالنماذج المفتوحة حالياً وحالتها:
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                      <span className="inline-block rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-amber-800 font-medium">
                        🟡 لم يتم الإرسال بعد (مطلوب تعبئته)
                      </span>
                      <span className="inline-block rounded bg-green-50 border border-green-200 px-2 py-0.5 text-green-800 font-medium">
                        🟢 تم الإرسال ✓ (تم تسجيل الرد)
                      </span>
                    </div>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white mt-0.5">
                    4
                  </span>
                  <div>
                    <strong className="block text-slate-900 font-semibold mb-0.5">تعبئة البيانات والتدقيق:</strong>
                    اضغط على اسم النموذج وقم بإدخال الأرقام والبيانات بدقة في الحقول المخصصة، ثم اضغط على زر <span className="text-brand-700 font-bold">"إرسال البيانات"</span> في أسفل الصفحة.
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white mt-0.5">
                    5
                  </span>
                  <div>
                    <strong className="block text-slate-900 font-semibold mb-0.5">إمكانية المراجعة والتعديل:</strong>
                    في حال أردتم تعديل أي بيانات تم إرسالها مسبقاً، يمكنكم إعادة فتح النموذج في أي وقت وتعديله وحفظه طالما أن فترة الإحصاء ما زالت نشطة ومفتوحة من الإدارة.
                  </div>
                </li>
              </ol>

              {/* بطاقات تنبيهات جانبية */}
              <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-3 text-blue-900">
                  <strong className="block font-bold mb-1 flex items-center gap-1">
                    <span>🔒</span> تأمين حساب المدرسة
                  </strong>
                  <p className="text-blue-800 leading-relaxed">
                    يُرجى تغيير كلمة المرور المبدئية عند أول دخول عبر الضغط على رابط "تغيير كلمة المرور" داخل لوحة مدرستكم.
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50/70 border border-amber-100 p-3 text-amber-900">
                  <strong className="block font-bold mb-1 flex items-center gap-1">
                    <span>🔑</span> نسيان كلمة المرور؟
                  </strong>
                  <p className="text-amber-800 leading-relaxed">
                    في حال تعذر الدخول أو فقدان كلمة المرور، يرجى التواصل فوراً مع مسؤول الإحصاء بالإدارة لإعادة تعيينها.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}