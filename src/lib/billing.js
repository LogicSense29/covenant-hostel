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
