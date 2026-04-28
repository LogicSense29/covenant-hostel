"use client";

import { useState, useMemo } from "react";
import { X, Mail, Send, Loader2, Users, CheckSquare, Square } from "lucide-react";
import { toast } from "react-hot-toast";

const STATUS_FILTERS = [
  { label: "All Tenants", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Awaiting Payment", value: "AWAITING_PAYMENT" },
  { label: "Payment Made", value: "PAYMENT_MADE" },
  { label: "Pending", value: "PENDING" },
];

const TEMPLATES = [
  { type: "payment_reminder", label: "Payment Reminder", desc: "Remind tenants that rent payment is outstanding." },
  { type: "rent_expiry", label: "Rent Expiry Warning", desc: "Warn tenants their rent is expiring soon. Skips tenants with no expiry date." },
  { type: "custom", label: "Custom Message", desc: "Write your own subject and message." },
];

export default function BulkEmailModal({ tenants, onClose }) {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState([]);
  const [type, setType] = useState("payment_reminder");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState(1); // 1 = recipients, 2 = compose

  const filtered = useMemo(() =>
    tenants.filter(t => statusFilter === "ALL" || t.user?.status === statusFilter),
    [tenants, statusFilter]
  );

  const allSelected = filtered.length > 0 && filtered.every(t => selected.includes(t.userId));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(prev => prev.filter(id => !filtered.map(t => t.userId).includes(id)));
    } else {
      const ids = filtered.map(t => t.userId);
      setSelected(prev => [...new Set([...prev, ...ids])]);
    }
  };

  const toggle = (userId) => {
    setSelected(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const handleSend = async () => {
    if (selected.length === 0) { toast.error("Select at least one recipient"); return; }
    if (type === "custom" && (!subject.trim() || !message.trim())) {
      toast.error("Subject and message are required"); return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/landlord/bulk-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selected, type, subject, message }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        onClose();
      } else {
        toast.error(await res.text() || "Failed to send");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Mail size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Bulk Email</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {selected.length > 0 ? `${selected.length} recipient${selected.length > 1 ? "s" : ""} selected` : "No recipients selected"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Step tabs */}
        <div className="flex gap-1 p-2 mx-6 mt-4 bg-slate-100 rounded-2xl shrink-0">
          <button
            onClick={() => setStep(1)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${step === 1 ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            1. Recipients
          </button>
          <button
            onClick={() => setStep(2)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${step === 2 ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            2. Compose
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 ? (
            <div className="space-y-4">
              {/* Status filter */}
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      statusFilter === f.value ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Select all */}
              <button
                onClick={toggleAll}
                className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
              >
                {allSelected ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} />}
                {allSelected ? "Deselect all" : `Select all ${filtered.length}`}
              </button>

              {/* Tenant list */}
              <div className="space-y-2">
                {filtered.map(t => {
                  const isSelected = selected.includes(t.userId);
                  return (
                    <label
                      key={t.id}
                      className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected ? "border-blue-500 bg-blue-50/30" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggle(t.userId)}
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{t.user?.name}</p>
                        <p className="text-xs text-slate-400 truncate">{t.user?.email}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                        t.user?.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                        t.user?.status === "AWAITING_PAYMENT" ? "bg-blue-100 text-blue-700" :
                        t.user?.status === "PAYMENT_MADE" ? "bg-emerald-100 text-emerald-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {t.user?.status?.replace("_", " ")}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Template picker */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Email Type</label>
                {TEMPLATES.map(t => (
                  <label
                    key={t.type}
                    className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      type === t.type ? "border-blue-500 bg-blue-50/30" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="emailType"
                      checked={type === t.type}
                      onChange={() => setType(t.type)}
                      className="mt-0.5 w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 shrink-0"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{t.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Custom fields */}
              {type === "custom" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder="e.g. Important notice regarding your tenancy"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Message</label>
                    <textarea
                      rows={6}
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Write your message here..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 shrink-0 flex gap-3">
          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              disabled={selected.length === 0}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next: Compose →
            </button>
          ) : (
            <>
              <button
                onClick={() => setStep(1)}
                className="px-5 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
              >
                ← Back
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/20"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Send to {selected.length} recipient{selected.length !== 1 ? "s" : ""}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
