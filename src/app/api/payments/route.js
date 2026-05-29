import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification, getLandlordUserIds } from "@/lib/notifications";
import { autoCreateNextCharge } from "@/lib/billing";


export const dynamic = "force-dynamic";

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
            breakdown: chargeTitle ? [{ name: chargeTitle, amount }] : null,
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
          await tx.user.update({
            where: { id: tenant.userId },
            data: { status: "PAYMENT_MADE" },
          });
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

      let rentPayment = null;

      if (isRentSelected && rentAmount > 0) {
        rentPayment = await tx.payment.create({
          data: {
            amount: rentAmount,
            receiptUrl: receiptUrl || null,
            isPartial: !!isPartial,
            paymentType: paymentType || (isPartial ? "PARTIAL" : "FULL"),
            installmentNumber: installmentNumber || null,
            totalInstallments: totalInstallments || null,
            dueDate: dueDate ? new Date(dueDate) : null,
            status: receiptUrl ? "PENDING" : "SUCCESS",
            tenantId,
            breakdown: breakdown || null,
          },
        });
      }

      for (const charge of charges) {
        const rcPayment = await tx.payment.create({
          data: {
            amount: charge.amount,
            receiptUrl: receiptUrl || null,
            isPartial: false,
            paymentType: "RECURRING",
            status: receiptUrl ? "PENDING" : "SUCCESS",
            tenantId,
            breakdown: [
              {
                name: charge.billingRule?.title || charge.billingRule?.description || "Recurring Charge",
                amount: charge.amount,
              }
            ],
          },
        });

        await tx.recurringCharge.update({
          where: { id: charge.id },
          data: {
            status: receiptUrl ? "PENDING" : "PAID",
            paymentId: rcPayment.id,
          },
        });

        if (!receiptUrl) {
          await autoCreateNextCharge(tx, charge.id);
        }
      }

      if (receiptUrl) {
        await tx.user.update({
          where: { id: tenant.userId },
          data: { status: "PAYMENT_MADE" },
        });
      }

      return rentPayment || { success: true };
    });

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
