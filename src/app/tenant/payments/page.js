import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  CreditCard, Receipt, History, AlertCircle,
  TrendingUp, FileText, Calendar, BadgeCheck, Clock, ArrowRight, CheckCircle2
} from "lucide-react";
import PaymentFormWrapper from "@/components/PaymentFormWrapper";
import RecurringChargePaymentForm from "@/components/RecurringChargePaymentForm";

export const dynamic = "force-dynamic";

// Reusable payment history table rows
function PaymentRow({ pmt }) {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
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
        ) : pmt.paymentType === "RECURRING" ? (
          <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
            Recurring
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
        {new Date(pmt.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
      </td>
    </tr>
  );
}

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

  if (!profile || (!profile.room && !["AWAITING_PAYMENT", "PAYMENT_MADE", "ACTIVE", "EXPIRED"].includes(user?.status))) {
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

  // Expired tenants see a renewal prompt — not the full payment form
  if (user?.status === "EXPIRED") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200 shadow-xl border-t-4 border-t-red-500">
        <div className="bg-red-50 p-4 rounded-2xl mb-6">
          <CreditCard size={48} className="text-red-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 text-center">Tenancy Expired</h1>
        <p className="text-slate-500 mt-4 text-center max-w-md leading-relaxed">
          Your tenancy expired on{" "}
          <strong className="text-slate-700">
            {profile.rentExpiryDate
              ? new Date(profile.rentExpiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
              : "N/A"}
          </strong>. Please contact the hostel management office to arrange renewal. Once your renewal payment is confirmed, your access will be restored.
        </p>
        <div className="mt-8 p-5 bg-slate-50 rounded-2xl border border-slate-100 w-full max-w-sm text-center space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Room</p>
          <p className="text-lg font-black text-slate-900">{room ? `Room ${room.roomNumber}` : "N/A"}</p>
          <p className="text-xs text-slate-400">Contact the bursary office to renew</p>
        </div>
      </div>
    );
  }

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

  const [allRules, paymentHistory, recurringCharges] = await Promise.all([
    prisma.billingRule.findMany({
      where: {
        OR: [
          { isGlobal: true },
          { blockId: room.blockId ?? undefined },
          { rooms: { some: { id: room.id } } },
        ],
      },
      orderBy: [{ isGlobal: "desc" }, { type: "asc" }],
    }),
    prisma.payment.findMany({
      where: { tenantId: profile.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.recurringCharge.findMany({
      where: { tenantId: profile.id },
      include: { billingRule: true },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  const seen = new Set();
  const billingRules = allRules.filter(r => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  const RECURRING = ["MONTHLY", "QUARTERLY", "YEARLY", "PER_SEMESTER", "DAILY"];
  const recurringRules = billingRules.filter(r => RECURRING.includes(r.frequency));
  // Only ONCE fees count toward the base rent total — recurring fees are billed separately
  const oneTimeFees = billingRules.filter(r => !RECURRING.includes(r.frequency));

  const totalFees = oneTimeFees.reduce((s, r) => s + r.amount, 0);
  const totalDue = room.rentAmount + totalFees;

  const isPartialMode = profile.allowPartialPayment && profile.partialPaymentInstallments > 1;
  const installmentAmount = isPartialMode ? totalDue / profile.partialPaymentInstallments : null;

  const verifiedPayments = paymentHistory.filter(p => p.status === "SUCCESS" || p.status === "VERIFIED");
  const verifiedTotal = verifiedPayments.reduce((s, p) => s + p.amount, 0);
  const pendingTotal = paymentHistory.filter(p => p.status === "PENDING").reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, totalDue - verifiedTotal);

  // Recurring charge buckets
  const unpaidCharges = recurringCharges.filter(c => c.status === "UNPAID" || c.status === "OVERDUE");
  const pendingCharges = recurringCharges.filter(c => c.status === "PENDING");

  // Rent state and overall state are separate concerns
  const isRentPaid = remaining === 0 && verifiedTotal > 0;
  const isFullyPaid = isRentPaid && unpaidCharges.length === 0;

  const latestPayment = verifiedPayments[0] || null;

  // ── Shared: Recent Payments table ──
  const RecentPaymentsCard = (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <History size={20} className="text-blue-600" />
          Recent Payments
        </h2>
        {pendingTotal > 0 && (
          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
            ₦{pendingTotal.toLocaleString()} pending approval
          </span>
        )}
      </div>
      {paymentHistory.length === 0 ? (
        <div className="p-12 text-center">
          <AlertCircle size={24} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-400">No payment records yet.</p>
        </div>
      ) : (
        <>
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
                {paymentHistory.slice(0, 5).map((pmt) => (
                  <PaymentRow key={pmt.id} pmt={pmt} />
                ))}
              </tbody>
            </table>
          </div>
          {paymentHistory.length > 5 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
              <Link
                href="/tenant/payments/history"
                className="flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                View all {paymentHistory.length} payments
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );

  // ── Shared: Recurring charges section ──
  // Shows unpaid charges with pay buttons, pending notice, or all-clear info
  const RecurringSection = unpaidCharges.length > 0 ? (
    <div className="bg-white rounded-3xl border border-red-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-red-50 flex items-center justify-between bg-red-50/40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-xl">
            <Receipt size={18} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recurring Charges Due</h2>
            <p className="text-xs text-slate-500 mt-0.5">These are separate from your base rent</p>
          </div>
        </div>
        <span className="text-xs font-bold text-red-600 bg-white px-3 py-1 rounded-full border border-red-200">
          {unpaidCharges.length} outstanding
        </span>
      </div>
      <div className="p-6 space-y-4">
        {unpaidCharges.map(charge => (
          <RecurringChargePaymentForm
            key={charge.id}
            charge={charge}
            tenantEmail={session.user.email}
            tenantId={profile.id}
          />
        ))}
      </div>
    </div>
  ) : pendingCharges.length > 0 ? (
    <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex items-start gap-4">
      <div className="p-2 bg-amber-100 rounded-xl shrink-0">
        <Clock size={18} className="text-amber-600" />
      </div>
      <div>
        <p className="text-sm font-bold text-amber-900">Recurring charge receipt under review</p>
        <p className="text-xs text-amber-700 mt-1">
          {pendingCharges.length} receipt{pendingCharges.length > 1 ? "s" : ""} submitted and awaiting landlord approval.
        </p>
      </div>
    </div>
  ) : recurringRules.length > 0 ? (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/20">
        <Receipt size={20} className="text-blue-600" />
        <div>
          <h2 className="text-lg font-bold text-slate-900">Recurring Charges</h2>
          <p className="text-xs text-slate-400 mt-0.5">All charges are up to date</p>
        </div>
      </div>
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {recurringRules.map(rule => (
          <div key={rule.id} className="flex justify-between items-center py-3 px-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-700">{rule.title || rule.description}</p>
              <span className="text-[9px] font-bold text-blue-600 uppercase">{rule.frequency?.replace(/_/g, " ")}</span>
            </div>
            <span className="text-sm font-bold text-slate-900 ml-4">₦{rule.amount.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  ) : null;

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
            View your billing breakdown, payment history, and submit rent payments.
          </p>
        </div>

        {/* Balance card — green when everything settled, dark when anything outstanding */}
        {isFullyPaid ? (
          <div className="bg-green-600 text-white p-6 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-green-200 uppercase tracking-widest mb-1">Payment Status</p>
              <p className="text-2xl font-black tracking-tight">Paid in Full</p>
              <p className="text-xs text-green-200 mt-1">₦{verifiedTotal.toLocaleString()} confirmed</p>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CheckCircle2 size={48} />
            </div>
          </div>
        ) : isRentPaid && unpaidCharges.length > 0 ? (
          // Rent paid but recurring charges outstanding — amber state
          <div className="bg-amber-500 text-white p-6 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-amber-100 uppercase tracking-widest mb-1">Charges Due</p>
              <p className="text-2xl font-black tracking-tight">
                ₦{unpaidCharges.reduce((s, c) => s + c.amount, 0).toLocaleString()}
              </p>
              <p className="text-xs text-amber-100 mt-1">
                {unpaidCharges.length} recurring charge{unpaidCharges.length > 1 ? "s" : ""} outstanding
              </p>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Receipt size={48} />
            </div>
          </div>
        ) : (
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
        )}
      </div>

      {/* ── RENT PAID: single-column, recurring charges as their own section ── */}
      {isRentPaid ? (
        <div className="space-y-8">
          {/* Rent confirmed card */}
          <div className="bg-white rounded-3xl border border-green-200 shadow-sm overflow-hidden">
            <div className="p-6 bg-green-50 border-b border-green-100 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <BadgeCheck size={20} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-green-900">Rent Confirmed</h2>
                <p className="text-xs text-green-600 mt-0.5">Your base rent for this cycle has been settled</p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Total Paid</p>
                <p className="text-2xl font-black text-green-600">₦{verifiedTotal.toLocaleString()}</p>
              </div>
              {latestPayment && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Last Payment</p>
                  <p className="text-sm font-bold text-slate-700">
                    {new Date(latestPayment.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              )}
              {profile.rentExpiryDate && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1">
                    <Clock size={11} /> Tenancy Expires
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {new Date(profile.rentExpiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recurring charges — independent of rent state */}
          {RecurringSection}

          {/* Recent payments */}
          {RecentPaymentsCard}
        </div>
      ) : (
        /* ── RENT UNPAID: 3-col grid with payment form in sidebar ── */
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
                    <p className="text-xs text-slate-400">Room {room.roomNumber}</p>
                  </div>
                  <p className="text-xl font-black text-slate-900">₦{room.rentAmount.toLocaleString()}</p>
                </div>
                <div className="space-y-3">
                  {billingRules.map((rule) => (
                    <div key={rule.id} className="flex justify-between items-center py-2 px-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white rounded-lg text-slate-400 shadow-sm">
                          <FileText size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{rule.title || rule.description}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{rule.frequency?.replace(/_/g, " ") || "ONCE"}</span>
                            <span className="text-slate-200">·</span>
                            {rule.isGlobal ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">Global</span>
                            ) : rule.blockId ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded-full border border-purple-100">Block</span>
                            ) : (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">Room</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-slate-900">₦{rule.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-6 flex justify-between items-center border-t-2 border-dashed border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Annual Due</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tight">₦{totalDue.toLocaleString()}</p>
                </div>
                {isPartialMode && (
                  <div className="flex justify-between items-center bg-blue-50 rounded-2xl px-5 py-4">
                    <div>
                      <p className="text-xs font-bold text-blue-700 uppercase tracking-wide flex items-center gap-2">
                        <Calendar size={14} /> Installment plan
                      </p>
                      <p className="text-xs text-blue-500 mt-0.5">
                        {profile.partialPaymentInstallments} payments · ₦{installmentAmount.toLocaleString()} each
                      </p>
                    </div>
                    <p className="text-xl font-black text-blue-700">₦{installmentAmount.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recurring charges — shown here too if any are due */}
            {RecurringSection}

            {/* Recent Payments */}
            {RecentPaymentsCard}
          </div>

          {/* Sidebar — payment form + support */}
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
      )}
    </div>
  );
}
