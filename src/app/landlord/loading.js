export default function LandlordLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-slate-200 rounded-xl" />
        <div className="h-4 w-72 bg-slate-100 rounded-lg" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <div className="h-4 w-20 bg-slate-100 rounded" />
            <div className="h-8 w-16 bg-slate-200 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        {/* Table header */}
        <div className="border-b border-slate-100 px-4 py-3 flex gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-3 bg-slate-100 rounded flex-1" />
          ))}
        </div>
        {/* Table rows */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="border-b border-slate-50 px-4 py-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-slate-100 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-32 bg-slate-200 rounded" />
              <div className="h-2.5 w-20 bg-slate-100 rounded" />
            </div>
            <div className="h-3 w-24 bg-slate-100 rounded hidden md:block" />
            <div className="h-3 w-20 bg-slate-100 rounded hidden md:block" />
            <div className="h-6 w-20 bg-slate-100 rounded-lg" />
            <div className="w-6 h-6 bg-slate-100 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
