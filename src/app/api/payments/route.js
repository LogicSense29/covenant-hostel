import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification, getLandlordUserIds } from "@/lib/notifications";
import { autoCreateNextCharge } from "@/lib/billing";

export const dynamic = "force-dynamic";

/** Maps rent frequency to its duration in months. */
const FREQUENCY_MONTHS = {
  DAILY: 0,
  MONTHLY: 1,
  QUARTERLY: 3,
  YEARLY: 12,
  PER_SEMESTER: 6,
};

/**
 * Generates UNPAID RecurringCharge records for remaining installments.
 * Due dates are evenly spaced across the full lease term.
 * e.g. Yearly rent ÷ 3 installments = every 4 months.
 */
async function scheduleRemainingInstallments({ tenantId, installmentAmount, totalInstallments, paidInstallmentNumber, rentFrequency }) {
  const remaining = totalInstallments - paidInstallmentNumber;
  if (remaining <= 0) return;

  const installmentRule = await prisma.billingRule.upsert({
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

  const leaseMonths = FREQUENCY_MONTHS[rentFrequency] ?? 12;
  const intervalMonths = Math.round(leaseMonths / totalInstallments);

  const now = new Date();
  for (let i = 1; i <= remaining; i++) {
    const dueDate = new Date(now);
    if (rentFrequency === "DAILY") {
      dueDate.setDate(dueDate.getDate() + i);
    } else {
      dueDate.setMonth(dueDate.getMonth() + intervalMonths * i);
    }
    const dueDateUTC = new Date(Date.UTC(
      dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 0, 0, 0, 0
    ));
    await prisma.recurringCharge.create({
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

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const body = await req.json();
    const {
      amount,
      receiptUrl,
      isPartial,
      tenantId,
      installmentNumber,
      totalInstallments,
      dueDate,
      paymentType,
      recurringChargeId,
      recurringChargeIds = [],
      isRentSelected = true,
      breakdown,
    } = body;

    if (!amount || !tenantId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const tenant = await prisma.tenantProfile.findUnique({
      where: { id: tenantId },
      include: { user: true },
    });

    if (!tenant) return new NextResponse("Tenant not found", { status: 404 });

    if (session.user.id !== tenant.userId && session.user.role !== "LANDLORD" && session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const payment = await prisma.$transaction(async (tx) => {
      // Handle legacy single recurring charge id
      if (recurringChargeId) {
        const charge = await tx.recurringCharge.findUnique({
          where: { id: recurringChargeId },
          include: { billingRule: true },
        });
        const chargeTitle = charge?.billingRule?.title || charge?.billingRule?.description || "Recurring Charge";

        const p = await tx.payment.create({
          data: {
            amount,
            receiptUrl: receiptUrl || null,
            isPartial: false,
            paymentType: "RECURRING",
            status: receiptUrl ? "PENDING" : "SUCCESS",
            tenantId,
            breakdown: chargeTitle ? [{ name: chargeTitle, amount, frequency: charge?.billingRule?.frequency || null }] : null,
          },
        });

        await tx.recurringCharge.update({
          where: { id: recurringChargeId },
          data: {
            status: receiptUrl ? "PENDING" : "PAID",
            paymentId: p.id,
          },
        });

        if (!receiptUrl) {
          await autoCreateNextCharge(tx, recurringChargeId);
        }

        if (receiptUrl) {
          if (tenant.user.status === "AWAITING_PAYMENT" || tenant.user.status === "EXPIRED") {
            await tx.user.update({
              where: { id: tenant.userId },
              data: { status: "PAYMENT_MADE" },
            });
          }
        }

        return p;
      }

      // Handle consolidated checklist payments
      const charges = recurringChargeIds.length > 0 ? await tx.recurringCharge.findMany({
        where: { id: { in: recurringChargeIds } },
        include: { billingRule: true },
      }) : [];

      const chargesTotal = charges.reduce((sum, c) => sum + c.amount, 0);
      const rentAmount = isRentSelected ? Math.max(0, amount - chargesTotal) : 0;

      let consolidatedPayment = null;

      // Create ONE single payment record for the entire transaction
      consolidatedPayment = await tx.payment.create({
        data: {
          amount: amount, // Total paid amount
          receiptUrl: receiptUrl || null,
          isPartial: !!isPartial,
          paymentType: isRentSelected ? (isPartial ? "PARTIAL" : "FULL") : "RECURRING",
          installmentNumber: installmentNumber || null,
          totalInstallments: totalInstallments || null,
          dueDate: dueDate ? new Date(dueDate) : null,
          status: receiptUrl ? "PENDING" : "SUCCESS",
          tenantId,
          breakdown: breakdown || null,
        },
      });

      // Link all recurring charges to this single payment
      for (const charge of charges) {
        await tx.recurringCharge.update({
          where: { id: charge.id },
          data: {
            status: receiptUrl ? "PENDING" : "PAID",
            paymentId: consolidatedPayment.id,
          },
        });

        if (!receiptUrl) {
          await autoCreateNextCharge(tx, charge.id);
        }
      }

      if (receiptUrl) {
        if (tenant.user.status === "AWAITING_PAYMENT" || tenant.user.status === "EXPIRED") {
          await tx.user.update({
            where: { id: tenant.userId },
            data: { status: "PAYMENT_MADE" },
          });
        }
      }

      if (isRentSelected) {
        await tx.tenantProfile.update({
          where: { id: tenantId },
          data: {
            allowPartialPayment: !!isPartial,
            partialPaymentInstallments: isPartial ? totalInstallments : null,
          },
        });
      }

      return consolidatedPayment;
    });

    // ── Schedule remaining installments on first partial payment ──
    if (isPartial && isRentSelected && installmentNumber === 1 && totalInstallments && totalInstallments > 1) {
      // Fetch the rent billing rule to determine the lease frequency
      const rentRule = tenant.roomId ? await prisma.billingRule.findFirst({
        where: {
          rooms: { some: { id: tenant.roomId } },
          type: { in: ["Base Rent", "Base_Rent", "BaseRent", "Rent", "RENT", "BASE_RENT"] },
        },
      }) : null;
      const rentFrequency = rentRule?.frequency || "YEARLY";

      await scheduleRemainingInstallments({
        tenantId,
        installmentAmount: amount,
        totalInstallments,
        paidInstallmentNumber: 1,
        rentFrequency,
      });
    }

    // Notify landlord and tenant when a receipt is uploaded for approval
    if (receiptUrl) {
      const landlordIds = await getLandlordUserIds();
      await createNotification({
        userIds: landlordIds,
        title: "Payment Receipt Uploaded",
        message: `${tenant.user.name} uploaded a receipt of ₦${amount.toLocaleString()} awaiting your approval.`,
        type: "PAYMENT",
        link: "/landlord/payments",
      });

      await createNotification({
        userId: tenant.userId,
        title: "Receipt Uploaded Pending Approval",
        message: `Your payment receipt of ₦${amount.toLocaleString()} was uploaded and is awaiting verification by the landlord.`,
        type: "PAYMENT",
        link: "/tenant/payments",
      });
    } else {
      await createNotification({
        userId: tenant.userId,
        title: "Payment Logged Successfully",
        message: `A payment of ₦${amount.toLocaleString()} has been logged for your account.`,
        type: "PAYMENT",
        link: "/tenant/payments",
      });
    }

    try {
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/landlord/payments");
      revalidatePath("/tenant/payments");
    } catch (e) {
      console.warn("Revalidation failed:", e);
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Payment error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const payments = await prisma.payment.findMany({
      include: { tenant: { include: { user: true, room: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(payments);
  } catch (error) {
    console.error("Fetch payments error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
