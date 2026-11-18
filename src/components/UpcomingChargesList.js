"use client";

import { useState } from "react";
import { Clock, CreditCard, X, ChevronRight, CheckCircle2 } from "lucide-react";
import PaymentFormWrapper from "@/components/PaymentFormWrapper";

export default function UpcomingChargesList({
  upcomingCharges = [],
  session,
  profile,
  isSharer = false,
  primaryName = "",
}) {
  const [activeCharge, setActiveCharge] = useState(null);

  if (!upcomingCharges || upcomingCharges.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-blue-50/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Clock size={18} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Upcoming Payments</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Scheduled charges — pay now or settle when due
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-blue-700 bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200">
          {upcomingCharges.length} scheduled
        </span>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100">
        {upcomingCharges.map((charge) => {
          const isPending = charge.status === "PENDING";
          const dueDateStr = new Date(charge.dueDate).toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          });

          return (
            <div
              key={charge.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:px-6 gap-3 hover:bg-slate-50/50 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800">
                    {charge.billingRule?.title || charge.billingRule?.description || "Recurring Charge"}
                  </p>
                  {isPending && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      Payment Under Review
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Due: {dueDateStr}</span>
                  <span>·</span>
                  <span className="capitalize">{charge.billingRule?.frequency?.toLowerCase().replace(/_/g, " ") || "scheduled"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                <span className="text-sm font-bold text-slate-900">
                  ₦{charge.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>

                {!isPending && (
                  <button
                    onClick={() => setActiveCharge(charge)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95"
                  >
                    <span>Pay Early</span>
                    <ChevronRight size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Early Payment Modal */}
      {activeCharge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Pay Upcoming Charge Early</h3>
                  <p className="text-xs text-slate-500">
                    {activeCharge.billingRule?.title || activeCharge.billingRule?.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveCharge(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 text-xs text-blue-900 space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Charge:</span>
                  <span>{activeCharge.billingRule?.title || activeCharge.billingRule?.description}</span>
                </div>
                <div className="flex justify-between">
                  <span>Scheduled Due Date:</span>
                  <span>{new Date(activeCharge.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-blue-200/60 text-slate-900">
                  <span>Amount to Settle:</span>
                  <span>₦{activeCharge.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Payment Form Wrapper */}
              <PaymentFormWrapper
                totalDue={activeCharge.amount}
                canPayPartial={false}
                tenantEmail={session?.user?.email}
                tenantId={profile?.id}
                isRecurringOnly={true}
                charge={activeCharge}
                isSharer={isSharer}
                primaryName={primaryName}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
