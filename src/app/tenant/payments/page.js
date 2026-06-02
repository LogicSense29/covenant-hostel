import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  CreditCard, Receipt, History, AlertCircle,
  TrendingUp, Clock, ArrowRight, CheckCircle2
} from "lucide-react";
import RecurringChargePaymentForm from "@/components/RecurringChargePaymentForm";
import PaymentBreakdownPanel from "@/components/PaymentBreakdownPanel";
import InteractivePaymentTable from "@/components/InteractivePaymentTable";

export const dynamic = "force-dynamic";


export default async function TenantPaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Single query — fetch profile, room, and user status together
  const profile = await prisma.tenantProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      room: true,
      user: { select: { status: true } },
    },
  });

  const user = profile?.user ?? null;

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
    // Only fetch billing rules explicitly connected to this room via the many-to-many relation.
    // Global and block-scoped rules are auto-ticked in the room form on creation, so if the
    // landlord unticked them, they will not be in this relation — and should not appear here.
    prisma.billingRule.findMany({
      where: {
        rooms: { some: { id: room.id } },
      },
      orderBy: [{ isGlobal: "desc" }, { type: "asc" }],
    }),
    // Limit to 3 most recent payments at DB level — history page has the full list
    prisma.payment.findMany({
      where: { tenantId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        recurringCharge: {
          include: {
            billingRule: true
          }
        }
      }
    }),
    prisma.recurringCharge.findMany({
      where: { tenantId: profile.id },
      include: { billingRule: true },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  // Find the ticked BASE_RENT rule from the room's connected rules.
  // Its amount is the authoritative rent figure; its frequency drives the label.
  const rentRule = allRules.find(r => {
    const t = String(r.type || "").toUpperCase().replace(/_/g, " ").trim();
    return t === "BASE RENT" || t === "RENT";
  }) || null;

  const rentFrequencyShorthandMap = {
    DAILY: "day",
    MONTHLY: "mo",
    QUARTERLY: "qtr",
    YEARLY: "yr",
    PER_SEMESTER: "sem",
    ONCE: "once"
  };
  const rentFrequencyShorthand = rentFrequencyShorthandMap[rentRule?.frequency || "YEARLY"] || "yr";

  // Use the ticked BASE_RENT rule's amount as the base rent; fall back to room.rentAmount
  const baseRentAmount = rentRule ? rentRule.amount : room.rentAmount;

  const seen = new Set();
  // billingRules used in checkout — BASE_RENT excluded to avoid double-counting
  // (base rent is already the mandatory first line in PaymentBreakdownPanel)
  const billingRules = allRules.filter(r => {
    const t = String(r.type || "").toUpperCase();
    if (t === "BASE_RENT" || t === "BASE RENT") return false;
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  const RECURRING = ["MONTHLY", "QUARTERLY", "YEARLY", "PER_SEMESTER", "DAILY"];

  // recurringRules for the info display — use ALL ticked rules filtered by frequency.
  // This includes BASE_RENT if it's monthly/yearly, and any other recurring charges.
  const recurringRules = allRules.filter(r => RECURRING.includes(r.frequency));

  // Only ONCE fees from non-base-rent rules count toward totalDue
  const oneTimeFees = billingRules.filter(r => !RECURRING.includes(r.frequency));

  const totalFees = oneTimeFees.reduce((s, r) => s + r.amount, 0);
  const totalDue = baseRentAmount + totalFees;

  const isPartialMode = profile.allowPartialPayment && profile.partialPaymentInstallments > 1;
  const installmentAmount = isPartialMode ? totalDue / profile.partialPaymentInstallments : null;

  const verifiedPayments = paymentHistory.filter(p => p.status === "SUCCESS" || p.status === "VERIFIED");
  const verifiedRentPayments = verifiedPayments.filter(p => p.paymentType !== "RECURRING");
  const verifiedRentTotal = verifiedRentPayments.reduce((s, p) => s + p.amount, 0);

  const pendingTotal = paymentHistory.filter(p => p.status === "PENDING").reduce((s, p) => s + p.amount, 0);
  
  // Recurring charge buckets — only show charges that are due today or in the past.
  // Future charges auto-generated by the billing cycle should not show until their due date.
  const _nowUTC = new Date();
  const _endOfToday = new Date(Date.UTC(_nowUTC.getFullYear(), _nowUTC.getMonth(), _nowUTC.getDate(), 23, 59, 59, 999));
  const unpaidCharges = recurringCharges.filter(c =>
    (c.status === "UNPAID" || c.status === "OVERDUE") &&
    new Date(c.dueDate) <= _endOfToday
  );
  const pendingCharges = recurringCharges.filter(c => c.status === "PENDING");
  const unpaidRecurringTotal = unpaidCharges.reduce((s, c) => s + c.amount, 0);

  // Upcoming scheduled charges (future, past today — shown as a preview only, not as due)
  const upcomingCharges = recurringCharges.filter(c =>
    c.status === "UNPAID" && new Date(c.dueDate) > _endOfToday
  );

  // If tenancy is EXPIRED, they must pay for a new cycle, so outstanding rent remaining should be the totalDue
  const rentRemaining = user?.status === "EXPIRED" ? totalDue : Math.max(0, totalDue - verifiedRentTotal);

  // The true comprehensive outstanding balance includes rent remaining plus any unpaid recurring charges
  const remaining = rentRemaining + unpaidRecurringTotal;

  // Rent state and overall state are separate concerns
  const isRentPaid = user?.status !== "EXPIRED" && rentRemaining === 0 && verifiedRentTotal > 0;
  const isFullyPaid = isRentPaid && unpaidCharges.length === 0;

  // For the status card — use the most recent rent payment (not recurring)
  const latestRentPayment = verifiedRentPayments[0] || null;

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
          <InteractivePaymentTable payments={paymentHistory.slice(0, 3)} allPayments={paymentHistory} showTime={false} billingRules={allRules} />
          {paymentHistory.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
              <Link
                href="/tenant/payments/history"
                className="flex items-center justify-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                View all payment history
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
            <span className="text-sm font-bold text-slate-900 ml-4">
              ₦{rule.amount.toLocaleString()}
              <span className="text-slate-400 font-normal">/{freqLabel(rule.frequency)}</span>
            </span>
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
              <p className="text-2xl font-black tracking-tight">All Clear</p>
              <div className="mt-1 space-y-0.5">
                {latestRentPayment && (
                  <p className="text-xs text-green-200">
                    Rent last paid on {new Date(latestRentPayment.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                )}
                {profile.rentExpiryDate && (
                  <p className="text-xs text-green-300">
                    Tenancy expires {new Date(profile.rentExpiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                )}
              </div>
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

          {/* Recurring charges due today or earlier */}
          {RecurringSection}

          {/* Upcoming scheduled charges — preview of what's coming next */}
          {unpaidCharges.length === 0 && upcomingCharges.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-blue-50/30">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Clock size={18} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Upcoming Payments</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Scheduled — no action needed yet</p>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {upcomingCharges.map(charge => (
                  <div key={charge.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {charge.billingRule?.title || charge.billingRule?.description}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Due {new Date(charge.dueDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                     <span className="text-sm font-bold text-slate-500">₦{charge.amount.toLocaleString()}/{freqLabel(charge.billingRule?.frequency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent payments */}
          {RecentPaymentsCard}
        </div>
      ) : (
        /* ── RENT UNPAID: Unified single-column view with secure checkout modal ── */
        <div className="space-y-10">
          <PaymentBreakdownPanel
            room={room}
            baseRentAmount={baseRentAmount}
            billingRules={billingRules}
            unpaidCharges={unpaidCharges}
            totalDue={totalDue}
            isPartialMode={isPartialMode}
            installmentAmount={installmentAmount}
            profile={profile}
            session={session}
            paymentHistory={paymentHistory}
            rentFrequencyShorthand={rentFrequencyShorthand}
          />

          {/* Recent Payments */}
          {RecentPaymentsCard}

          {/* Payment Support Footer */}
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="relative z-10 space-y-1">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Payment Support</h4>
              <p className="text-xl font-bold">Need assistance with your billing?</p>
              <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                If you have questions about caution deposits, global room fees, or recurring charge calculations, please contact the hostel bursary office.
              </p>
            </div>
            <div className="relative z-10 shrink-0">
              <Link 
                href="/tenant/complaints"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/10 transition-colors"
              >
                Log a Complaint
              </Link>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Receipt size={120} strokeWidth={1} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Frequency label shorthand
function freqLabel(frequency) {
  const map = {
    ONCE: "once",
    DAILY: "day",
    MONTHLY: "mo",
    QUARTERLY: "qtr",
    YEARLY: "yr",
    PER_SEMESTER: "sem",
  };
  return map[frequency] || frequency?.toLowerCase() || "yr";
}
