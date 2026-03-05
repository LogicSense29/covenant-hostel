"use client";

import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ApprovalActions({ userId, status }) {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    if (!confirm("Are you sure you want to approve this tenant? An email with a setup link will be sent.")) {
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Approving tenant...");

    try {
      const res = await fetch("/api/landlord/approve-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        toast.success("Tenant approved successfully!", { id: toastId });
        window.location.reload(); // Refresh to update status
      } else {
        const errorText = await res.text();
        toast.error(errorText || "Approval failed", { id: toastId });
      }
    } catch (err) {
      toast.error("An unexpected error occurred", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (status === "ACTIVE") return null;

  if (status === "APPROVED") {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 italic">
        <span className="text-[10px] font-bold uppercase tracking-wider">Awaiting Activation</span>
      </div>
    );
  }

  return (
    <button 
      onClick={handleApprove} 
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm hover:shadow active:scale-95 disabled:bg-slate-200 disabled:text-slate-400"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
      Approve
    </button>
  );
}
