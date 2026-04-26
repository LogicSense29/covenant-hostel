import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  CreditCard, Receipt, History, AlertCircle, CheckCircle2,
  TrendingUp, FileText, Calendar, Layers
} from "lucide-react";
import PaymentFormWrapper from "@/components/PaymentFormWrapper";

export const dynamic = "force-dynamic";

export default async function TenantPaymentsPage() {
  const session = await getServerSession(authOptions);

  const profile = await prisma.tenantProfile.findUnique({
    where: { userId: session.user.id },
    include: { room: true },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { status: true },
  });

  // Show locked state only if there's genuinely no room linked AND user isn't in an active payment flow
  if (!profile || (!profile.room && !["AWAITING_PAYMENT", "PAYMENT_MADE", "ACTIVE"].includes(user?.status))) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200 shadow-xl border-t-4 border-t-blue-500">
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

  // If room isn't linked yet (edge case), show a pending state
  if (!room) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200 shadow-xl border-t-4 border-t-amber-400">
        <div className="bg-amber-50 p-4 rounded-2xl mb-6">
          <CreditCard size={48} className="text-amber-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 text-center">Room Pending Assignment</h1>
        <p className="text-slate-500 mt-4 text-center max-w-md leading-relaxed">
          Your application has been approved. Your room assignment is being finalised — payment details will appear here shortly.
        </p>
      </div>
    );
  }

  const [globalRules, roomRules, paymentHistory] = await Promise.all([
    prisma.billingRule.findMany({ where: { isGlobal: true } }),
    prisma.billingRule.findMany({ where: { roomId: room.id } }),
    prisma.payment.findMany({
      where: { tenantId: profile.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalFees = [...globalRules, ...roomRules].reduce((s, r) => s + r.amount, 0);
  const totalDue = room.rentAmount + totalFees;

  const isPartialMode = profile.allowPartialPayment && profile.partialPaymentInstallments > 1;
  const installmentAmount = isPartialMode ? totalDue / profile.partialPaymentInstallments : null;

  // Compute paid/pending totals
  const verifiedTotal = paymentHistory
    .filter((p) => p.status === "SUCCESS" || p.status === "VERIFIED")
    .reduce((s, p) => s + p.amount, 0);
  const pendingTotal = paymentHistory
    .filter((p) => p.status === "PENDING")
    .reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, totalDue - verifiedTotal);

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full w-fit mb-2">
            <TrendingUp size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Financial Summary</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Rent & Payments</h1>
          <p className="text-slate-500 max-w-xl">
            {isPartialMode
              ? `Partial payment plan active — ${profile.partialPaymentInstallments} installments of ₦${installmentAmount.toLocaleString()} each.`
              : "View your billing breakdown, payment history, and submit rent payments."}
          </p>
        </div>
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              {isPartialMode ? "Remaining Balance" : "Total Outstanding"}
            </p>
            <p className="text-3xl font-black tracking-tight">₦{remaining.toLocaleString()}</p>
            {isPartialMode && (
              <p className="text-xs text-slate-400 mt-1">of ₦{totalDue.toLocaleString()} total</p>
            )}
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CreditCard size={48} />
          </div>
        </div>
      </div>

      {/* Partial payment plan banner */}
      {isPartialMode && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-xl shrink-0">
            <Layers size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-blue-900">Partial payment plan enabled</p>
            <p className="text-xs text-blue-700 mt-1">
              Your landlord has set up a {profile.partialPaymentInstallments}-installment plan.
              Minimum payment per installment: <strong>₦{installmentAmount.toLocaleString()}</strong>.
              Reminders will be sent before each due date.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">

          {/* Billing Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Receipt size={20} className="text-blue-600" />
                Billing Breakdown
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Annual Rent Cycle</span>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-end pb-6 border-b border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-900">Base Room Rent</p>
                  <p className="text-xs text-slate-400">Unit {room.roomNumber}</p>
                </div>
                <p className="text-xl font-black text-slate-900">₦{room.rentAmount.toLocaleString()}</p>
              </div>
              <div className="space-y-3">
                {[...globalRules, ...roomRules].map((rule) => (
                  <div key={rule.id} className="flex justify-between items-center py-2 px-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-white rounded-lg text-slate-400 shadow-sm">
                        <FileText size={14} />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{rule.description}</span>
                      {rule.isGlobal && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">Global</span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-900">+₦{rule.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="pt-6 flex justify-between items-center border-t-2 border-dashed border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Annual Due</p>
                <p className="text-3xl font-black text-slate-900 tracking-tight">₦{totalDue.toLocaleString()}</p>
              </div>
              {isPartialMode && (
                <div className="flex justify-between items-center bg-blue-50 rounded-2xl px-5 py-4">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide flex items-center gap-2">
                    <Calendar size={14} /> Per installment
                  </p>
                  <p className="text-xl font-black text-blue-700">₦{installmentAmount.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <History size={20} className="text-blue-600" />
                Payment History
              </h2>
              {pendingTotal > 0 && (
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                  ₦{pendingTotal.toLocaleString()} pending approval
                </span>
              )}
            </div>
            <div>
              {paymentHistory.length === 0 ? (
                <div className="p-12 text-center">
                  <AlertCircle size={24} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-400">No payment records yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/30 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <th className="px-6 py-4">Reference</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paymentHistory.map((pmt) => (
                        <tr key={pmt.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            {pmt.receiptUrl ? (
                              <a href={pmt.receiptUrl} target="_blank" className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline">
                                <FileText size={14} /> View Receipt
                              </a>
                            ) : (
                              <span className="text-sm font-bold text-slate-500">
                                {pmt.reference ? `#${pmt.reference.slice(-6).toUpperCase()}` : "Paystack"}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900">₦{pmt.amount.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            {pmt.paymentType === "PARTIAL" ? (
                              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                Installment {pmt.installmentNumber}/{pmt.totalInstallments}
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-slate-500">Full</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tighter border ${
                              pmt.status === "VERIFIED" || pmt.status === "SUCCESS"
                                ? "bg-green-50 text-green-600 border-green-100"
                                : pmt.status === "PENDING"
                                ? "bg-amber-50 text-amber-600 border-amber-100"
                                : "bg-red-50 text-red-600 border-red-100"
                            }`}>
                              {pmt.status === "SUCCESS" ? "Confirmed" : pmt.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-xs text-slate-500">
                            {new Date(pmt.createdAt).toLocaleDateString()}
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

        {/* Payment form sidebar */}
        <div className="lg:col-span-1 space-y-8">
          <PaymentFormWrapper
            totalDue={totalDue}
            canPayPartial={profile.allowPartialPayment}
            partialPaymentInstallments={profile.partialPaymentInstallments}
            tenantEmail={session.user.email}
            tenantId={profile.id}
            rentStartDate={profile.rentStartDate}
            existingPayments={paymentHistory}
          />

          <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mb-4">Payment Support</h4>
              <p className="text-xl font-bold mb-2">Need help?</p>
              <p className="text-xs text-blue-100 leading-relaxed">Contact the hostel bursary office for any payment issues.</p>
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
