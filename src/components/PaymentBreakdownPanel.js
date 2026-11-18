"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  CreditCard, ShieldCheck, AlertCircle, FileText, 
  CheckCircle2, X, Calendar, Lock, HelpCircle, Sparkles, ChevronRight, Clock, ArrowRight 
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
  rentRemaining = null,
  alreadyPaidRent = 0,
  billingRules = [],
  unpaidCharges = [],
  upcomingCharges = [],
  totalDue,
  isPartialMode,
  installmentAmount,
  profile,
  session,
  paymentHistory = [],
  rentFrequencyShorthand = "yr",
  allRecurringCharges = [],
  isSharer = false,
  primaryName = "",
  canChoosePartial = false,
  defaultInstallments = 1,
  hasActiveInstallmentPlan = false,
  earlyInstallmentCharge = null,
  isRentPaid = false,
  effectiveExpiryDate = null,
  hasPendingRentPayment = false,
}) {
  const [localIsPartialMode, setLocalIsPartialMode] = useState(isPartialMode || canChoosePartial);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // When tenant switches between "Pay Full" and "Pay Installment":
  // - Full mode → rent must be checked (row is visible and locked)
  // - Installment mode with active plan → rent must be unchecked (row is hidden, tenant picks charges individually)
  useEffect(() => {
    if (!isRentPaid) {
      const inInstallmentMode = localIsPartialMode && hasActiveInstallmentPlan;
      setSelectedItems(prev => ({ ...prev, rent: !inInstallmentMode }));
    }
  }, [localIsPartialMode, hasActiveInstallmentPlan, isRentPaid]);

  // Projected new expiry date when paying advance rent
  const projectedExpiryDate = useMemo(() => {
    if (!effectiveExpiryDate) return null;
    const d = new Date(effectiveExpiryDate);
    switch (rentFrequencyShorthand) {
      case "yr":
        d.setFullYear(d.getFullYear() + 1);
        break;
      case "sem":
        d.setMonth(d.getMonth() + 6);
        break;
      case "qtr":
        d.setMonth(d.getMonth() + 3);
        break;
      case "mo":
        d.setMonth(d.getMonth() + 1);
        break;
      case "day":
        d.setDate(d.getDate() + 1);
        break;
      default:
        d.setFullYear(d.getFullYear() + 1);
    }
    return d;
  }, [effectiveExpiryDate, rentFrequencyShorthand]);

  // Rent amount fallback
  const fullRentAmount = baseRentAmount ?? room.rentAmount;

  // ── Outstanding rent balance (source of truth) ──────────────────────────────
  // Always derive from actual verified payments, never from DB installment charge records.
  // alreadyPaidRent = sum of all VERIFIED/SUCCESS rent payments for this cycle (from page.js).
  // rentRemaining = fullRentAmount - alreadyPaidRent (guaranteed by page.js).
  const outstandingRentBalance = (() => {
    if (isRentPaid) return fullRentAmount; // advance renewal — charge next full cycle
    if (rentRemaining !== null && rentRemaining >= 0) return rentRemaining;
    // Fallback: compute directly from already-paid amount
    return alreadyPaidRent > 0 ? Math.max(0, fullRentAmount - alreadyPaidRent) : fullRentAmount;
  })();

  // Tenant has a partial balance when they have paid SOMETHING but not everything.
  const hasPartialBalance = !isRentPaid && (
    (alreadyPaidRent > 0 && outstandingRentBalance < fullRentAmount) ||
    (hasActiveInstallmentPlan && outstandingRentBalance > 0)
  );

  // The rent figure used in ALL calculations and display:
  // - Full-pay mode: outstandingRentBalance (remaining amount owed)
  // - Installment mode: outstandingRentBalance / activeInstallments  (computed below)
  // - Advance renewal: fullRentAmount
  const rentAmount = outstandingRentBalance;

  // Format upcoming charges to show readable titles for system installments.
  // If tenant is paying remaining balance in full, exclude system installments so they aren't duplicated.
  const formattedUpcomingCharges = useMemo(() => {
    const allInstCharges = allRecurringCharges
      .filter(c => c.billingRuleId === "__system_rent_installment__")
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    const totalInstCount = allInstCharges.length + 1;
    const shouldExcludeInstallments = !localIsPartialMode && hasPartialBalance;

    return (upcomingCharges || [])
      .filter(charge => {
        if (shouldExcludeInstallments && charge.billingRuleId === "__system_rent_installment__") {
          return false;
        }
        return true;
      })
      .map(charge => {
        if (charge.billingRuleId === "__system_rent_installment__") {
          const instIndex = allInstCharges.findIndex(c => c.id === charge.id) + 2;
          return {
            ...charge,
            billingRule: {
              ...charge.billingRule,
              title: `Rent Installment ${instIndex} of ${totalInstCount}`,
              description: `Rent Installment ${instIndex} of ${totalInstCount}`,
            },
          };
        }
        return charge;
      });
  }, [upcomingCharges, allRecurringCharges, localIsPartialMode, hasPartialBalance]);

  // When paying remaining rent in full, also exclude system installments from unpaid charges list to prevent duplicate display
  const effectiveUnpaidCharges = useMemo(() => {
    const shouldExcludeInstallments = !localIsPartialMode && hasPartialBalance;
    return (unpaidCharges || []).filter(charge => {
      if (shouldExcludeInstallments && charge.billingRuleId === "__system_rent_installment__") {
        return false;
      }
      return true;
    });
  }, [unpaidCharges, localIsPartialMode, hasPartialBalance]);

  // Track checked state for each billing item.
  // - If rent is NOT paid (due/expiring): rent, mandatory rules, and due charges start CHECKED.
  // - If rent is ALREADY paid: advance rent, fees, and upcoming charges start UNCHECKED (Total = 0, zero panic).
  const [selectedItems, setSelectedItems] = useState(() => {
    const initialState = {};

    if (!isRentPaid) {
      // Start rent checked. When switching to installment mode, the rent row
      // is hidden and rent gets unchecked via the useEffect below.
      initialState.rent = true;
      billingRules.forEach(rule => {
        initialState[`rule_${rule.id}`] = true;
      });
    } else {
      initialState.rent = false;
      billingRules.forEach(rule => {
        initialState[`rule_${rule.id}`] = false;
      });
    }

    // Charges that are currently due/overdue
    unpaidCharges.forEach(charge => {
      initialState[`charge_${charge.id}`] = true;
    });

    // Upcoming future charges are optional and start unchecked
    (upcomingCharges || []).forEach(charge => {
      initialState[`charge_${charge.id}`] = false;
    });

    return initialState;
  });

  // Dynamically calculate the active total selected
  let activeTotal = selectedItems["rent"] ? rentAmount : 0;

  billingRules.forEach(rule => {
    if (selectedItems[`rule_${rule.id}`]) {
      activeTotal += rule.amount;
    }
  });

  effectiveUnpaidCharges.forEach(charge => {
    if (selectedItems[`charge_${charge.id}`]) {
      activeTotal += charge.amount;
    }
  });

  formattedUpcomingCharges.forEach(charge => {
    if (selectedItems[`charge_${charge.id}`]) {
      activeTotal += charge.amount;
    }
  });

  // Calculate split amounts
  // IMPORTANT: Only RENT is divided into installments. Fees (caution, utilities, etc.) are always paid in full.
  const activeInstallments = localIsPartialMode ? (defaultInstallments || profile.partialPaymentInstallments || 2) : 1;

  // Rent for this checkout slot:
  // - Full-pay mode  → outstandingRentBalance (= rentAmount, already set above)
  // - Installment mode → one slot = outstandingRentBalance / activeInstallments
  //   (prefer earlyInstallmentCharge.amount from DB when available so locked amounts match)
  const rentForThisSlot = localIsPartialMode
    ? (earlyInstallmentCharge?.amount
        ?? installmentAmount
        ?? Math.round((rentAmount / activeInstallments) * 100) / 100)
    : rentAmount;

  // Fees are NEVER divided - always pay full amount
  const selectedFeesTotal = billingRules.reduce(
    (sum, rule) => sum + (selectedItems[`rule_${rule.id}`] ? rule.amount : 0), 0
  );
  const feesForThisSlot = selectedFeesTotal;

  // rentInstallmentOnly: the rent portion of this payment slot
  const rentInstallmentOnly = selectedItems["rent"] ? rentForThisSlot : 0;
  const rentAndFeesInstallment = rentInstallmentOnly + feesForThisSlot;

  // Split upcoming charges into installment charges vs true utilities
  // so the sub-label shows the right description
  const selectedUpcomingInstallmentTotal = formattedUpcomingCharges.reduce((sum, c) => {
    if (!selectedItems[`charge_${c.id}`]) return sum;
    if (c.billingRuleId === "__system_rent_installment__") return sum + c.amount;
    return sum;
  }, 0);
  const selectedUpcomingInstallmentCount = formattedUpcomingCharges.filter(
    c => selectedItems[`charge_${c.id}`] && c.billingRuleId === "__system_rent_installment__"
  ).length;

  const currentUtilityTotal = effectiveUnpaidCharges.reduce((sum, charge) => sum + (selectedItems[`charge_${charge.id}`] ? charge.amount : 0), 0);
  const upcomingUtilityTotal = formattedUpcomingCharges.reduce((sum, charge) => sum + (selectedItems[`charge_${charge.id}`] ? charge.amount : 0), 0);
  const utilityTotal = currentUtilityTotal + upcomingUtilityTotal;

  const totalToPayNow = rentAndFeesInstallment + utilityTotal;

  // Selected recurring charge IDs (due and upcoming)
  const allChargesList = [...effectiveUnpaidCharges, ...formattedUpcomingCharges];
  const selectedRecurringChargeIds = allChargesList
    .filter(charge => selectedItems[`charge_${charge.id}`])
    .map(charge => charge.id);

  // All remaining system installment charges to bundle when paying in full
  const allRemainingInstallmentIds = allRecurringCharges
    .filter(c => c.billingRuleId === "__system_rent_installment__" && (c.status === "UNPAID" || c.status === "OVERDUE"))
    .map(c => c.id);

  // IDs of selected billing rules (one-time/setup fees) to include in checkout
  const checkoutBillingRuleIds = billingRules
    .filter(rule => selectedItems[`rule_${rule.id}`])
    .map(rule => rule.id);

  const checkoutRecurringChargeIds = (!localIsPartialMode && selectedItems["rent"] && hasPartialBalance)
    ? Array.from(new Set([...selectedRecurringChargeIds, ...allRemainingInstallmentIds]))
    : selectedRecurringChargeIds;

  // Count paid installments scoped to the current cycle only.
  // rentStartDate resets on every room change — payments before it belong to the old room.
  const cycleStart = profile?.rentStartDate ? new Date(profile.rentStartDate) : null;
  const paidInstallmentCount = (paymentHistory || []).filter(
    (p) => (p.installmentNumber != null || p.isPartial) &&
      (p.status === "VERIFIED" || p.status === "SUCCESS") &&
      (!cycleStart || new Date(p.createdAt) >= cycleStart)
  ).length;
  const nextInstallmentNumber = Math.min(activeInstallments, paidInstallmentCount + 1);

  // Build the breakdown array — amounts MUST exactly match totalToPayNow to avoid
  // any discrepancy between what the tenant sees and what the gateway charges.
  const breakdown = [];
  if (selectedItems["rent"]) {
    const rentLabel = isRentPaid
      ? "Base Room Rent (Advance Renewal)"
      : localIsPartialMode
        ? `Base Room Rent (Installment ${nextInstallmentNumber}/${activeInstallments})`
        : hasPartialBalance
          ? `Remaining Rent Balance`
          : "Base Room Rent";
    breakdown.push({ name: rentLabel, amount: rentForThisSlot });
  }
  billingRules.forEach(rule => {
    if (selectedItems[`rule_${rule.id}`]) {
      const amt = localIsPartialMode
        ? Math.round((rule.amount / activeInstallments) * 100) / 100
        : rule.amount;
      breakdown.push({
        name: `${rule.title || rule.description}${localIsPartialMode ? ` (Installment ${nextInstallmentNumber}/${activeInstallments})` : ""}`,
        amount: amt
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
  formattedUpcomingCharges.forEach(charge => {
    if (selectedItems[`charge_${charge.id}`]) {
      breakdown.push({
        name: `${charge.billingRule?.title || charge.billingRule?.description || "Upcoming Charge"} (Advance)`,
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
    if (isMandatory) return; // Cannot toggle locked mandatory items
    setSelectedItems(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-8" id="rent-payment-panel">

      {/* ── Dynamic Billing Breakdown Checklist ── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-2xl">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isRentPaid ? "Payment Checklist & Advance Settle" : "Billing Checklist"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRentPaid 
                  ? "Select any future rent cycle or upcoming bills you wish to settle in advance." 
                  : "Review and select charges to settle."}
              </p>
            </div>
          </div>
          {!isRentPaid && !hasActiveInstallmentPlan && (
            <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto border bg-amber-50 text-amber-700 border-amber-200">
              Payment Due
            </span>
          )}
        </div>

        <div className="p-6 sm:p-8 space-y-6">

          {/* Reassuring advance info banner if current rent is up-to-date */}
          {isRentPaid && (
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50/40 to-white border border-blue-200/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  Advance Prepayment Option
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your current stay is settled up to <strong className="text-slate-900">{effectiveExpiryDate ? new Date(effectiveExpiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "the scheduled date"}</strong>.
                  {projectedExpiryDate && (
                    <> Paying next cycle early will immediately extend your stay to <strong className="text-blue-700 underline decoration-blue-300">{projectedExpiryDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</strong>.</>
                  )} All items below start unselected — simply tick whatever you want to pay early.
                </p>
              </div>
            </div>
          )}

          {/* Partial payment selector if eligible */}
          {(canChoosePartial || hasPartialBalance) && (
            <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-blue-900">
                    {hasPartialBalance ? "Payment Options" : "Payment Plan Option"}
                  </h3>
                  <p className="text-xs text-blue-700 mt-1">
                    {localIsPartialMode
                      ? `Your rent is divided into scheduled installments. You can select your next installment below to settle it early anytime.`
                      : hasPartialBalance
                        ? `You have a remaining rent balance of ₦${rentRemaining.toLocaleString(undefined, { maximumFractionDigits: 2 })}. You can clear this balance in full or continue with your scheduled installments.`
                        : `As an eligible tenant, you can choose to pay rent in full or split it into ${activeInstallments} installments.`}
                  </p>
                </div>
                <div className="flex items-center bg-white rounded-xl border border-blue-200 p-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setLocalIsPartialMode(false)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                      !localIsPartialMode 
                        ? "bg-blue-600 text-white shadow-sm" 
                        : "text-slate-600 hover:text-blue-600"
                    }`}
                  >
                    {hasPartialBalance ? "Pay Remaining in Full" : "Pay Full"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalIsPartialMode(true)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                      localIsPartialMode 
                        ? "bg-blue-600 text-white shadow-sm" 
                        : "text-slate-600 hover:text-blue-600"
                    }`}
                  >
                    {hasPartialBalance ? "Pay Installment" : "Installments"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 1. Base Room Rent — hidden when tenant is in installment mode with an active plan */}
          {(!localIsPartialMode || !hasActiveInstallmentPlan) && (() => {
            const isRentDisabled = isSharer || hasPendingRentPayment;
            const isRentMandatory = !isRentPaid && !isRentDisabled;
            const isChecked = !!selectedItems["rent"];

            return (
              <div 
                onClick={() => {
                  if (isRentDisabled) return;
                  toggleItem("rent", isRentMandatory);
                }}
                className={`flex flex-wrap items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all select-none ${
                  isRentDisabled
                    ? "bg-slate-50 border-slate-100 cursor-not-allowed opacity-90"
                    : isRentMandatory
                      ? "bg-slate-50 border-slate-100 cursor-not-allowed"
                      : isChecked
                        ? "bg-blue-50/20 border-blue-200 cursor-pointer shadow-sm hover:border-blue-300"
                        : "bg-white border-slate-100 hover:border-slate-200 cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      disabled={isRentMandatory || isRentDisabled}
                      className={`w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500/20 ${
                        isRentMandatory || isRentDisabled ? "cursor-not-allowed" : "cursor-pointer"
                      }`}
                    />
                    {(isRentMandatory || isRentDisabled) && <Lock size={10} className="absolute text-slate-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      {isRentPaid
                        ? "Room Rent (Advance Renewal)"
                        : !localIsPartialMode && hasPartialBalance
                          ? "Remaining Rent Balance"
                          : localIsPartialMode
                            ? `Base Room Rent (Installment ${nextInstallmentNumber}/${activeInstallments})`
                            : "Room Rent"}
                      {hasPendingRentPayment ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                          Payment Under Review
                        </span>
                      ) : isRentPaid ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                          Advance Renewal
                        </span>
                      ) : hasPartialBalance ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-green-50 text-green-700 rounded-full border border-green-200">
                          ₦{(alreadyPaidRent > 0 ? alreadyPaidRent : (fullRentAmount - rentRemaining)).toLocaleString(undefined, { maximumFractionDigits: 2 })} already paid
                        </span>
                      ) : isRentMandatory ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                          Mandatory
                        </span>
                      ) : null}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-400">Room {room.roomNumber}</p>
                      {hasPendingRentPayment ? (
                        <p className="text-xs text-amber-600 font-medium">· Receipt submitted · Awaiting landlord review</p>
                      ) : effectiveExpiryDate ? (
                        <p className="text-xs text-slate-400">
                          · {isRentPaid 
                              ? `Current expiry: ${new Date(effectiveExpiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` 
                              : `Due: ${new Date(effectiveExpiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
                <span className="text-sm sm:text-base font-bold text-slate-900">
                  ₦{rentForThisSlot.toLocaleString(undefined, { maximumFractionDigits: 2 })}/{rentFrequencyShorthand}
                </span>
              </div>
            );
          })()}

          {/* 2. Room Rules / Additional Fees */}
          {billingRules.map(rule => {
            const isMandatory = !isRentPaid && !rule.isOptional;
            const key = `rule_${rule.id}`;
            const isChecked = !!selectedItems[key];

            return (
              <div 
                key={rule.id}
                onClick={() => toggleItem(key, isMandatory)}
                className={`flex flex-wrap items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all select-none ${
                  isMandatory
                    ? "bg-slate-50 border-slate-100 cursor-not-allowed"
                    : isChecked
                      ? "bg-blue-50/20 border-blue-200 cursor-pointer shadow-sm hover:border-blue-300"
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
                      className={`w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500/20 ${
                        isMandatory ? "cursor-not-allowed" : "cursor-pointer"
                      }`}
                    />
                    {isMandatory && <Lock size={10} className="absolute text-slate-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      {rule.title || rule.description}
                      {isMandatory && (
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                          Mandatory
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-400">Category: {rule.type ? rule.type.replace(/_/g, " ").toUpperCase() : "FEE"}</p>
                      <p className="text-xs text-slate-400">· Cycle: {freqLabel(rule.frequency)}</p>
                    </div>
                  </div>
                </div>
                <span className="text-sm sm:text-base font-bold text-slate-900">
                  ₦{rule.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}/{freqLabel(rule.frequency)}
                </span>
              </div>
            );
          })}

          {/* 3. Unpaid / Overdue Recurring Charges (Due Now) */}
          {effectiveUnpaidCharges.length > 0 && (
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Charges Due Now
                </h4>
                <span className="text-[10px] text-amber-600 font-bold">
                  {effectiveUnpaidCharges.length} outstanding
                </span>
              </div>

              {effectiveUnpaidCharges.map(charge => {
                const freq = charge.billingRule?.frequency;
                const lockWindowDays = (freq === "YEARLY" || freq === "PER_SEMESTER") ? 30 : 7;
                const daysUntilDue = Math.ceil((new Date(charge.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const isMandatory = charge.status === "OVERDUE" || daysUntilDue <= lockWindowDays; 
                
                const key = `charge_${charge.id}`;
                const isChecked = !!selectedItems[key];

                return (
                  <div 
                    key={charge.id}
                    onClick={() => toggleItem(key, isMandatory)}
                    className={`flex flex-wrap items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all select-none ${
                      isMandatory
                        ? "bg-slate-50 border-slate-100 cursor-not-allowed opacity-95"
                        : isChecked 
                          ? "bg-blue-50/20 border-blue-200 cursor-pointer shadow-sm hover:border-blue-300" 
                          : "bg-white border-slate-100 hover:border-slate-200 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          disabled={isMandatory}
                          className={`w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500/20 ${
                            isMandatory ? "cursor-not-allowed" : "cursor-pointer"
                          }`}
                        />
                        {isMandatory && <Lock size={10} className="absolute text-slate-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                          {charge.billingRule?.title || charge.billingRule?.description || "Utility Charge"}
                          {charge.status === "OVERDUE" ? (
                            <span className="text-[9px] font-bold px-2 py-0.5 bg-red-50 text-red-600 rounded-full border border-red-100">
                              Overdue
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                              Due Now
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Type: {charge.billingRule?.type ? charge.billingRule.type.replace(/_/g, " ").toUpperCase() : "UTILITY"} • Due: {new Date(charge.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm sm:text-base font-bold text-slate-900">
                      ₦{charge.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}/{freqLabel(charge.billingRule?.frequency)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 4. Upcoming / Future Recurring Charges (Optional Advance Payments) */}
          {formattedUpcomingCharges.length > 0 && (
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Upcoming Charges (Pay Ahead)
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  Optional · Settle future bills early
                </span>
              </div>

              {formattedUpcomingCharges.map(charge => {
                const isPending = charge.status === "PENDING";
                const key = `charge_${charge.id}`;
                const isChecked = !!selectedItems[key];
                const dueDateStr = new Date(charge.dueDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                });

                return (
                  <div
                    key={charge.id}
                    onClick={() => {
                      if (isPending) return;
                      toggleItem(key, false);
                    }}
                    className={`flex flex-wrap items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all select-none ${
                      isPending
                        ? "bg-slate-50 border-slate-100 cursor-not-allowed opacity-80"
                        : isChecked
                          ? "bg-blue-50/20 border-blue-200 cursor-pointer shadow-sm hover:border-blue-300"
                          : "bg-white border-slate-100 hover:border-slate-200 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          disabled={isPending}
                          className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer disabled:cursor-not-allowed"
                        />
                        {isPending && <Lock size={10} className="absolute text-slate-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                          {charge.billingRule?.title || charge.billingRule?.description || "Recurring Charge"}
                          {isPending ? (
                            <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                              Payment Under Review
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                              Advance Payment
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Scheduled due date: {dueDateStr}{charge.billingRuleId !== "__system_rent_installment__" && charge.billingRule?.frequency ? ` · ${freqLabel(charge.billingRule.frequency)}` : ""}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm sm:text-base font-bold text-slate-900">
                      ₦{charge.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Dynamic Installment Notice if Partial Mode & rent is selected */}
          {localIsPartialMode && selectedItems["rent"] && rentAndFeesInstallment > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between bg-blue-50 border border-blue-100 rounded-2xl p-5 gap-4">
              <div>
                <p className="text-xs font-bold text-blue-800 uppercase tracking-wide flex items-center gap-2">
                  <Calendar size={14} /> Tenancy Installment Active
                </p>
                <p className="text-xs text-blue-600 mt-0.5">
                  Your base rent and global check-in fees are split into {activeInstallments} installments.
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tenancy Installment</p>
                <p className="text-xl font-black text-blue-700 mt-0.5">
                  ₦{rentAndFeesInstallment.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-xs text-blue-500 font-normal">each</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Billing Footer & Action */}
        <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {activeTotal === 0 ? "No Items Selected" : (localIsPartialMode ? "Total to Pay Now" : "Total Selected to Pay")}
            </p>
            <p className="text-3xl font-black text-slate-900 tracking-tight mt-1">
              ₦{totalToPayNow.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            {activeTotal === 0 ? (
              <p className="text-[10px] text-slate-400 mt-0.5">
                Check any item above to include it in this payment
              </p>
            ) : localIsPartialMode ? (
              <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">
                {selectedUpcomingInstallmentCount > 0 && utilityTotal - selectedUpcomingInstallmentTotal > 0
                  ? `(${selectedUpcomingInstallmentCount} installment${selectedUpcomingInstallmentCount > 1 ? "s" : ""} + ₦${(utilityTotal - selectedUpcomingInstallmentTotal).toLocaleString(undefined, { maximumFractionDigits: 2 })} charges)`
                  : selectedUpcomingInstallmentCount > 0
                    ? `${selectedUpcomingInstallmentCount} rent installment${selectedUpcomingInstallmentCount > 1 ? "s" : ""} selected`
                    : rentAndFeesInstallment > 0 && utilityTotal > 0
                      ? `(₦${rentAndFeesInstallment.toLocaleString(undefined, { maximumFractionDigits: 2 })} rent + ₦${utilityTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })} charges)`
                      : rentAndFeesInstallment > 0
                        ? `Rent installment payment`
                        : null}
              </p>
            ) : (
              <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">
                {breakdown.length} item{breakdown.length > 1 ? "s" : ""} selected for checkout
              </p>
            )}
          </div>

          {isSharer ? (
            <div className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 text-slate-500 text-sm font-bold rounded-2xl border border-slate-200">
              <Lock size={18} />
              Managed by {primaryName}
            </div>
          ) : (
            <button 
              type="button"
              disabled={activeTotal === 0}
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl shadow-xl shadow-blue-500/20 active:translate-y-px transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              <CreditCard size={18} />
              <span>
                {activeTotal === 0 ? "Select Items to Pay" : `Make Payment (₦${totalToPayNow.toLocaleString(undefined, { maximumFractionDigits: 2 })})`}
              </span>
            </button>
          )}
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
                        {isRentPaid ? (
                          <span className="ml-1.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                            Advance Renewal
                          </span>
                        ) : localIsPartialMode ? (
                          <span className="ml-1.5 text-[9px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">
                            Installment {nextInstallmentNumber}/{activeInstallments}
                          </span>
                        ) : hasPartialBalance ? (
                          <span className="ml-1.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                            Remaining Balance
                          </span>
                        ) : null}
                      </div>
                      <span className="font-bold text-slate-900">
                        ₦{rentForThisSlot.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  {billingRules.map(rule => {
                    if (!selectedItems[`rule_${rule.id}`]) return null;
                    // Fees (caution, security deposit, etc.) are ALWAYS paid in full — never split into installments
                    const displayAmount = rule.amount;
                    return (
                      <div key={rule.id} className="flex justify-between py-2 font-medium text-slate-700">
                        <div>
                          <span>{rule.title || rule.description}</span>
                          {localIsPartialMode && (
                            <span className="ml-1.5 text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full border border-slate-200">
                              Full amount
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-slate-900">₦{displayAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>
                    );
                  })}

                  {effectiveUnpaidCharges.map(charge => {
                    if (!selectedItems[`charge_${charge.id}`]) return null;
                    return (
                      <div key={charge.id} className="flex justify-between py-2 font-medium text-slate-700">
                        <div>
                          <span>{charge.billingRule?.title || charge.billingRule?.description || "Utility"}</span>
                          <span className="ml-1.5 text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100">
                            Due Now
                          </span>
                        </div>
                        <span className="font-bold text-slate-900">₦{charge.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>
                    );
                  })}

                  {formattedUpcomingCharges.map(charge => {
                    if (!selectedItems[`charge_${charge.id}`]) return null;
                    return (
                      <div key={charge.id} className="flex justify-between py-2 font-medium text-slate-700">
                        <div>
                          <span>{charge.billingRule?.title || charge.billingRule?.description || "Scheduled Bill"}</span>
                          <span className="ml-1.5 text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">
                            Advance Payment
                          </span>
                        </div>
                        <span className="font-bold text-slate-900">₦{charge.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-950">
                    {localIsPartialMode ? "Total to Pay Now" : "Total Selected"}
                  </span>
                  <span className="font-black text-slate-950">₦{totalToPayNow.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* The PaymentFormWrapper inside Modal Body */}
              <PaymentFormWrapper
                totalDue={totalToPayNow}
                canPayPartial={localIsPartialMode}
                partialPaymentInstallments={activeInstallments}
                tenantEmail={session?.user?.email}
                tenantId={profile?.id}
                rentStartDate={profile?.rentStartDate}
                existingPayments={paymentHistory}
                recurringChargeIds={checkoutRecurringChargeIds}
                isRentSelected={!!selectedItems["rent"]}
                rentFrequencyShorthand={rentFrequencyShorthand}
                breakdown={breakdown}
                checkoutBillingRuleIds={checkoutBillingRuleIds}
                baseInstallmentAmount={rentInstallmentOnly}
                installmentCharges={allRecurringCharges.filter(c => {
                  if (c.billingRuleId !== "__system_rent_installment__") return false;
                  // Scope to current cycle only — ignore charges from previous room assignments
                  if (profile?.rentStartDate && new Date(c.createdAt) < new Date(profile.rentStartDate)) return false;
                  return true;
                }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))}
                hasPartialBalance={hasPartialBalance}
                rentRemaining={rentRemaining}
                alreadyPaidRent={alreadyPaidRent}
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
