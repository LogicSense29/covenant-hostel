import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { 
  ClipboardCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  MapPin,
  BadgeAlert,
  XCircle
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TenantInspectionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const profile = await prisma.tenantProfile.findUnique({
    where: { userId: session.user.id },
    include: { room: { include: { block: true } } }
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
    include: { room: { include: { block: true } } },
    orderBy: { date: "desc" }
  });

  const room = profile.room;

  const statusConfig = {
    PENDING: {
      label: "Pending",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      accent: "border-t-amber-400",
      icon: <Clock size={16} className="text-amber-500" />,
      dot: "bg-amber-400",
    },
    CONFIRMED: {
      label: "Confirmed",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      accent: "border-t-blue-500",
      icon: <CheckCircle2 size={16} className="text-blue-500" />,
      dot: "bg-blue-500",
    },
    DONE: {
      label: "Completed",
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
      accent: "border-t-green-500",
      icon: <CheckCircle2 size={16} className="text-green-600" />,
      dot: "bg-green-500",
    },
    FAILED: {
      label: "Failed",
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
      accent: "border-t-red-500",
      icon: <XCircle size={16} className="text-red-500" />,
      dot: "bg-red-500",
    },
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">

      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-display font-semibold text-slate-900 tracking-tight">Your Inspections</h1>
          <p className="text-slate-500 max-w-xl">
            Track your move-in and move-out inspection status.
          </p>
        </div>

        {/* Room badge */}
        {room && (
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm shrink-0">
            <div className="p-2 bg-blue-50 rounded-xl">
              <MapPin size={16} className="text-blue-600" />
            </div>
            <div>
              {/* <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Room</p> */}
              <p className="text-sm font-display font-bold text-slate-900">
                Room {room.roomNumber}
                {room.block?.name && <span className="text-slate-400 font-normal"> · {room.block.name}</span>}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Empty state */}
      {inspections.length === 0 ? (
        <div className="py-24 bg-white rounded-3xl border border-slate-200 shadow-sm text-center">
          <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-100">
            <Clock size={36} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-display font-bold text-slate-900">No Inspections Yet</h3>
          <p className="text-slate-500 mt-2 max-w-xs mx-auto text-sm">
            Your landlord hasn't scheduled any inspections for your room yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {inspections.map((insp) => {
            const cfg = statusConfig[insp.status] || statusConfig.PENDING;
            const isPast = new Date(insp.date) < new Date();

            return (
              <div
                key={insp.id}
                className={`bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col border-t-4 ${cfg.accent}`}
              >
                {/* Card Header */}
                <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </div>
                    {insp.feePaid && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-100 rounded-full text-[10px] font-bold text-green-700 uppercase tracking-wider">
                        <CheckCircle2 size={10} /> Fee Paid
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest shrink-0">
                    #{insp.id.slice(-6).toUpperCase()}
                  </span>
                </div>

                {/* Room & Date */}
                <div className="px-6 pb-5 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Location</p>
                      <p className="text-sm font-bold text-slate-900">
                        Room {insp.room?.roomNumber || room?.roomNumber}
                        {(insp.room?.block?.name || room?.block?.name) && (
                          <span className="text-slate-400 font-normal"> · {insp.room?.block?.name || room?.block?.name}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {isPast ? "Was scheduled" : "Scheduled"}
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {new Date(insp.date).toLocaleDateString("en-GB", {
                          weekday: "short", day: "numeric", month: "short", year: "numeric"
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                <div className="mx-6 mb-5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Landlord Remarks</p>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    {insp.notes || <span className="italic text-slate-400">No remarks provided yet.</span>}
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-auto px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {insp.feePaid ? (
                      <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                        <CheckCircle2 size={11} /> Fee cleared
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                        <AlertCircle size={11} /> Fee pending
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {cfg.icon}
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{cfg.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tips banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Inspection Checklist</p>
          <h2 className="text-2xl font-black tracking-tight mb-3">Preparing for your inspection?</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Ensure your room is clean and all facilities are in the same condition as when you moved in.
            The landlord will check plumbing, electricity, and furniture.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              "Clear all personal belongings from shared areas",
              "Report any existing damages before inspection",
              "Ensure plumbing and electricity are functional",
              "Keep furniture in original position",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5 bg-white/5 px-4 py-3 rounded-2xl border border-white/10">
                <CheckCircle2 size={14} className="text-blue-400 mt-0.5 shrink-0" />
                <span className="text-xs font-medium text-slate-300 leading-snug">{tip}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute top-0 right-0 p-10 opacity-5 hidden lg:block pointer-events-none">
          <ClipboardCheck size={180} />
        </div>
      </div>
    </div>
  );
}
