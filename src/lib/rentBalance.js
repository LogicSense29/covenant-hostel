/**
 * rentBalance.js — Single source of truth for tenant rent balance calculation.
 *
 * All rent balance logic lives here. The payments page and any other server
 * component should call computeRentBalance() and use its output directly.
 * No rent arithmetic should happen in components or pages.
 */

/**
 * Determines if a Payment record is a rent payment (not a fee or utility).
 *
 * Rules (in priority order):
 * 1. paymentType FULL or PARTIAL → rent payment
 * 2. installmentNumber is set → rent installment
 * 3. recurringCharge linked to "__system_rent_installment__" → rent installment
 * 4. breakdown array contains a line item whose name includes "rent" → extract rent portion only
 * 5. Everything else (RECURRING, SECURITY_DEPOSIT, fees) → NOT rent
 *
 * IMPORTANT: A payment whose paymentType is RECURRING is a utility/charge payment,
 * never a rent payment, even if its amount matches the rent amount.
 */
function isRentPayment(payment) {
  if (payment.paymentType === "RECURRING") return false;
  if (payment.paymentType === "FULL" || payment.paymentType === "PARTIAL") return true;
  if (payment.isPartial) return true;
  if (payment.installmentNumber != null) return true;
  if (payment.recurringCharge?.billingRuleId === "__system_rent_installment__") return true;
  // Only match breakdown if it explicitly has a rent line item
  if (Array.isArray(payment.breakdown)) {
    return payment.breakdown.some(b => b.name?.toLowerCase().includes("rent"));
  }
  return false;
}

/**
 * Extracts the rent amount from a Payment record.
 * If the payment has a breakdown with a rent line item, returns that specific amount.
 * Otherwise returns the full payment amount (payment was rent-only).
 */
function extractRentAmount(payment) {
  if (Array.isArray(payment.breakdown)) {
    const rentItem = payment.breakdown.find(b => b.name?.toLowerCase().includes("rent"));
    if (rentItem?.amount != null) return rentItem.amount;
  }
  return payment.amount;
}

/**
 * Computes the authoritative rent balance for a tenant.
 *
 * @param {object} opts
 * @param {object}   opts.profile              - TenantProfile with carriedOverBalance, rentStartDate, rentExpiryDate, allowPartialPayment
 * @param {object}   opts.effectiveProfile      - Same as profile unless tenant is a sharer (then it's primary tenant's profile)
 * @param {object}   opts.effectiveUser         - User record (status field)
 * @param {number}   opts.baseRentAmount        - Amount from BASE_RENT billing rule (never includes fees)
 * @param {object[]} opts.paymentHistory        - All Payment records for this tenant (with recurringCharge included)
 * @param {object[]} opts.recurringCharges      - All RecurringCharge records for this tenant
 * @param {number}   opts.totalFees             - Sum of non-rent fees in the current checkout (caution, etc.)
 * @param {boolean}  opts.isExpiringSoon        - Whether rent expires within the renewal window
 * @param {boolean}  opts.globalPartialEnabled  - System-wide partial payment toggle
 * @param {number}   opts.globalPartialInstallments - Default installment count from settings
 *
 * @returns {object} Rent balance state — see property comments below.
 */
export function computeRentBalance({
  profile,
  effectiveProfile,
  effectiveUser,
  baseRentAmount,
  paymentHistory,
  recurringCharges,
  totalFees,
  isExpiringSoon,
  globalPartialEnabled,
  globalPartialInstallments,
}) {
  const now = new Date();

  // ── 1. Scope payments to the current room/cycle ──────────────────────────
  // rentStartDate is reset every time a tenant is assigned a new room.
  // Only count payments made ON OR AFTER rentStartDate.
  const cycleStartDate = effectiveProfile.rentStartDate
    ? new Date(effectiveProfile.rentStartDate)
    : null;

  const verifiedRentPayments = paymentHistory.filter(p => {
    if (p.status !== "SUCCESS" && p.status !== "VERIFIED") return false;
    if (!isRentPayment(p)) return false;
    if (cycleStartDate && new Date(p.createdAt) < cycleStartDate) return false;
    return true;
  });

  // Sum only the rent portion of each payment (excludes bundled fees)
  const verifiedRentTotal = verifiedRentPayments.reduce((sum, p) => sum + extractRentAmount(p), 0);

  // ── 2. Carry-over credit from previous room mid-cycle transfer ────────────
  // This is set by the landlord during room reassignment. It acts as a virtual
  // payment — reduces what the tenant owes on the new room without being a real
  // payment record (since the money was paid for the old room).
  const carriedOverBalance = effectiveProfile.carriedOverBalance ?? 0;

  // Combined: actual payments + carry-over credit
  const effectivePaid = verifiedRentTotal + carriedOverBalance;

  // ── 3. Installment plan detection — scoped to current cycle ──────────────
  // Only consider installment charges created on or after rentStartDate.
  // This prevents old room installment charges from affecting the new room.
  const allInstallmentCharges = recurringCharges.filter(c => {
    if (c.billingRuleId !== "__system_rent_installment__") return false;
    if (cycleStartDate && new Date(c.createdAt) < cycleStartDate) return false;
    return true;
  });

  const openInstallmentCharges = allInstallmentCharges.filter(
    c => c.status === "UNPAID" || c.status === "OVERDUE" || c.status === "PENDING"
  );
  const unpaidInstallmentCharges = openInstallmentCharges.filter(c => c.status !== "PENDING");

  // A verified installment payment scoped to the current cycle
  const hasVerifiedInstallment = verifiedRentPayments.some(
    p => p.installmentNumber != null
  );

  const hasActiveInstallmentPlan = hasVerifiedInstallment && (
    allInstallmentCharges.length > 0 || profile.allowPartialPayment
  );

  // Open installments exist if there are unpaid/overdue installment charges
  // OR if some rent has been paid but it's less than the full amount
  const hasOpenInstallments = openInstallmentCharges.length > 0 ||
    (effectivePaid > 0 && effectivePaid < baseRentAmount);

  // ── 4. Renewal detection ─────────────────────────────────────────────────
  // A tenant needs renewal only if they have no open installment obligations
  // AND their status is expired or expiring soon.
  const needsRenewal = !hasOpenInstallments && (
    effectiveUser?.status === "EXPIRED" || isExpiringSoon
  );

  // totalDue = base rent + fees (fees are only included for the renewal/first-payment context)
  const totalDue = baseRentAmount + totalFees;

  // ── 5. Compute rentRemaining ──────────────────────────────────────────────
  // rentRemaining is ALWAYS based on baseRentAmount, never totalDue.
  // Fees (caution, security deposit, etc.) are shown separately and never
  // folded into the rent balance.
  let rentRemaining;

  if (needsRenewal) {
    // Starting a fresh cycle — full rent is due (fees handled separately in checkout)
    rentRemaining = baseRentAmount;
  } else if (effectivePaid > 0 && effectivePaid < baseRentAmount) {
    // Partial payment made — show remaining balance
    rentRemaining = Math.max(0, baseRentAmount - effectivePaid);
  } else if (effectivePaid >= baseRentAmount) {
    // Fully paid for this cycle
    rentRemaining = 0;
  } else {
    // No payments yet — full rent is due
    rentRemaining = baseRentAmount;
  }

  // ── 6. Derived flags ─────────────────────────────────────────────────────
  const isRentPaid = !needsRenewal && !hasOpenInstallments && rentRemaining === 0 && effectivePaid > 0;

  // hasPartialBalance: some rent has been paid, but not all.
  // carriedOverBalance alone does NOT trigger this — it only triggers when actual
  // payments have been made OR a carry-over exists and reduces the balance.
  const hasPartialBalance = !isRentPaid && effectivePaid > 0 && rentRemaining < baseRentAmount && rentRemaining > 0;

  // alreadyPaidRent: for display in the "already paid" badge
  // Only shown when hasPartialBalance is true
  const alreadyPaidRent = hasPartialBalance ? effectivePaid : 0;

  // ── 7. Partial payment / installment config ───────────────────────────────
  const hasSpecificPartialAccess = profile.allowPartialPayment && (profile.partialPaymentInstallments ?? 0) > 1;
  const isOldTenant = effectiveProfile.rentStartDate !== null;

  const canChoosePartial = (isOldTenant && needsRenewal && (hasSpecificPartialAccess || globalPartialEnabled)) ||
    (hasOpenInstallments && (hasSpecificPartialAccess || globalPartialEnabled || hasActiveInstallmentPlan));

  const defaultInstallments = hasSpecificPartialAccess
    ? profile.partialPaymentInstallments
    : (globalPartialEnabled ? globalPartialInstallments : (profile.partialPaymentInstallments || 2));

  // isPartialMode: force partial for returning tenants with specific access only
  const isPartialMode = isOldTenant && hasSpecificPartialAccess && !canChoosePartial;

  const installmentAmount = (isPartialMode || canChoosePartial)
    ? Math.round((rentRemaining > 0 ? rentRemaining : baseRentAmount) / defaultInstallments * 100) / 100
    : null;

  return {
    // Core balance
    baseRentAmount,
    verifiedRentTotal,
    carriedOverBalance,
    effectivePaid,
    rentRemaining,
    totalDue,

    // Flags
    isRentPaid,
    hasPartialBalance,
    hasOpenInstallments,
    hasActiveInstallmentPlan,
    hasVerifiedInstallment,
    needsRenewal,
    isOldTenant,

    // For display
    alreadyPaidRent,
    verifiedRentPayments,

    // Installment plan
    allInstallmentCharges,
    openInstallmentCharges,
    unpaidInstallmentCharges,
    canChoosePartial,
    defaultInstallments,
    isPartialMode,
    installmentAmount,
    hasSpecificPartialAccess,
  };
}
