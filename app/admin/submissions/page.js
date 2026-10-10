'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import SchoolTypeFilter from '@/app/components/SchoolTypeFilter';

function SubmissionsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const formId = searchParams.get('form') || '';
  const currentType = searchParams.get('type') || 'all'; // 'all' | 'public' | 'private'

  const [forms, setForms] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('missing'); // 'missing' or 'submitted'
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  // Handle changing school type filter
  function handleTypeChange(newType) {
    const params = new URLSearchParams(searchParams.toString());
    if (newType === 'all') {
      params.delete('type');
    } else {
      params.set('type', newType);
    }
    router.replace(`/admin/submissions?${params.toString()}`);
  }

  // Load forms list
  useEffect(() => {
    fetch('/api/admin/forms')
      .then((r) => r.json())
      .then((json) => {
        const loadedForms = json.forms || [];
        setForms(loadedForms);
        // Automatically select active form if no form is selected yet
        if (!formId && loadedForms.length > 0) {
          const defaultForm = loadedForms.find((f) => f.is_active) || loadedForms[0];
          const typeParam = currentType !== 'all' ? `&type=${currentType}` : '';
          router.replace(`/admin/submissions?form=${defaultForm.id}${typeParam}`);
        }
      })
      .catch((err) => {
        setError('تعذر تحميل قائمة النماذج: ' + (err.message || 'خطأ في الاتصال'));
      });
  }, [formId, currentType, router]);

  // Load submissions for selected form and school type
  useEffect(() => {
    if (!formId) {
      setResult(null);
      return;
    }
    setLoading(true);
    setError('');
    const typeParam = currentType !== 'all' ? `&type=${currentType}` : '';
    fetch(`/api/admin/submissions?form=${formId}${typeParam}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setError(json.error);
          setResult(null);
        } else {
          setResult(json);
          // If no submissions yet, default to missing schools tab
          if ((json.submissions || []).length === 0) {
            setActiveTab('missing');
          }
        }
      })
      .catch((err) => {
        setError('تعذر تحميل الردود: ' + (err.message || 'خطأ في الاتصال'));
        setResult(null);
      })
      .finally(() => setLoading(false));
  }, [formId, currentType]);

  const fields = result?.form?.schema?.fields || [];
  const submissions = result?.submissions || [];
  const missingSchools = result?.missingSchools || [];
  const totalSchoolsCount = result?.totalSchoolsCount ?? (submissions.length + missingSchools.length);

  // Filtered lists according to search
  const filteredSubmissions = useMemo(() => {
    if (!searchQuery.trim()) return submissions;
    const q = searchQuery.trim().toLowerCase();
    return submissions.filter(
      (s) =>
        s.schools?.name?.toLowerCase().includes(q) ||
        s.schools?.code?.toLowerCase().includes(q)
    );
  }, [submissions, searchQuery]);

  const filteredMissingSchools = useMemo(() => {
    if (!searchQuery.trim()) return missingSchools;
    const q = searchQuery.trim().toLowerCase();
    return missingSchools.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.code?.toLowerCase().includes(q)
    );
  }, [missingSchools, searchQuery]);

  // Copy missing schools to clipboard
  const handleCopyMissing = () => {
    if (missingSchools.length === 0) return;
    const categoryTitle =
      currentType === 'public'
        ? 'المدارس الرسمية'
        : currentType === 'private'
        ? 'المدارس الخاصة'
        : 'المدارس';
    const formTitle = result?.form?.title || 'الإحصاء';

    const header = `📋 بيان بـ ${categoryTitle} المتأخرة عن تسليم: "${formTitle}" (العدد: ${missingSchools.length}):\n-----------------------------------`;
    const list = missingSchools
      .map((s, idx) => `${idx + 1}- ${s.name} (كود: ${s.code})${currentType === 'all' ? ` [${s.type === 'private' ? 'خاص' : 'رسمي'}]` : ''}`)
      .join('\n');
    const text = `${header}\n${list}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const typeTitle =
    currentType === 'public'
      ? 'المدارس الرسمية'
      : currentType === 'private'
      ? 'المدارس الخاصة'
      : 'جميع المدارس';

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href={`/admin/dashboard${currentType !== 'all' ? `?type=${currentType}` : ''}`} className="text-sm text-brand-600 underline">
          ← لوحة التحكم
        </Link>
        <Link href="/admin/forms" className="text-sm text-brand-600 underline">
          إدارة النماذج
        </Link>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-700">متابعة إرسال الإحصاء والبيانات</h1>
          <p className="text-sm text-gray-500">عرض المدارس التي أرسلت والمدارس المتأخرة وتصدير الإكسيل</p>
        </div>

        {/* Form Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">النموذج:</label>
          <select
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none"
            value={formId}
            onChange={(e) => {
              const typeParam = currentType !== 'all' ? `&type=${currentType}` : '';
              router.push(`/admin/submissions?form=${e.target.value}${typeParam}`);
            }}
          >
            <option value="">-- اختر النموذج --</option>
            {forms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title} {f.is_active ? '🟢 (نشط)' : '⚪ (متوقف)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary Category Selector (Separation of Public vs Private vs All) */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">تصفية نوع المدارس:</span>
          <span className="text-xs text-slate-500">({typeTitle})</span>
        </div>
        <SchoolTypeFilter
          value={currentType}
          onChange={handleTypeChange}
        />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">تنبيه:</p>
          <p>{error}</p>
          <button
            onClick={() => {
              if (formId) router.refresh();
              else window.location.reload();
            }}
            className="mt-2 text-xs font-semibold text-red-800 underline"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="my-8 rounded-xl bg-white p-8 text-center shadow">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">جاري تحميل بيانات الإحصاء...</p>
        </div>
      )}

      {/* Notice if no schools are registered in DB */}
      {!loading && result && totalSchoolsCount === 0 && (
        <div className="mb-6 rounded-xl border border-yellow-300 bg-yellow-50 p-5 text-yellow-900 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold">⚠️ لا توجد أي مدرسة مسجلة في النظام حتى الآن!</h2>
              <p className="mt-1 text-sm text-yellow-800">
                لكي يظهر لك من قام بالإرسال ومن لم يرسل بعد، يجب أولاً إضافة حسابات المدارس إلى قاعدة البيانات.
              </p>
            </div>
            <Link
              href="/admin/schools"
              className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-yellow-700"
            >
              إضافة المدارس الآن ←
            </Link>
          </div>
        </div>
      )}

      {/* Result View */}
      {!loading && result?.form && (
        <>
          {/* Stat Cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-4 shadow">
              <p className="text-xs text-gray-500">
                إجمالي {currentType === 'public' ? 'المدارس الرسمية' : currentType === 'private' ? 'المدارس الخاصة' : 'المدارس المسجلة'}
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-800">{totalSchoolsCount}</p>
              <p className="text-xs text-gray-400">
                {currentType === 'public' ? 'حكومي / رسمي' : currentType === 'private' ? 'خاص' : 'في قاعدة البيانات'}
              </p>
            </div>

            <div className="rounded-xl bg-white p-4 shadow border-r-4 border-green-500">
              <p className="text-xs text-gray-500">المدارس التي أرسلت</p>
              <div className="flex items-baseline gap-2">
                <p className="mt-1 text-2xl font-bold text-green-700">{submissions.length}</p>
                {totalSchoolsCount > 0 && (
                  <span className="text-xs font-semibold text-green-600">
                    ({Math.round((submissions.length / totalSchoolsCount) * 100)}%)
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">تم تسجيل الرد</p>
            </div>

            <div className="rounded-xl bg-white p-4 shadow border-r-4 border-amber-500">
              <p className="text-xs text-gray-500">مدارس لم ترسل بعد</p>
              <div className="flex items-baseline gap-2">
                <p className="mt-1 text-2xl font-bold text-amber-700">{missingSchools.length}</p>
                {totalSchoolsCount > 0 && (
                  <span className="text-xs font-semibold text-amber-600">
                    ({Math.round((missingSchools.length / totalSchoolsCount) * 100)}%)
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">بانتظار الإرسال</p>
            </div>
          </div>

          {/* Action Bar & Tabs */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Tabs */}
            <div className="flex rounded-lg bg-gray-200 p-1">
              <button
                onClick={() => setActiveTab('missing')}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                  activeTab === 'missing'
                    ? 'bg-white text-amber-800 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                مدارس لم ترسل بعد ({missingSchools.length})
              </button>
              <button
                onClick={() => setActiveTab('submitted')}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                  activeTab === 'submitted'
                    ? 'bg-white text-brand-700 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                البيانات المُرسلة ({submissions.length})
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {activeTab === 'missing' && missingSchools.length > 0 && (
                <button
                  onClick={handleCopyMissing}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 flex items-center gap-1.5"
                  title="نسخ قائمة المدارس التي لم ترسل"
                >
                  <span>{copied ? '✓ تم النسخ بنجاح!' : '📋 نسخ أسماء المتأخرين'}</span>
                  {currentType !== 'all' && (
                    <span className="text-xs text-slate-500">({currentType === 'public' ? 'الرسمية' : 'الخاصة'})</span>
                  )}
                </button>
              )}
              {submissions.length > 0 && (
                <a
                  href={`/api/admin/export/${formId}${currentType !== 'all' ? `?type=${currentType}` : ''}`}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-700 flex items-center gap-1.5"
                >
                  <span>📥 تصدير إلى إكسيل</span>
                  <span className="text-xs opacity-90">({currentType === 'public' ? 'رسمي' : currentType === 'private' ? 'خاص' : 'الكل'})</span>
                </a>
              )}
            </div>
          </div>

          {/* Search Box */}
          {(submissions.length > 0 || missingSchools.length > 0) && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="🔍 بحث باسم المدرسة أو الكود..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          )}

          {/* Tab 1: Missing Schools */}
          {activeTab === 'missing' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-bold text-amber-900">
                  قائمة {currentType === 'public' ? 'المدارس الرسمية' : currentType === 'private' ? 'المدارس الخاصة' : 'المدارس'} التي لم ترسل الإحصاء ({filteredMissingSchools.length})
                </h2>
                {missingSchools.length > 0 && (
                  <span className="text-xs text-amber-700">
                    يمكنك نسخ القائمة وإرسالها لتذكير المدارس
                  </span>
                )}
              </div>

              {missingSchools.length === 0 ? (
                <div className="rounded-lg bg-white p-6 text-center text-green-700 shadow-sm font-medium">
                  🎉 ممتاز! جميع {currentType === 'public' ? 'المدارس الرسمية' : currentType === 'private' ? 'المدارس الخاصة' : 'المدارس المسجلة'} قامت بإرسال هذا الإحصاء.
                </div>
              ) : filteredMissingSchools.length === 0 ? (
                <p className="p-4 text-center text-sm text-gray-500">لا توجد مدرسة تطابق بحثك.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredMissingSchools.map((s, idx) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border border-amber-200 bg-white p-3 shadow-sm"
                    >
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-gray-800 text-sm truncate">{s.name}</p>
                          {(s.type === 'private' || currentType === 'all') && (
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-medium shrink-0 ${
                                s.type === 'private'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {s.type === 'private' ? 'خاص' : 'رسمي'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">كود: {s.code}</p>
                      </div>
                      <span className="text-xs font-mono text-amber-600 bg-amber-50 px-2 py-1 rounded shrink-0">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Submissions Table */}
          {activeTab === 'submitted' && (
            <div className="overflow-x-auto rounded-xl bg-white shadow">
              {submissions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  لم تقم أي مدرسة {currentType === 'public' ? 'رسمية' : currentType === 'private' ? 'خاصة' : ''} بإرسال البيانات لهذا النموذج بعد.
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  لا توجد ردود تطابق بحثك.
                </div>
              ) : (
                <table className="w-full text-right text-sm">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="p-3">المدرسة</th>
                      <th className="p-3">الكود</th>
                      <th className="p-3 whitespace-nowrap">النوع</th>
                      {fields.map((f) => (
                        <th key={f.key} className="p-3 whitespace-nowrap">
                          {f.label}
                        </th>
                      ))}
                      <th className="p-3 whitespace-nowrap">تاريخ التحديث</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredSubmissions.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-900">{s.schools?.name}</td>
                        <td className="p-3 text-gray-500">{s.schools?.code}</td>
                        <td className="p-3 whitespace-nowrap">
                          <span
                            className={`inline-block text-[11px] px-2 py-0.5 rounded-md font-semibold border ${
                              s.schools?.type === 'private'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {s.schools?.type === 'private' ? 'خاص' : 'رسمي'}
                          </span>
                        </td>
                        {fields.map((f) => (
                          <td key={f.key} className="p-3 text-gray-700">
                            {Array.isArray(s.data?.[f.key])
                              ? s.data[f.key].join('، ')
                              : s.data?.[f.key] ?? '—'}
                          </td>
                        ))}
                        <td className="p-3 text-xs text-gray-400 whitespace-nowrap">
                          {new Date(s.updated_at).toLocaleString('ar-EG')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
