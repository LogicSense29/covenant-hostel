"use client";

import { useState } from "react";
import { Layers, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function PartialPaymentToggle({ tenantProfileId, allowPartialPayment, partialPaymentInstallments, totalDue }) {
  const [enabled, setEnabled] = useState(allowPartialPayment);
  const [installments, setInstallments] = useState(partialPaymentInstallments || 3);
  const [loading, setLoading] = useState(false);
  // Track saved state so the UI reflects the last saved values without a page reload
  const [savedEnabled, setSavedEnabled] = useState(allowPartialPayment);
  const [savedInstallments, setSavedInstallments] = useState(partialPaymentInstallments || 3);

  const installmentAmount = totalDue ? (totalDue / installments) : null;

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tenants/${tenantProfileId}/partial-payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowPartialPayment: enabled,
          partialPaymentInstallments: enabled ? installments : null,
        }),
      });

      if (res.ok) {
        setSavedEnabled(enabled);
        setSavedInstallments(installments);
        toast.success(enabled ? `Partial payment enabled (${installments} installments)` : "Partial payment disabled");
      } else {
        const err = await res.text();
        toast.error(err || "Failed to update");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-blue-600" />
          <span className="text-sm font-bold text-slate-900">Partial Payment Plan</span>
        </div>
        {/* Toggle switch */}
        <button
          type="button"
          onClick={() => setEnabled(!enabled)}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${enabled ? "bg-blue-600" : "bg-slate-300"}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${enabled ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>

      {enabled && (
        <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
              Number of installments
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setInstallments(n)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    installments === n
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                  }`}
                >
                  {n}x
                </button>
              ))}
            </div>
          </div>

          {installmentAmount && (
            <div className="bg-blue-50 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-medium text-blue-700">Min. per installment</span>
              <span className="text-sm font-black text-blue-700">₦{installmentAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          )}

          <p className="text-xs text-slate-400 leading-relaxed">
            Reminders will be sent to the tenant and admin before each installment due date.
          </p>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full py-3 bg-[#102a43] text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><CheckCircle2 size={14} /> Save Payment Settings</>}
      </button>
    </div>
  );
}
