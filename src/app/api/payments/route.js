import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification, getLandlordUserIds } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const body = await req.json();
    const { amount, receiptUrl, isPartial, tenantId, installmentNumber, totalInstallments, dueDate, paymentType, recurringChargeId } = body;

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
      const p = await tx.payment.create({
        data: {
          amount,
          receiptUrl: receiptUrl || null,
          isPartial: !!isPartial,
          paymentType: paymentType || (isPartial ? "PARTIAL" : recurringChargeId ? "RECURRING" : "FULL"),
          installmentNumber: installmentNumber || null,
          totalInstallments: totalInstallments || null,
          dueDate: dueDate ? new Date(dueDate) : null,
          status: receiptUrl ? "PENDING" : "SUCCESS",
          tenantId,
        },
      });

      if (recurringChargeId) {
        await tx.recurringCharge.update({
          where: { id: recurringChargeId },
          data: {
            status: receiptUrl ? "PENDING" : "PAID",
            paymentId: p.id,
          },
        });
      }

      if (receiptUrl) {
        await tx.user.update({
          where: { id: tenant.userId },
          data: { status: "PAYMENT_MADE" },
        });
      }

      return p;
    });

    // Notify landlord when a receipt is uploaded for approval
    if (receiptUrl) {
      const landlordIds = await getLandlordUserIds();
      await createNotification({
        userIds: landlordIds,
        title: "Payment Receipt Uploaded",
        message: `${tenant.user.name} uploaded a receipt of ₦${amount.toLocaleString()} awaiting your approval.`,
        type: "PAYMENT",
        link: "/landlord/payments",
      });
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
