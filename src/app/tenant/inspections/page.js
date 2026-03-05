import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  ClipboardCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  FileText,
  BadgeAlert
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TenantInspectionsPage() {
  const session = await getServerSession(authOptions);
  
  const profile = await prisma.tenantProfile.findUnique({
    where: { userId: session.user.id }
  });

  if (!profile || !profile.roomId) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200 shadow-xl border-t-4 border-t-blue-500 animate-in fade-in duration-700">
        <div className="bg-blue-50 p-4 rounded-2xl mb-6">
          <BadgeAlert size={48} className="text-blue-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 text-center">Inspections Unavailable</h1>
        <p className="text-slate-500 mt-4 text-center max-w-md leading-relaxed">
          Inspection reports will be available once you have been allocated to a room. 
        </p>
      </div>
    );
  }

  const inspections = await prisma.inspection.findMany({
    where: { tenantId: profile.id },
    include: { room: true },
    orderBy: { date: "desc" }
  });

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="border-b border-slate-200 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full w-fit mb-2">
            <ClipboardCheck size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Compliance & Reports</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Your Inspections</h1>
          <p className="text-slate-500 max-w-xl">
            Track your move-in and move-out inspection status and view landlord remarks.
          </p>
        </div>
      </div>

      {inspections.length === 0 ? (
        <div className="py-24 bg-white rounded-[3rem] border border-slate-200 shadow-sm text-center">
          <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-100 italic">
            <Clock size={40} className="text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">No Inspections Yet</h3>
          <p className="text-slate-500 mt-2 max-w-xs mx-auto">Your landlord hasn't scheduled any inspections for your room yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {inspections.map((insp) => (
            <div key={insp.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-lg hover:shadow-xl transition-all group overflow-hidden border-b-8 border-b-slate-100">
               <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                     <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter border ${
                       insp.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                       insp.status === 'PASSED' ? 'bg-green-50 text-green-600 border-green-100' :
                       'bg-red-50 text-red-600 border-red-100'
                     }`}>
                       {insp.status}
                     </span>
                     <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                       #{insp.id.slice(-6).toUpperCase()}
                     </span>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight">Move-In Verification</h3>
                  <div className="flex items-center gap-2 mb-6">
                     <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                        <Calendar size={16} />
                     </div>
                     <span className="text-sm font-bold text-slate-600 italic">Scheduled: {new Date(insp.date).toLocaleDateString()}</span>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 relative overflow-hidden">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Landlord Remarks</p>
                     <p className="text-sm text-slate-700 font-medium leading-relaxed relative z-10">
                        {insp.notes || "No remarks provided yet."}
                     </p>
                     <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <FileText size={48} />
                     </div>
                  </div>
               </div>

               <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                     {insp.feePaid ? (
                        <>
                           <CheckCircle2 size={12} className="text-green-500" />
                           <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Inspection Fee Paid</span>
                        </>
                     ) : (
                        <>
                           <AlertCircle size={12} className="text-amber-500" />
                           <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Fee Payment Pending</span>
                        </>
                     )}
                  </div>
                  <button className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest underline decoration-2 underline-offset-4 decoration-blue-200">View Report</button>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-slate-900 text-white rounded-[2.5rem] p-12 relative overflow-hidden shadow-2xl">
         <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl font-black tracking-tight mb-4 leading-tight">Preparing for Inspection</h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-8">
               Ensure your room is clean and all facilities are in the same condition as when you moved in. 
               The landlord will check plumbing, electricity, and furniture.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                     <CheckCircle2 size={20} />
                  </div>
                  <span className="text-sm font-bold">Clear all personal belongings</span>
               </div>
               <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                     <CheckCircle2 size={20} />
                  </div>
                  <span className="text-sm font-bold">Report existing damages</span>
               </div>
            </div>
         </div>
         <div className="absolute top-0 right-0 p-12 opacity-10 hidden lg:block">
            <ClipboardCheck size={200} />
         </div>
      </div>
    </div>
  );
}
