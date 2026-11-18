export default function TenantProfileLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-pulse">

      {/* Back link */}
      <div className="h-4 w-32 bg-slate-200 rounded" />

      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-200 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-7 w-48 bg-slate-200 rounded-lg" />
          <div className="h-4 w-64 bg-slate-100 rounded" />
          <div className="flex gap-2 mt-1">
            <div className="h-5 w-16 bg-slate-100 rounded-full" />
            <div className="h-5 w-20 bg-slate-100 rounded-full" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left col */}
        <div className="lg:col-span-2 space-y-6">
          {/* Primary info card */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="h-3 w-32 bg-slate-200 rounded" />
            </div>
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center py-1">
                  <div className="h-3 w-24 bg-slate-100 rounded" />
                  <div className="h-3 w-32 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Payments card */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="h-3 w-28 bg-slate-200 rounded" />
            </div>
            <div className="divide-y divide-slate-100">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between">
                  <div className="space-y-1.5">
                    <div className="h-3 w-24 bg-slate-200 rounded" />
                    <div className="h-2.5 w-16 bg-slate-100 rounded" />
                  </div>
                  <div className="h-6 w-16 bg-slate-100 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-5">
          {/* Room card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
            <div className="h-3 w-20 bg-slate-200 rounded" />
            <div className="h-8 w-24 bg-slate-200 rounded-lg" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </div>

          {/* Expiry card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
            <div className="h-3 w-28 bg-slate-200 rounded" />
            <div className="h-6 w-36 bg-slate-200 rounded-lg" />
          </div>

          {/* Actions */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
