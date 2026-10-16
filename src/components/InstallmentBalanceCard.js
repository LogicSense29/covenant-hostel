"use client";

import { CreditCard, CheckCircle2, Clock } from "lucide-react";

export default function InstallmentBalanceCard({ profile, allInstallmentCharges = [] }) {
  // Partial payments made by this tenant (SUCCESS or VERIFIED)
  const partialPaymentsMade = profile?.payments?.filter(
    p => (p.status === "SUCCESS" || p.status === "VERIFIED") && p.isPartial
  ) || [];
  
  const paidInstallmentAmount = partialPaymentsMade.reduce((sum, p) => sum + p.amount, 0);

  const lastPayment = [...partialPaymentsMade].sort((a, b) => new Date(b.approvedAt || b.createdAt) - new Date(a.approvedAt || a.createdAt))[0];
  const lastPaymentDate = lastPayment 
    ? new Date(lastPayment.approvedAt || lastPayment.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) 
    : null;

  // --- Path A: New system — installment RecurringCharge records exist ---
  const hasNewSystemCharges = allInstallmentCharges.length > 0;

  let remainingInstallmentCharges = [];
  let remainingBalance = 0;
  let totalPlanAmount = 0;
  let totalInstallmentCount = 0;
  let paidInstallments = 0;
  let nextInstallment = null;
  let hasActiveInstallmentPlan = false;
  let installmentHistoryList = [];

  if (hasNewSystemCharges) {
    remainingInstallmentCharges = allInstallmentCharges.filter(
      c => c.status === "UNPAID" || c.status === "OVERDUE" || c.status === "PENDING"
    );
    remainingBalance = remainingInstallmentCharges.reduce((sum, c) => sum + c.amount, 0);
    paidInstallments = allInstallmentCharges.filter(c => c.status === "PAID").length + 1; // +1 for first payment
    totalInstallmentCount = allInstallmentCharges.length + 1; // +1 for first
    totalPlanAmount = paidInstallmentAmount + remainingBalance;
    nextInstallment = remainingInstallmentCharges[0] || null;
    hasActiveInstallmentPlan = remainingInstallmentCharges.length > 0;

    // Generate List
    const firstPayment = [...partialPaymentsMade].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
    if (firstPayment) {
      installmentHistoryList.push({
        label: "Installment 1",
        amount: firstPayment.amount,
        status: "PAID",
        date: "Paid on " + new Date(firstPayment.approvedAt || firstPayment.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      });
    }
    allInstallmentCharges.forEach((charge, index) => {
      let dateStr = "Due " + new Date(charge.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      if (charge.status === "PAID" && charge.paymentId) {
        const linkedPayment = profile.payments?.find(p => p.id === charge.paymentId);
        if (linkedPayment) {
          dateStr = "Paid on " + new Date(linkedPayment.approvedAt || linkedPayment.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
        } else {
          dateStr = "Paid";
        }
      }
      installmentHistoryList.push({
        label: `Installment ${index + 2}`,
        amount: charge.amount,
        status: charge.status,
        date: dateStr,
      });
    });

  // --- Path B: Legacy fallback — tenant has allowPartialPayment on profile ---
  } else if (profile?.allowPartialPayment && profile?.partialPaymentInstallments > 1 && partialPaymentsMade.length > 0) {
    totalInstallmentCount = profile.partialPaymentInstallments;
    paidInstallments = partialPaymentsMade.length;
    const installmentAmount = partialPaymentsMade[partialPaymentsMade.length - 1]?.amount || 0;
    const installmentsLeft = totalInstallmentCount - paidInstallments;
    remainingBalance = installmentsLeft * installmentAmount;
    totalPlanAmount = paidInstallmentAmount + remainingBalance;
    hasActiveInstallmentPlan = installmentsLeft > 0;
    
    // Generate List
    const sortedPayments = [...partialPaymentsMade].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    sortedPayments.forEach((p, index) => {
      installmentHistoryList.push({
        label: `Installment ${index + 1}`,
        amount: p.amount,
        status: "PAID",
        date: "Paid on " + new Date(p.approvedAt || p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      });
    });
    for (let i = 0; i < installmentsLeft; i++) {
      installmentHistoryList.push({
        label: `Installment ${paidInstallments + i + 1}`,
        amount: installmentAmount,
        status: "UNPAID",
        date: "Not scheduled",
      });
    }
    nextInstallment = null;
  }

  if (!hasActiveInstallmentPlan) return null;

  return (
    <div className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5 space-y-4">
      <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
        <CreditCard size={12} /> Installment Balance
      </h2>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress</span>
          <span className="text-[10px] font-bold text-blue-600">{paidInstallments} of {totalInstallmentCount} paid</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-2 bg-blue-500 rounded-full transition-all"
            style={{ width: `${Math.round((paidInstallments / totalInstallmentCount) * 100)}%` }}
          />
        </div>
      </div>

      {/* Amounts */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">Total Plan</span>
          <span className="text-xs font-bold text-slate-800">₦{totalPlanAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500 flex items-center gap-1"><CheckCircle2 size={10} className="text-green-500" /> Paid so far</span>
          <div className="text-right">
            <div className="text-xs font-bold text-green-600">₦{paidInstallmentAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            {lastPaymentDate && <div className="text-[10px] text-slate-400 mt-0.5">Last paid on {lastPaymentDate}</div>}
          </div>
        </div>
        <div className="flex justify-between items-center border-t border-slate-100 pt-2">
          <span className="text-xs font-bold text-slate-700">Remaining <span className="font-normal text-[10px] text-slate-500 ml-1">({totalInstallmentCount - paidInstallments} left)</span></span>
          <span className="text-sm font-black text-blue-700">₦{remainingBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Installment History Breakdown */}
      {installmentHistoryList.length > 0 && (
        <div className="border border-slate-100 rounded-xl overflow-hidden mt-3">
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Installment List</span>
          </div>
          <div className="divide-y divide-slate-100 bg-white max-h-[200px] overflow-y-auto">
            {installmentHistoryList.map((inst, idx) => (
              <div key={idx} className="flex justify-between items-center px-3 py-2 hover:bg-slate-50/50 transition-colors">
                <div>
                  <p className="text-xs font-bold text-slate-700">{inst.label}</p>
                  <p className={`text-[10px] ${inst.status === 'PAID' ? 'text-emerald-600' : inst.status === 'OVERDUE' ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                    {inst.date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800">₦{inst.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                    inst.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' :
                    inst.status === 'OVERDUE' ? 'bg-red-50 text-red-600' :
                    inst.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {inst.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next due — only available for new-system tenants with scheduled charges */}
      {nextInstallment ? (
        <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2">
          <Clock size={12} className="text-blue-400 shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Next Due</p>
            <p className="text-xs font-bold text-blue-800">
              {new Date(nextInstallment.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} — ₦{nextInstallment.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      ) : hasActiveInstallmentPlan && (
        <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-3 py-2">
          <Clock size={12} className="text-amber-400 shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Next Due</p>
            <p className="text-xs text-amber-700">Not scheduled — tenant must pay next installment manually.</p>
          </div>
        </div>
      )}
    </div>
  );
}
