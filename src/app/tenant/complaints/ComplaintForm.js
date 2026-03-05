"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Send, Loader2, AlertCircle, ShieldAlert } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ComplaintForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [issueDescription, setIssueDescription] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/maintenance/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          issueDescription,
          category: "COMPLAINT"
        }),
      });

      if (res.ok) {
        toast.success("Complaint submitted successfully!");
        setIssueDescription("");
        router.refresh();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to submit complaint.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
      <div className="bg-red-600 p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-2xl font-bold flex items-center gap-3">
            <ShieldAlert className="text-red-100" />
            File a Complaint
          </h3>
          <p className="text-red-100/80 mt-2 font-medium">Describe your issue clearly for immediate review.</p>
        </div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Complaint Details</label>
          <textarea
            required
            rows={6}
            placeholder="Please provide details about the noise, dispute, or issue you're facing..."
            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium outline-none focus:ring-4 focus:ring-red-500/10 focus:bg-white focus:border-red-500 transition-all resize-none"
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
          />
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl flex items-start gap-3 border border-amber-100">
          <AlertCircle className="text-amber-600 mt-0.5" size={18} />
          <p className="text-xs text-amber-700 leading-relaxed font-medium">
            Complaints are officially logged and visible to the hostel administrator for mediation and resolution.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-5 bg-red-600 text-white rounded-2xl text-base font-bold hover:bg-red-700 shadow-xl shadow-red-500/20 active:translate-y-px transition-all disabled:bg-slate-200 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Submitting Ticket...
            </>
          ) : (
            <>
              <Send size={20} />
              Submit Complaint
            </>
          )}
        </button>
      </form>
    </div>
  );
}
