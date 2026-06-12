"use client";

import { useState, useEffect } from "react";
import { 
  CreditCard, ShieldCheck, AlertCircle, FileText, 
  CheckCircle2, X, Calendar, Lock, HelpCircle 
} from "lucide-react";
import PaymentFormWrapper from "@/components/PaymentFormWrapper";

const freqLabel = (frequency) => {
  const map = {
    ONCE: "once",
    DAILY: "day",
    MONTHLY: "mo",
    QUARTERLY: "qtr",
    YEARLY: "yr",
    PER_SEMESTER: "sem",
  };
  return map[frequency] || "once";
};

export default function PaymentBreakdownPanel({
  room,
  baseRentAmount,
  billingRules,
  unpaidCharges,
  totalDue,
  isPartialMode,
  installmentAmount,
  profile,
  session,
  paymentHistory,
  rentFrequencyShorthand = "yr",
  allRecurringCharges = [],
}) {
  // We keep track of checked state for each billing item.
  // By default, base rent, caution fees, and overdue charges are mandatory (checked and disabled).
  // Standard unpaid recurring charges are toggleable.
  const [selectedItems, setSelectedItems] = useState(() => {
    const initialState = {
      rent: true, // Base rent is mandatory
    };

    // Global / one-time fees are mandatory
    billingRules.forEach(rule => {
      initialState[`rule_${rule.id}`] = true;
    });

    // Unpaid/overdue recurring charges
    unpaidCharges.forEach(charge => {
      // All due bills should be automatically clicked (checked) by default
      initialState[`charge_${charge.id}`] = true;
    });

    return initialState;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use the ticked BASE_RENT rule's amount if provided, otherwise fall back to room.rentAmount
  const rentAmount = baseRentAmount ?? room.rentAmount;

  // Dynamically calculate the active total selected
  let activeTotal = selectedItems["rent"] ? rentAmount : 0;
  
  billingRules.forEach(rule => {
    if (selectedItems[`rule_${rule.id}`]) {
      activeTotal += rule.amount;
    }
  });

  unpaidCharges.forEach(charge => {
    if (selectedItems[`charge_${charge.id}`]) {
      activeTotal += charge.amount;
    }
  });

  // Calculate mathematically correct split amounts (utilities are never divided into installments)
  const rentAndFeesTotal = (selectedItems["rent"] ? rentAmount : 0) + 
    billingRules.reduce((sum, rule) => sum + (selectedItems[`rule_${rule.id}`] ? rule.amount : 0), 0);

  const rentAndFeesInstallment = isPartialMode 
    ? rentAndFeesTotal / profile.partialPaymentInstallments 
    : rentAndFeesTotal;

  const utilityTotal = unpaidCharges.reduce((sum, charge) => sum + (selectedItems[`charge_${charge.id}`] ? charge.amount : 0), 0);

  const totalToPayNow = rentAndFeesInstallment + utilityTotal;

  // Selected recurring charge IDs
  const selectedRecurringChargeIds = unpaidCharges
    .filter(charge => selectedItems[`charge_${charge.id}`])
    .map(charge => charge.id);

  // Compute the detailed breakdown array to be stored in the database
  const nextInstallmentNumber = (paymentHistory?.filter(
    p => p.paymentType !== "RECURRING" && p.status !== "REJECTED"
  ).length || 0) + 1;

  const breakdown = [];
  if (selectedItems["rent"]) {
    breakdown.push({
      name: `Base Room Rent${isPartialMode ? ` (Installment ${nextInstallmentNumber}/${profile.partialPaymentInstallments})` : ""}`,
      amount: isPartialMode ? rentAmount / profile.partialPaymentInstallments : rentAmount
    });
  }
  billingRules.forEach(rule => {
    if (selectedItems[`rule_${rule.id}`]) {
      breakdown.push({
        name: `${rule.title || rule.description}${isPartialMode ? ` (Installment ${nextInstallmentNumber}/${profile.partialPaymentInstallments})` : ""}`,
        amount: isPartialMode ? rule.amount / profile.partialPaymentInstallments : rule.amount
      });
    }
  });
  unpaidCharges.forEach(charge => {
    if (selectedItems[`charge_${charge.id}`]) {
      breakdown.push({
        name: `${charge.billingRule?.title || charge.billingRule?.description || "Utility Charge"}`,
        amount: charge.amount
      });
    }
  });

  // Sync modal body scroll locking
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  const toggleItem = (key, isMandatory) => {
    if (isMandatory) return; // Cannot toggle mandatory items
    setSelectedItems(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-8">
      {/* ── Dynamic Billing Breakdown Checklist ── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck size={20} className="text-blue-600" />
            Billing Checklist
          </h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Select items to pay
          </span>
        </div>

        <div className="p-6 sm:p-8 space-y-4">
          <p className="text-xs text-slate-500 font-medium mb-2">
            Check the items you want to settle in this transaction. Mandatory items required to maintain or renew your tenancy are pre-selected and locked.
          </p>

          {/* 1. Base Room Rent (Always Mandatory) */}
          <div 
            onClick={() => toggleItem("rent", true)}
            className="flex items-center justify-between p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all select-none cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center">
                <input 
                  type="checkbox"
                  checked={selectedItems["rent"]}
                  readOnly
                  disabled
                  className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-not-allowed"
                />
                <Lock size={10} className="absolute text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  Base Room Rent
                  <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                    Mandatory
                  </span>
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-slate-400">Room {room.roomNumber}</p>
                  {profile.rentExpiryDate && (
                    <p className="text-xs text-slate-400">· Due: {new Date(profile.rentExpiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                  )}
                </div>
              </div>
            </div>
            <span className="text-sm sm:text-base font-black text-slate-900">
              ₦{rentAmount.toLocaleString()}/{rentFrequencyShorthand}
            </span>
          </div>

          {/* 2. Billing Fees — mandatory (locked) only if within reminder window or overdue, otherwise toggleable */}
          {billingRules.map(rule => {
            const matchingCharge = allRecurringCharges
              .filter(c => c.billingRuleId === rule.id && (c.status === "UNPAID" || c.status === "OVERDUE"))
              .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
            const dueDateStr = matchingCharge
              ? new Date(matchingCharge.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
              : null;

            // Apply same lock-window logic as recurring charges
            const freq = rule.frequency;
            const lockWindowDays = (freq === "YEARLY" || freq === "PER_SEMESTER") ? 30 : 7;
            const daysUntilDue = matchingCharge
              ? Math.ceil((new Date(matchingCharge.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : null;
            // If no charge record found (e.g. pure ONCE fee), treat as mandatory
            const isMandatory = daysUntilDue === null
              ? rule.frequency === "ONCE"
              : (matchingCharge?.status === "OVERDUE" || daysUntilDue <= lockWindowDays);

            const key = `rule_${rule.id}`;
            const isChecked = selectedItems[key];

            return (
            <div 
              key={rule.id}
              onClick={() => toggleItem(key, isMandatory)}
              className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all select-none ${
                isMandatory
                  ? "bg-slate-50 border-slate-100 cursor-not-allowed"
                  : isChecked
                    ? "bg-blue-50/20 border-blue-200 cursor-pointer hover:border-blue-300"
                    : "bg-white border-slate-100 cursor-pointer hover:border-slate-200"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center">
                  <input 
                    type="checkbox"
                    checked={isChecked}
                    readOnly
                    disabled={isMandatory}
                    className={`w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500/20 ${isMandatory ? "cursor-not-allowed" : "cursor-pointer"}`}
                  />
                  {isMandatory && <Lock size={10} className="absolute text-slate-400" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {rule.title || rule.description}
                    {isMandatory ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                        Mandatory Fee
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full border border-slate-200">
                        Optional
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-slate-400">Category: {rule.type ? rule.type.replace(/_/g, " ").toUpperCase() : "ONE-TIME FEE"}</p>
                    {dueDateStr && <p className="text-xs text-slate-400">· Due: {dueDateStr}</p>}
                  </div>
                </div>
              </div>
              <span className="text-sm sm:text-base font-black text-slate-900">
                ₦{rule.amount.toLocaleString()}/{freqLabel(rule.frequency)}
              </span>
            </div>
          )})}

          {/* 3. Unpaid / Overdue Recurring Charges (Toggleable if Unpaid, locked if Overdue or within reminder window) */}
          {unpaidCharges.map(charge => {
            const freq = charge.billingRule?.frequency;
            const lockWindowDays = (freq === "YEARLY" || freq === "PER_SEMESTER") ? 30 : 7;
            const daysUntilDue = Math.ceil((new Date(charge.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            
            // Lock if overdue or if it has entered the automated reminder window
            const isMandatory = charge.status === "OVERDUE" || daysUntilDue <= lockWindowDays; 
            
            const key = `charge_${charge.id}`;
            const isChecked = selectedItems[key];

            return (
              <div 
                key={charge.id}
                onClick={() => toggleItem(key, isMandatory)}
                className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all select-none cursor-pointer ${
                  isChecked 
                    ? "bg-blue-50/20 border-blue-200" 
                    : "bg-white border-slate-100 hover:border-slate-200"
                } ${isMandatory ? "cursor-not-allowed opacity-95 bg-slate-50" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      disabled={isMandatory}
                      className={`w-5 h-5 rounded-lg focus:ring-blue-500/20 cursor-pointer ${
                        isMandatory 
                          ? "border-slate-300 text-blue-600 cursor-not-allowed" 
                          : "border-slate-300 text-blue-600"
                      }`}
                    />
                    {isMandatory && <Lock size={10} className="absolute text-slate-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      {charge.billingRule?.title || charge.billingRule?.description || "Utility Charge"}
                      {charge.status === "OVERDUE" ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-red-50 text-red-600 rounded-full border border-red-100">
                          Overdue Mandatory
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                          Due & Locked
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Type: {charge.billingRule?.type ? charge.billingRule.type.replace(/_/g, " ").toUpperCase() : "UTILITY"} • Due: {new Date(charge.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <span className="text-sm sm:text-base font-black text-slate-900">
                  ₦{charge.amount.toLocaleString()}/{freqLabel(charge.billingRule?.frequency)}
                </span>
              </div>
            );
          })}

          {/* Dynamic Installment Notice if Partial Mode & selected items */}
          {isPartialMode && rentAndFeesTotal > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between bg-blue-50 border border-blue-100 rounded-2xl p-5 gap-4">
              <div>
                <p className="text-xs font-bold text-blue-800 uppercase tracking-wide flex items-center gap-2">
                  <Calendar size={14} /> Tenancy Installment Active
                </p>
                <p className="text-xs text-blue-600 mt-0.5">
                  Your base rent and global check-in fees are split into {profile.partialPaymentInstallments} installments.
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tenancy Installment</p>
                <p className="text-xl font-black text-blue-700 mt-0.5">
                  ₦{rentAndFeesInstallment.toLocaleString()} <span className="text-xs text-blue-500 font-normal">each</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Billing Footer & Proceed Action */}
        <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {isPartialMode ? "Total to Pay Now" : "Total Selected to Pay"}
            </p>
            <p className="text-3xl font-black text-slate-900 tracking-tight mt-1">
              ₦{totalToPayNow.toLocaleString()}
            </p>
            {isPartialMode && (
              <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">
                (₦{rentAndFeesInstallment.toLocaleString()} installment + ₦{utilityTotal.toLocaleString()} utilities in full)
              </p>
            )}
          </div>
          <button 
            type="button"
            disabled={activeTotal === 0}
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl shadow-xl shadow-blue-500/20 active:translate-y-px transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            <CreditCard size={18} /> Make Payment
          </button>
        </div>
      </div>

      {/* ── Slide-Out Secure Checkout Drawer ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end animate-in fade-in duration-300">
          {/* Backdrop Blur Overlay */}
          <div 
            onClick={() => setIsModalOpen(false)} 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-all"
          />

          {/* Sliding Drawer Container */}
          <div className="relative w-full max-w-md h-full bg-slate-50 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-500">
            
            {/* Drawer Header */}
            <div className="bg-white p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                  <Lock size={18} className="text-green-600" />
                  Secure Checkout
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">128-bit Encrypted Transaction</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-950 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Checkout Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Payment Itemized Summary Box */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Checkout Summary
                </h4>
                <div className="divide-y divide-slate-100 text-xs">
                  {selectedItems["rent"] && (
                    <div className="flex justify-between py-2 font-medium text-slate-700">
                      <div>
                        <span>Room Rent ({room.roomNumber})</span>
                        {isPartialMode && (
                          <span className="ml-1.5 text-[9px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">
                            Installment {nextInstallmentNumber}/{profile.partialPaymentInstallments}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-slate-900">
                        ₦{(isPartialMode ? rentAmount / profile.partialPaymentInstallments : rentAmount).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {billingRules.map(rule => {
                    if (!selectedItems[`rule_${rule.id}`]) return null;
                    const displayAmount = isPartialMode ? rule.amount / profile.partialPaymentInstallments : rule.amount;
                    return (
                      <div key={rule.id} className="flex justify-between py-2 font-medium text-slate-700">
                        <div>
                          <span>{rule.title || rule.description}</span>
                          {isPartialMode && (
                            <span className="ml-1.5 text-[9px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">
                              Installment {nextInstallmentNumber}/{profile.partialPaymentInstallments}
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-slate-900">₦{displayAmount.toLocaleString()}</span>
                      </div>
                    );
                  })}
                  {unpaidCharges.map(charge => {
                    if (!selectedItems[`charge_${charge.id}`]) return null;
                    return (
                      <div key={charge.id} className="flex justify-between py-2 font-medium text-slate-700">
                        <div>
                          <span>{charge.billingRule?.title || charge.billingRule?.description || "Utility"}</span>
                          <span className="ml-1.5 text-[9px] font-bold text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded-full border border-purple-100">
                            Full amount due
                          </span>
                        </div>
                        <span className="font-bold text-slate-900">₦{charge.amount.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-950">
                    {isPartialMode ? "Total to Pay Now" : "Total Due"}
                  </span>
                  <span className="font-black text-slate-950">₦{totalToPayNow.toLocaleString()}</span>
                </div>
              </div>

              {/* The PaymentFormWrapper inside Modal Body */}
              <PaymentFormWrapper
                totalDue={totalToPayNow}
                canPayPartial={profile.allowPartialPayment}
                partialPaymentInstallments={profile.partialPaymentInstallments}
                tenantEmail={session.user.email}
                tenantId={profile.id}
                rentStartDate={profile.rentStartDate}
                existingPayments={paymentHistory}
                recurringChargeIds={selectedRecurringChargeIds}
                isRentSelected={!!selectedItems["rent"]}
                rentFrequencyShorthand={rentFrequencyShorthand}
                breakdown={breakdown}
              />
            </div>

            {/* Safe Seal Badge */}
            <div className="bg-white p-4 border-t border-slate-200 text-center shrink-0 flex items-center justify-center gap-2">
              <ShieldCheck size={14} className="text-green-600" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Protected by Paystack Secure Gateway
              </span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
