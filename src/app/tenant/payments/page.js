import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import dynamic from "next/dynamic";
import { 
  CreditCard, 
  Receipt, 
  History, 
  AlertCircle, 
  CheckCircle2,
  TrendingUp,
  FileText
} from "lucide-react";

import PaymentFormWrapper from "@/components/PaymentFormWrapper";

export const dynamic = "force-dynamic";

export default async function TenantPaymentsPage() {
  const session = await getServerSession(authOptions);
  
  const profile = await prisma.tenantProfile.findUnique({
    where: { userId: session.user.id },
    include: { room: true }
  });

  if (!profile || !profile.room) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200 shadow-xl border-t-4 border-t-blue-500 animate-in fade-in duration-700">
        <div className="bg-blue-50 p-4 rounded-2xl mb-6">
          <CreditCard size={48} className="text-blue-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 text-center">Financial Portal Locked</h1>
        <p className="text-slate-500 mt-4 text-center max-w-md leading-relaxed">
          Payment details will be available once you have been allocated to a room. 
        </p>
      </div>
    );
  }

  const room = profile.room;

  // Fetch Global Rules
  const globalRules = await prisma.billingRule.findMany({
    where: { isGlobal: true }
  });

  // Fetch Room Specific Rules
  const roomRules = await prisma.billingRule.findMany({
    where: { roomId: room.id }
  });

  const paymentHistory = await prisma.payment.findMany({
    where: { tenantId: profile.id },
    orderBy: { createdAt: "desc" }
  });

  const totalFees = [...globalRules, ...roomRules].reduce((sum, rule) => sum + rule.amount, 0);
  const totalDue = room.rentAmount + totalFees;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full w-fit mb-2">
            <TrendingUp size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Financial Summary</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Rent & Payments</h1>
          <p className="text-slate-500 max-w-xl">
            View your billing breakdown, payment history, and submit new rent payments.
          </p>
        </div>
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-2xl relative overflow-hidden group">
           <div className="relative z-10">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Outstanding</p>
             <p className="text-3xl font-black tracking-tight">₦{totalDue.toLocaleString()}</p>
           </div>
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
             <CreditCard size={48} />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Billing Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Receipt size={20} className="text-blue-600" />
                Current Billing Breakdown
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Annual Rent Cycle</span>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-end pb-6 border-b border-slate-100 group">
                <div className="space-y-1">
                   <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Base Room Rent</p>
                   <p className="text-xs text-slate-400">Fixed annual room charge for Unit {room.roomNumber}</p>
                </div>
                <p className="text-xl font-black text-slate-900">₦{room.rentAmount.toLocaleString()}</p>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Applied Fees & Levies</p>
                {[...globalRules, ...roomRules].map((rule) => (
                  <div key={rule.id} className="flex justify-between items-center py-2 px-4 bg-slate-50 rounded-2xl border border-slate-100/50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                       <div className="p-1.5 bg-white rounded-lg text-slate-400 shadow-sm">
                         <FileText size={14} />
                       </div>
                       <span className="text-sm font-semibold text-slate-700">{rule.description}</span>
                       {rule.isGlobal && (
                         <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full uppercase border border-indigo-100">Global</span>
                       )}
                    </div>
                    <span className="text-sm font-bold text-slate-900">+${rule.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="pt-6 flex justify-between items-center text-xl font-black text-slate-900 border-t-2 border-slate-100 border-dashed">
                <p className="uppercase tracking-wide text-xs font-bold text-slate-400">Total Annual Due</p>
                <p className="text-3xl tracking-tight">₦{totalDue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <History size={20} className="text-blue-600" />
                Payment History
              </h2>
            </div>
            
            <div className="p-0">
              {paymentHistory.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <AlertCircle size={24} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-400">No payment records found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="bg-slate-50/30 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                         <th className="px-8 py-4">Receipt</th>
                         <th className="px-8 py-4">Amount</th>
                         <th className="px-8 py-4">Status</th>
                         <th className="px-8 py-4 text-right">Date</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {paymentHistory.map((pmt) => (
                          <tr key={pmt.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-5">
                               <a href={pmt.receiptUrl} target="_blank" className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline">
                                 <FileText size={16} /> RECPT-{pmt.id.slice(-4).toUpperCase()}
                               </a>
                            </td>
                            <td className="px-8 py-5 font-bold text-slate-900">${pmt.amount.toLocaleString()}</td>
                            <td className="px-8 py-5">
                               <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tighter border ${
                                 pmt.status === 'VERIFIED' ? 'bg-green-50 text-green-600 border-green-100' :
                                 pmt.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                 'bg-red-50 text-red-600 border-red-100'
                               }`}>
                                 {pmt.status}
                               </span>
                            </td>
                            <td className="px-8 py-5 text-right text-xs text-slate-500 font-medium">
                               {new Date(pmt.paymentDate).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                     </tbody>
                   </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
           <PaymentFormWrapper 
             totalDue={totalDue} 
             canPayPartial={profile.canPayPartial} 
             tenantEmail={session.user.email}
           />
           
           <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mb-4">Payment Support</h4>
                 <p className="text-xl font-bold mb-2">Need help with payments?</p>
                 <p className="text-xs text-blue-100 leading-relaxed font-medium">If you encounter any issues during the payment process, please contact the hostel bursary office immediately.</p>
                 <button className="mt-6 flex items-center gap-2 text-sm font-bold bg-white text-blue-600 px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors w-full justify-center">
                    Speak to Support
                 </button>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Receipt size={80} strokeWidth={1} />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
