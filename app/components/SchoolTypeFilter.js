'use client';

export default function SchoolTypeFilter({
  value = 'all',
  onChange,
  counts,
  className = '',
}) {
  const options = [
    { id: 'all', label: 'عرض الكل', icon: '🌐', count: counts?.all },
    { id: 'public', label: 'المدارس الرسمية', icon: '🏛️', count: counts?.public },
    { id: 'private', label: 'المدارس الخاصة', icon: '🏢', count: counts?.private },
  ];

  return (
    <div className={`inline-flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200 shadow-xs ${className}`}>
      {options.map((opt) => {
        const isActive = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
              isActive
                ? 'bg-brand-600 text-white shadow-sm ring-1 ring-brand-700/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono leading-none ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
