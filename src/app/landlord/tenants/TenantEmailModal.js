"use client";

import { useState } from "react";
import { X, Mail, RefreshCw, Send, CreditCard, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";

const SYSTEM_EMAILS = [
  {
    type: "resend_approval",
    icon: RefreshCw,
    label: "Resend Approval Email",
    description: "Generates a fresh setup link and resends the account activation email.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    statuses: ["AWAITING_PAYMENT", "PENDING"],
  },
  {
    type: "payment_reminder",
    icon: CreditCard,
    label: "Payment Reminder",
    description: "Reminds the tenant that their rent payment is outstanding.",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    statuses: ["AWAITING_PAYMENT", "ACTIVE"],
  },
  {
    type: "rent_expiry",
    icon: AlertTriangle,
    label: "Rent Expiry Warning",
    description: "Sends a reminder that their rent is expiring soon.",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
    statuses: ["ACTIVE"],
  },
];

export default function TenantEmailModal({ tenant, onClose }) {
  const [tab, setTab] = useState("system");
  const [sending, setSending] = useState(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sendingCustom, setSendingCustom] = useState(false);

  const status = tenant.user?.status;

  const sendSystemEmail = async (type) => {
    setSending(type);
    try {
      const res = await fetch("/api/landlord/email-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: tenant.userId, type }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Email sent!");
      } else {
        toast.error(await res.text() || "Failed to send email");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSending(null);
    }
  };

  const sendCustomEmail = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    setSendingCustom(true);
    try {
      const res = await fetch("/api/landlord/email-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: tenant.userId, type: "custom", subject, message }),
      });
      if (res.ok) {
        toast.success("Email sent successfully!");
        setSubject("");
        setMessage("");
      } else {
        toast.error(await res.text() || "Failed to send email");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSendingCustom(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Mail size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Send Email</h3>
              <p className="text-xs text-slate-400 mt-0.5">To: {tenant.user?.name} · {tenant.user?.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 mx-6 mt-4 bg-slate-100 rounded-2xl shrink-0">
          <button
            onClick={() => setTab("system")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${tab === "system" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            System Emails
          </button>
          <button
            onClick={() => setTab("custom")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${tab === "custom" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Custom Email
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === "system" ? (
            <div className="space-y-3">
              {SYSTEM_EMAILS.map(({ type, icon: Icon, label, description, color, bg, border, statuses }) => {
                const available = statuses.includes(status);
                const isLoading = sending === type;
                return (
                  <div
                    key={type}
                    className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${available ? `${bg} ${border}` : "bg-slate-50 border-slate-100 opacity-50"}`}
                  >
                    <div className={`p-2 rounded-xl ${available ? bg : "bg-slate-100"} shrink-0`}>
                      <Icon size={16} className={available ? color : "text-slate-400"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900">{label}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
                      {!available && (
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">
                          Not applicable for current status ({status?.replace("_", " ")})
                        </p>
                      )}
                    </div>
                    <button
                      disabled={!available || !!sending}
                      onClick={() => sendSystemEmail(type)}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        available
                          ? "bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-sm disabled:opacity-50"
                          : "bg-slate-100 text-slate-300 cursor-not-allowed"
                      }`}
                    >
                      {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                      Send
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={sendCustomEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Important notice regarding your tenancy"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Message</label>
                <textarea
                  rows={7}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message here..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={sendingCustom}
                className="w-full py-3 bg-[#0b69ff] text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/20"
              >
                {sendingCustom ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Send Email
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
