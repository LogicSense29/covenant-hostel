import { prisma } from "@/lib/prisma";
import BillingRulesManager from "./BillingRulesManager";
import { CreditCard, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const billingRules = await prisma.billingRule.findMany({
    include: { room: true },
    orderBy: { createdAt: "desc" }
  });

  const rooms = await prisma.room.findMany({
    orderBy: { roomNumber: "asc" }
  });

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div className="space-y-1">
          {/* <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full w-fit mb-2">
            <ShieldCheck size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Financial Management</span>
          </div> */}
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Billing & Rules</h1>
          <p className="text-slate-500 max-w-xl">
            Configure automated billing rules that will be applied to tenant rent invoices. 
            You can set global charges for all units or specific room-based fees.
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
           <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
             <CreditCard size={24} />
           </div>
           <div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Billing System</p>
             <p className="text-sm font-bold text-slate-900">v2.0 Active</p>
           </div>
        </div>
      </div>

      <BillingRulesManager defaultRules={billingRules} rooms={rooms} />
    </div>
  );
}
