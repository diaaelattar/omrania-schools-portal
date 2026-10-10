'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

const GRADES = [
  { id: 'grade1', name: 'الصف الأول الابتدائي', shortName: 'الصف الأول', match: ['الأول', 'grade_1', 'grade1', 'الاول', 'g1'] },
  { id: 'grade2', name: 'الصف الثاني الابتدائي', shortName: 'الصف الثاني', match: ['الثاني', 'grade_2', 'grade2', 'الثانى', 'g2'] },
  { id: 'grade3', name: 'الصف الثالث الابتدائي', shortName: 'الصف الثالث', match: ['الثالث', 'grade_3', 'grade3', 'g3'] },
  { id: 'grade4', name: 'الصف الرابع الابتدائي', shortName: 'الصف الرابع', match: ['الرابع', 'grade_4', 'grade4', 'g4'] },
  { id: 'grade5', name: 'الصف الخامس الابتدائي', shortName: 'الصف الخامس', match: ['الخامس', 'grade_5', 'grade5', 'g5'] },
  { id: 'grade6', name: 'الصف السادس الابتدائي', shortName: 'الصف السادس', match: ['السادس', 'grade_6', 'grade6', 'g6'] },
];

function detectGrade(field) {
  const text = `${field.key} ${field.label}`.toLowerCase();
  for (const g of GRADES) {
    if (g.match.some((m) => text.includes(m.toLowerCase()))) {
      return g;
    }
  }
  return null;
}

export default function DynamicForm({ formId, formTitle = '', fields, initialData }) {
  const router = useRouter();
  const [values, setValues] = useState(initialData || {});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize selected rest grades from existing submission if any
  const [restGrades, setRestGrades] = useState(initialData?._rest_grades_ids || []);

  // Determine if this form is related to attendance or contains grade fields
  const isAttendanceOrGradeForm = useMemo(() => {
    const titleMatch =
      formTitle.includes('غياب') ||
      formTitle.includes('حضور') ||
      formTitle.toLowerCase().includes('attendance');
    const fieldsMatch = fields.some((f) => detectGrade(f) !== null);
    return titleMatch || fieldsMatch;
  }, [formTitle, fields]);

  function setField(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  // Toggle rest grade (up to 2 grades in 4 & 2 rotation)
  function handleToggleRestGrade(gradeId) {
    setRestGrades((prev) => {
      if (prev.includes(gradeId)) {
        return prev.filter((id) => id !== gradeId);
      }
      if (prev.length >= 2) {
        // If already 2 selected, replace the oldest selection
        return [prev[1], gradeId];
      }
      return [...prev, gradeId];
    });
  }

  function handleClearRestGrades() {
    setRestGrades([]);
  }

  // Compute live totals if attendance numbers are present
  const summaryStats = useMemo(() => {
    if (!isAttendanceOrGradeForm) return null;
    let totalRegistered = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let hasStats = false;

    fields.forEach((f) => {
      const g = detectGrade(f);
      // Skip fields for grades that are on rest day
      if (g && restGrades.includes(g.id)) return;

      const val = parseFloat(values[f.key]);
      if (isNaN(val)) return;

      const keyLower = `${f.key} ${f.label}`.toLowerCase();
      if (keyLower.includes('مقيد') || keyLower.includes('total')) {
        totalRegistered += val;
        hasStats = true;
      } else if (keyLower.includes('حضور') || keyLower.includes('حاضر') || keyLower.includes('present')) {
        totalPresent += val;
        hasStats = true;
      } else if (keyLower.includes('غياب') || keyLower.includes('غائب') || keyLower.includes('absent')) {
        totalAbsent += val;
        hasStats = true;
      }
    });

    if (!hasStats || totalRegistered === 0) return null;
    const rate = totalRegistered > 0 ? ((totalPresent / totalRegistered) * 100).toFixed(1) : 0;
    return { totalRegistered, totalPresent, totalAbsent, rate };
  }, [fields, values, restGrades, isAttendanceOrGradeForm]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate fields, skipping any field belonging to a grade that has rest today
    for (const field of fields) {
      const g = detectGrade(field);
      const isRest = g && restGrades.includes(g.id);

      if (!isRest && field.required && (values[field.key] === undefined || values[field.key] === '')) {
        setError(`الحقل "${field.label}" مطلوب`);
        return;
      }
    }

    setLoading(true);

    const submissionPayload = {
      ...values,
      _rest_grades_ids: restGrades,
      _rest_grades: restGrades.map((gid) => GRADES.find((g) => g.id === gid)?.shortName),
      _operating_system: restGrades.length > 0 ? 'rotation_4_2' : 'normal_5_days',
    };

    const res = await fetch(`/api/forms/${formId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: submissionPayload }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error || 'حدث خطأ أثناء إرسال البيانات');
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-semibold text-red-700">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800 flex items-center justify-between">
          <span>✓ تم إرسال وحفظ بيانات الإحصاء بنجاح في قاعدة البيانات.</span>
          <span className="text-xs bg-green-200/60 text-green-900 px-2 py-0.5 rounded">مُحدّث</span>
        </div>
      )}

      {/* 4 & 2 System Rest Grades Panel */}
      {isAttendanceOrGradeForm && (
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-sky-50/60 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-indigo-100/80 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm shadow-xs">
                🔄
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  نظام تشغيل المدرسة وتناوب الصفوف (4 & 2)
                </h3>
                <p className="text-xs text-slate-500">
                  هل اليوم فترة راحة لأي صفوف دراسية بالمدرسة؟
                </p>
              </div>
            </div>

            {restGrades.length > 0 && (
              <button
                type="button"
                onClick={handleClearRestGrades}
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline self-start sm:self-center"
              >
                إلغاء التحديد (حضور جميع الـ 6 صفوف)
              </button>
            )}
          </div>

          <p className="text-xs text-slate-600 mb-3 leading-relaxed">
            إذا كانت مدرستكم تعمل بنظام <strong>4 & 2</strong>، اضغط على الصفين اللذين في فترة <strong>راحة اليوم</strong> (حد أقصى صفين)، وسيتم إغلاق خاناتهما تلقائياً واستثناؤهما من حسابات الغياب. المدارس التي تعمل 5 أيام بانتظام تترك جميع الصفوف بدون تحديد.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {GRADES.map((g) => {
              const isRest = restGrades.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handleToggleRestGrade(g.id)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    isRest
                      ? 'bg-amber-100/90 border-amber-300 text-amber-900 shadow-sm ring-2 ring-amber-400/40'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-indigo-200'
                  }`}
                >
                  <span className="text-base mb-1">{isRest ? '☕' : '🏫'}</span>
                  <span>{g.shortName}</span>
                  <span
                    className={`mt-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                      isRest
                        ? 'bg-amber-200 text-amber-900 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {isRest ? 'راحة اليوم' : 'حاضر اليوم'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Status Message */}
          <div className="mt-3.5 pt-3 border-t border-indigo-100/60 text-xs flex items-center justify-between">
            {restGrades.length > 0 ? (
              <div className="flex items-center gap-1.5 text-amber-900 font-medium">
                <span>☕</span>
                <span>
                  نظام التناوب نشط: تم تحديد{' '}
                  <strong>
                    ({restGrades.map((id) => GRADES.find((g) => g.id === id)?.shortName).join(' + ')})
                  </strong>{' '}
                  كفترة راحة اليوم — تم قفل خاناتهم واستثناؤهم من الإلزام، ومتاح تسجيل الحضور والغياب لباقي الصفوف ({6 - restGrades.length} صفوف).
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                <span>🟢</span>
                <span>
                  نظام الحضور المكتمل: جميع الصفوف الستة حاضرة اليوم (نظام 5 أيام أو حضور كامل).
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Dynamic Fields List */}
      <div className="rounded-2xl bg-white p-6 shadow border border-slate-100 flex flex-col gap-4">
        {fields.map((field) => {
          const g = detectGrade(field);
          const isRest = g && restGrades.includes(g.id);

          return (
            <div
              key={field.key}
              className={`p-3.5 rounded-xl border transition-all ${
                isRest
                  ? 'bg-amber-50/50 border-amber-200/80 opacity-75'
                  : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-800">
                  {field.label}{' '}
                  {field.required && !isRest && <span className="text-red-500">*</span>}
                </label>

                {isRest ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md">
                    <span>☕</span>
                    <span>معفى اليوم (فترة راحة)</span>
                  </span>
                ) : g ? (
                  <span className="text-[10px] text-slate-400 font-medium">
                    {g.shortName}
                  </span>
                ) : null}
              </div>

              {isRest ? (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200/60 px-3 py-2 text-xs text-amber-800 font-medium">
                  <span>🔒 هذا الصف معفى من الحضور اليوم؛ لا يُشترط إدخال أرقام ولن يُحسب له غياب.</span>
                </div>
              ) : field.type === 'textarea' ? (
                <textarea
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  rows={3}
                  value={values[field.key] || ''}
                  onChange={(e) => setField(field.key, e.target.value)}
                  placeholder={field.label}
                />
              ) : field.type === 'select' ? (
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                  min="0"
                  placeholder="أدخل العدد"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={values[field.key] ?? ''}
                  onChange={(e) => setField(field.key, e.target.value)}
                />
              ) : field.type === 'date' ? (
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={values[field.key] || ''}
                  onChange={(e) => setField(field.key, e.target.value)}
                />
              ) : (
                <input
                  type="text"
                  placeholder={field.label}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={values[field.key] || ''}
                  onChange={(e) => setField(field.key, e.target.value)}
                />
              )}
            </div>
          );
        })}

        {/* Live Attendance Summary Card if numbers are filled */}
        {summaryStats && (
          <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200 p-4">
            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <span>📊</span> ملخص الإحصاء اللحظي للصفوف الحاضرة اليوم:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="rounded-lg bg-white p-2.5 border border-slate-100 shadow-xs">
                <p className="text-[11px] text-slate-500">إجمالي المقيدين الحاضرين</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">{summaryStats.totalRegistered}</p>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-slate-100 shadow-xs">
                <p className="text-[11px] text-slate-500">إجمالي الحضور</p>
                <p className="text-base font-bold text-emerald-700 mt-0.5">{summaryStats.totalPresent}</p>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-slate-100 shadow-xs">
                <p className="text-[11px] text-slate-500">إجمالي الغياب</p>
                <p className="text-base font-bold text-rose-700 mt-0.5">{summaryStats.totalAbsent}</p>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-slate-100 shadow-xs">
                <p className="text-[11px] text-slate-500">نسبة الحضور</p>
                <p className="text-base font-bold text-brand-700 mt-0.5">{summaryStats.rate}%</p>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-3 w-full rounded-xl bg-brand-600 py-3 text-white font-semibold hover:bg-brand-700 transition disabled:opacity-50 shadow flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></span>
              <span>جاري حفظ وإرسال البيانات...</span>
            </>
          ) : (
            <span>إرسال وتأكيد البيانات ←</span>
          )}
        </button>
      </div>
    </form>
  );
}
