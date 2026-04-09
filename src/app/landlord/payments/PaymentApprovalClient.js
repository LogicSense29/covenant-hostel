"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, CheckCircle2, XCircle, FileText, Loader2, Filter } from "lucide-react";
import { toast } from "react-hot-toast";

export default function PaymentApprovalClient({ payments }) {
  const router = useRouter();
  const [filter, setFilter] = useState("PENDING");
  const [loadingId, setLoadingId] = useState(null);

  const filtered = payments.filter((p) => filter === "ALL" || p.status === filter);

  const counts = {
    ALL: payments.length,
    PENDING: payments.filter((p) => p.status === "PENDING").length,
    VERIFIED: payments.filter((p) => p.status === "VERIFIED" || p.status === "SUCCESS").length,
    REJECTED: payments.filter((p) => p.status === "REJECTED").length,
  };

  const handleApprove = async (id) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/payments/${id}/approve`, { method: "POST" });
      if (res.ok) { toast.success("Payment approved"); router.refresh(); }
      else toast.error("Failed to approve");
    } catch { toast.error("Error"); }
    finally { setLoadingId(null); }
  };

  const handleReject = async (id) => {
    if (!confirm("Reject this payment? The tenant will be notified.")) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/payments/${id}/approve`, { method: "DELETE" });
      if (res.ok) { toast.success("Payment rejected"); router.refresh(); }
      else toast.error("Failed to reject");
    } catch { toast.error("Error"); }
    finally { setLoadingId(null); }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Payment Approvals</h1>
          <p className="text-slate-500 mt-1">Review and approve tenant receipt uploads.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-1">
          {["PENDING", "VERIFIED", "REJECTED", "ALL"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === f ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {f === "VERIFIED" ? "Approved" : f.charAt(0) + f.slice(1).toLowerCase()}
              {counts[f] > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                  filter === f ? "bg-white/20" : "bg-slate-100"
                }`}>
                  {counts[f]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
          <CreditCard size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-400">No {filter.toLowerCase()} payments.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Tenant</th>
                  <th className="px-6 py-4">Room</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Receipt</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((pmt) => (
                  <tr key={pmt.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{pmt.tenant?.user?.name || "—"}</p>
                      <p className="text-xs text-slate-400">{pmt.tenant?.user?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      {pmt.tenant?.room ? `Room ${pmt.tenant.room.roomNumber}` : "—"}
                      {pmt.tenant?.room?.block && (
                        <span className="block text-xs text-slate-400">{pmt.tenant.room.block.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900">₦{pmt.amount.toLocaleString()}</td>
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
                      {pmt.receiptUrl ? (
                        <a
                          href={pmt.receiptUrl}
                          target="_blank"
                          className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                        >
                          <FileText size={14} /> View
                        </a>
                      ) : (
                        <span className="text-xs text-slate-300">Paystack</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border ${
                        pmt.status === "VERIFIED" || pmt.status === "SUCCESS"
                          ? "bg-green-50 text-green-600 border-green-100"
                          : pmt.status === "PENDING"
                          ? "bg-amber-50 text-amber-600 border-amber-100"
                          : "bg-red-50 text-red-600 border-red-100"
                      }`}>
                        {pmt.status === "SUCCESS" ? "Confirmed" : pmt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(pmt.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {pmt.status === "PENDING" && pmt.receiptUrl && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(pmt.id)}
                            disabled={loadingId === pmt.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {loadingId === pmt.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(pmt.id)}
                            disabled={loadingId === pmt.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 border border-red-100 transition-colors disabled:opacity-50"
                          >
                            <XCircle size={12} />
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
