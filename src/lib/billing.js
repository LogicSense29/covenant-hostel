import { prisma } from "@/lib/prisma";

/**
 * Automatically creates the next recurring charge in the cycle
 * based on the frequency of the billing rule.
 * Can be run within a Prisma transaction if `tx` is provided.
 */
export async function autoCreateNextCharge(tx, chargeId) {
  const db = tx || prisma;
  
  const charge = await db.recurringCharge.findUnique({
    where: { id: chargeId },
    include: { billingRule: true },
  });

  if (!charge || charge.billingRule.frequency === "ONCE") return null;
  // System rent installment charges are one-time records — never auto-renew them.
  if (charge.billingRule.type === "RENT_INSTALLMENT") return null;


  const nextDue = new Date(charge.dueDate);
  switch (charge.billingRule.frequency) {
    case "DAILY":
      nextDue.setDate(nextDue.getDate() + 1);
      break;
    case "MONTHLY":
      nextDue.setMonth(nextDue.getMonth() + 1);
      break;
    case "QUARTERLY":
      nextDue.setMonth(nextDue.getMonth() + 3);
      break;
    case "YEARLY":
      nextDue.setFullYear(nextDue.getFullYear() + 1);
      break;
    case "PER_SEMESTER":
      nextDue.setMonth(nextDue.getMonth() + 6);
      break;
    default:
      return null;
  }

  // Normalize nextDue to UTC midnight
  const normalizedNextDue = new Date(Date.UTC(
    nextDue.getFullYear(),
    nextDue.getMonth(),
    nextDue.getDate(),
    0, 0, 0, 0
  ));

  // Check if a charge already exists for this tenant, rule, and exact normalized dueDate
  const existing = await db.recurringCharge.findFirst({
    where: {
      tenantId: charge.tenantId,
      billingRuleId: charge.billingRuleId,
      dueDate: normalizedNextDue,
    },
  });

  if (!existing) {
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
    
    // Status is OVERDUE if the normalizedNextDue is strictly before today UTC midnight
    const status = normalizedNextDue < today ? "OVERDUE" : "UNPAID";
    
    return await db.recurringCharge.create({
      data: {
        tenantId: charge.tenantId,
        billingRuleId: charge.billingRuleId,
        amount: charge.billingRule.amount,
        dueDate: normalizedNextDue,
        status,
      },
    });
  }
  return existing;
}

/**
 * When a tenant pays an installment, this function generates
 * concrete RecurringCharge records for all remaining installments.
 */
export async function scheduleRemainingInstallments({
  tenantId,
  installmentAmount,
  totalInstallments,
  paidInstallmentNumber = 1,
  rentFrequency = "YEARLY",
  startDate = new Date(),
  tx = null,
}) {
  const db = tx || prisma;
  const remaining = totalInstallments - paidInstallmentNumber;
  if (remaining <= 0) return;

  const installmentRule = await db.billingRule.upsert({
    where: { id: "__system_rent_installment__" },
    update: {},
    create: {
      id: "__system_rent_installment__",
      title: "Rent Installment",
      description: "System-generated installment for partial rent payment plan.",
      amount: 0,
      type: "RENT_INSTALLMENT",
      frequency: "MONTHLY",
      isGlobal: false,
      isOptional: false,
    },
  });

  const FREQUENCY_MONTHS = {
    DAILY: 0,
    MONTHLY: 1,
    QUARTERLY: 3,
    PER_SEMESTER: 6,
    YEARLY: 12,
  };

  const leaseMonths = FREQUENCY_MONTHS[rentFrequency] ?? 12;
  const leaseDays = rentFrequency === "DAILY" ? 1 : leaseMonths * 30;
  const intervalDays = Math.round(leaseDays / totalInstallments);

  const baseDate = startDate ? new Date(startDate) : new Date();

  for (let i = 1; i <= remaining; i++) {
    const dueDate = new Date(baseDate);
    dueDate.setDate(dueDate.getDate() + intervalDays * i);

    const dueDateUTC = new Date(Date.UTC(
      dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 0, 0, 0, 0
    ));

    const existing = await db.recurringCharge.findFirst({
      where: {
        tenantId,
        billingRuleId: installmentRule.id,
        dueDate: dueDateUTC,
      },
    });

    if (!existing) {
      await db.recurringCharge.create({
        data: {
          tenantId,
          billingRuleId: installmentRule.id,
          amount: installmentAmount,
          dueDate: dueDateUTC,
          status: "UNPAID",
        },
      });
    }
  }
}

