export default function TenantLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-40 bg-slate-200 rounded-xl" />
        <div className="h-4 w-56 bg-slate-100 rounded-lg" />
      </div>

      {/* Cards row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <div className="h-4 w-24 bg-slate-100 rounded" />
            <div className="h-8 w-32 bg-slate-200 rounded-lg" />
            <div className="h-3 w-48 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Content block */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
            <div className="h-3 w-28 bg-slate-100 rounded" />
            <div className="h-3 w-20 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
