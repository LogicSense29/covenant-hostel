import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { 
  ArrowLeft, History, AlertCircle, 
  CheckCircle2, Clock, TrendingUp, DollarSign 
} from "lucide-react";
import InteractivePaymentTable from "@/components/InteractivePaymentTable";

export const dynamic = "force-dynamic";

export default async function LandlordTenantPaymentHistoryPage({ params, searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session || !["LANDLORD", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  const { id } = await params;
  const { status: activeTab = "ALL" } = await searchParams;

  const profile = await prisma.tenantProfile.findUnique({
    where: { id },
    include: { 
      room: { include: { billingRules: true } }, 
      user: true 
    },
  });

  if (!profile) notFound();

  // Fetch all payment transactions for this tenant
  const allPayments = await prisma.payment.findMany({
    where: { tenantId: profile.id },
    orderBy: { createdAt: "desc" },
    include: {
      recurringCharge: {
        include: { billingRule: true }
      }
    }
  });

  // Use only the billing rules actually ticked/assigned to this tenant's room
  // to avoid wrong matches when multiple Base Rent rules exist.
  const billingRules = profile.room?.billingRules || [];

  // Calculate aggregates
  const verifiedPayments = allPayments.filter(p => p.status === "VERIFIED" || p.status === "SUCCESS");
  const totalVerifiedAmount = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = allPayments.filter(p => p.status === "PENDING");
  const totalPendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  // Filter based on status tab
  const filteredPayments = allPayments.filter(pmt => {
    if (activeTab === "ALL") return true;
    if (activeTab === "VERIFIED") return pmt.status === "VERIFIED" || pmt.status === "SUCCESS";
    return pmt.status === activeTab;
  });

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500 max-w-5xl mx-auto">
      
      {/* Back Button & Header */}
      <div className="space-y-4">
        <Link 
          href={`/landlord/tenants/${profile.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Tenant Profile
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full w-fit mb-2">
              <History size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Transaction Audit Log</span>
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Payment History</h1>
            <p className="text-slate-500 max-w-xl">
              Audit all transactions, receipts, and pending approval statuses recorded for {profile.user?.name || "this tenant"}.
            </p>
          </div>
        </div>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Verified Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Settled Dues</p>
            <p className="text-2xl font-black text-slate-900">₦{totalVerifiedAmount.toLocaleString()}</p>
            <p className="text-[10px] text-green-600 font-semibold flex items-center gap-1">
              <CheckCircle2 size={10} /> {verifiedPayments.length} successful payment{verifiedPayments.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
            <DollarSign size={24} />
          </div>
        </div>

        {/* Total Pending Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pending Verification</p>
            <p className="text-2xl font-black text-slate-900">₦{totalPendingAmount.toLocaleString()}</p>
            <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
              <Clock size={10} /> {pendingPayments.length} awaiting approval
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Clock size={24} />
          </div>
        </div>

        {/* Total Transactions Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Log Entries</p>
            <p className="text-2xl font-black text-slate-900">{allPayments.length} recorded</p>
            <p className="text-[10px] text-slate-500 font-semibold">
              All time Paystack & bank transfers
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <TrendingUp size={24} />
          </div>
        </div>

      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-px overflow-x-auto">
        {[
          { label: "All Transactions", value: "ALL" },
          { label: "Settled", value: "VERIFIED" },
          { label: "Pending", value: "PENDING" },
          { label: "Rejected", value: "REJECTED" }
        ].map(tab => {
          const isActive = activeTab === tab.value;
          return (
            <Link
              key={tab.value}
              href={`/landlord/tenants/${profile.id}/payment-history?status=${tab.value}`}
              className={`pb-4 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                isActive 
                  ? "border-blue-600 text-blue-600" 
                  : "border-transparent text-slate-400 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Transactions List Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="p-16 text-center">
            <AlertCircle size={32} className="text-slate-300 mx-auto mb-4" />
            <p className="text-sm font-semibold text-slate-500">
              No transactions match this filter.
            </p>
          </div>
        ) : (
          <InteractivePaymentTable payments={filteredPayments} allPayments={allPayments} showTime={true} billingRules={billingRules} />
        )}
      </div>

    </div>
  );
}
