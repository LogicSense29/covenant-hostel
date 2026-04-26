"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2, Send } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ApprovalActions({ userId, status }) {
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  const confirmAction = (message, onConfirm) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-slate-800">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={() => { toast.dismiss(t.id); onConfirm(); }}
            className="flex-1 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Confirm
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 10000 });
  };

  const handleApprove = () => {
    confirmAction(
      "Approve this tenant? An email with a setup link will be sent.",
      async () => {
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
            window.location.reload();
          } else {
            const errorText = await res.text();
            toast.error(errorText || "Approval failed", { id: toastId });
          }
        } catch {
          toast.error("An unexpected error occurred", { id: toastId });
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectNote.trim()) {
      toast.error("Please provide a rejection note.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Rejecting application...");

    try {
      const res = await fetch("/api/landlord/reject-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, reason: rejectNote }),
      });

      if (res.ok) {
        toast.success("Application rejected and email sent.", { id: toastId });
        setShowRejectModal(false);
        window.location.reload();
      } else {
        const errorText = await res.text();
        toast.error(errorText || "Rejection failed", { id: toastId });
      }
    } catch {
      toast.error("An error occurred during rejection", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = () => {
    confirmAction(
      "Activate this tenancy? The tenancy start date will be set to today.",
      async () => {
        setLoading(true);
        const toastId = toast.loading("Activating tenancy...");
        try {
          const res = await fetch("/api/landlord/activate-tenancy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          });
          if (res.ok) {
            toast.success("Tenancy activated successfully!", { id: toastId });
            window.location.reload();
          } else {
            const errorText = await res.text();
            toast.error(errorText || "Activation failed", { id: toastId });
          }
        } catch {
          toast.error("An unexpected error occurred", { id: toastId });
        } finally {
          setLoading(false);
        }
      }
    );
  };

  if (status === "ACTIVE") return null;

  if (status === "AWAITING_PAYMENT") {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 italic">
        <span className="text-[10px] font-bold uppercase tracking-wider">Awaiting Payment</span>
      </div>
    );
  }

  if (status === "PAYMENT_MADE") {
    return (
      <button 
        onClick={handleActivate} 
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:bg-slate-200"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
        Verify & Activate
      </button>
    );
  }

  if (status === "REJECTED") {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg border border-red-100 italic">
        <span className="text-[10px] font-bold uppercase tracking-wider">Rejected</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button 
          onClick={handleApprove} 
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm hover:shadow active:scale-95 disabled:bg-slate-200 disabled:text-slate-400"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
          Approve
        </button>

        <button 
          onClick={() => setShowRejectModal(true)} 
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-50 transition-all shadow-sm active:scale-95 disabled:bg-slate-50 disabled:text-slate-300"
        >
          <XCircle size={14} />
          Reject
        </button>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <XCircle size={20} className="text-red-600" />
                Reject Application
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <XCircle size={20} />
              </button>
            </div>
            
            <form onSubmit={handleReject} className="p-6 space-y-4">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                 <p className="text-xs text-amber-700 font-medium leading-relaxed">
                   Please provide a reason for rejection. This will be sent as an email to the applicant to help them understand why their application was not successful.
                 </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Rejection Note</label>
                <textarea
                  required
                  rows="4"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-red-500/10 focus:bg-white focus:border-red-500 transition-all placeholder:text-slate-300 resize-none"
                  placeholder="e.g. ID document is not clear, information provided is inconsistent..."
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-3 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:bg-slate-300"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Send Rejection Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
