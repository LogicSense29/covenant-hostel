import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  History, FileText, AlertCircle, ArrowLeft, CheckCircle2,
  Clock, XCircle, TrendingUp, ChevronLeft, ChevronRight
} from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function PaymentHistoryPage({ searchParams }) {
  const session = await getServerSession(authOptions);

  const profile = await prisma.tenantProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <AlertCircle size={40} className="text-slate-300 mb-4" />
        <p className="text-slate-500 font-medium">No profile found.</p>
      </div>
    );
  }

  const page = Math.max(1, parseInt(searchParams?.page || "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const [paymentHistory, totalCount] = await Promise.all([
    prisma.payment.findMany({
      where: { tenantId: profile.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.payment.count({
      where: { tenantId: profile.id },
    }),
  ]);

  // Summary stats — always across ALL payments, not just current page
  const [allVerified, allPending, allRejected] = await Promise.all([
    prisma.payment.aggregate({
      where: { tenantId: profile.id, status: { in: ["SUCCESS", "VERIFIED"] } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: { tenantId: profile.id, status: "PENDING" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.count({
      where: { tenantId: profile.id, status: "REJECTED" },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-8">
        <div className="space-y-2">
          <Link
            href="/tenant/payments"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={15} />
            Back to Rent & Payments
          </Link>
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full w-fit">
            <History size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Full Record</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Payment History</h1>
          <p className="text-slate-500">{totalCount} total transaction{totalCount !== 1 ? "s" : ""} on your account.</p>
        </div>
      </div>

      {/* Summary cards — totals across all payments */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-green-50 rounded-xl">
            <CheckCircle2 size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Confirmed</p>
            <p className="text-xl font-black text-slate-900">₦{(allVerified._sum.amount || 0).toLocaleString()}</p>
            <p className="text-xs text-slate-400">{allVerified._count} transaction{allVerified._count !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-50 rounded-xl">
            <Clock size={20} className="text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Approval</p>
            <p className="text-xl font-black text-slate-900">₦{(allPending._sum.amount || 0).toLocaleString()}</p>
            <p className="text-xs text-slate-400">{allPending._count} transaction{allPending._count !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-red-50 rounded-xl">
            <XCircle size={20} className="text-red-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rejected</p>
            <p className="text-xl font-black text-slate-900">{allRejected}</p>
            <p className="text-xs text-slate-400">transaction{allRejected !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      {/* Transactions table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" />
            All Transactions
          </h2>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            {totalCount} total
          </span>
        </div>

        {totalCount === 0 ? (
          <div className="p-16 text-center">
            <AlertCircle size={32} className="text-slate-200 mx-auto mb-4" />
            <p className="text-sm font-semibold text-slate-400">No payment records yet.</p>
            <p className="text-xs text-slate-300 mt-1">Transactions will appear here once you make a payment.</p>
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
                  {paymentHistory.map((pmt) => (
                    <tr key={pmt.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        {pmt.receiptUrl ? (
                          <a
                            href={pmt.receiptUrl}
                            target="_blank"
                            className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline"
                          >
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
                        {new Date(pmt.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Showing {skip + 1}–{Math.min(skip + PAGE_SIZE, totalCount)} of {totalCount}
                </p>
                <div className="flex items-center gap-2">
                  {hasPrev ? (
                    <Link
                      href={`/tenant/payments/history?page=${page - 1}`}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <ChevronLeft size={14} /> Prev
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-300 bg-slate-50 border border-slate-100 rounded-lg cursor-not-allowed">
                      <ChevronLeft size={14} /> Prev
                    </span>
                  )}

                  <span className="text-xs font-bold text-slate-500 px-2">
                    {page} / {totalPages}
                  </span>

                  {hasNext ? (
                    <Link
                      href={`/tenant/payments/history?page=${page + 1}`}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Next <ChevronRight size={14} />
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-300 bg-slate-50 border border-slate-100 rounded-lg cursor-not-allowed">
                      Next <ChevronRight size={14} />
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
