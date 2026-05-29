import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { autoCreateNextCharge } from "@/lib/billing";
import { sendPaymentRejectedEmail, sendPaymentReceiptEmail } from "@/lib/email";



export const dynamic = "force-dynamic";

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const { id } = params;

  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        tenant: {
          include: {
            user: true,
            room: { include: { block: true } },
          },
        },
      },
    });

    if (!payment) return new NextResponse("Payment not found", { status: 404 });
    if (payment.status === "VERIFIED") return new NextResponse("Already approved", { status: 400 });

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id },
        data: {
          status: "VERIFIED",
          approvedAt: new Date(),
          approvedBy: session.user.id,
        },
      });

      // If this payment is linked to a recurring charge, mark it paid
      const linkedCharge = await tx.recurringCharge.findUnique({
        where: { paymentId: id },
      });
      if (linkedCharge) {
        await tx.recurringCharge.update({
          where: { id: linkedCharge.id },
          data: { status: "PAID" },
        });
        await autoCreateNextCharge(tx, linkedCharge.id);
      }

      if (payment.tenant.user.status === "PAYMENT_MADE") {
        await tx.user.update({
          where: { id: payment.tenant.userId },
          data: { status: "PAYMENT_MADE" },
        });
      }

      return p;
    });

    // Notify tenant
    await createNotification({
      userId: payment.tenant.userId,
      title: "Payment Approved",
      message: `Your payment of ₦${payment.amount.toLocaleString()} has been approved.`,
      type: "PAYMENT",
      link: "/tenant/payments",
    });

    // Send receipt email to tenant
    const room = payment.tenant.room;
    await sendPaymentReceiptEmail({
      email: payment.tenant.user.email,
      name: payment.tenant.user.name,
      amount: payment.amount,
      reference: payment.reference,
      paymentDate: updated.approvedAt || new Date(),
      roomNumber: room?.roomNumber || null,
      blockName: room?.block?.name || null,
      roomAddress: room?.block?.address || null,
      breakdown: payment.breakdown || null,
      paymentType: payment.paymentType,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Approve payment error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const { id } = params;
  let reason = "";
  try {
    const body = await req.json().catch(() => ({}));
    reason = body.reason || "";
  } catch (e) {}

  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { tenant: { include: { user: true } } },
    });

    if (!payment) return new NextResponse("Payment not found", { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id },
        data: { status: "REJECTED" },
      });

      const otherPayments = await tx.payment.count({
        where: {
          tenantId: payment.tenantId,
          id: { not: id },
          status: { in: ["PENDING", "VERIFIED", "SUCCESS"] },
        },
      });

      if (otherPayments === 0) {
        await tx.user.update({
          where: { id: payment.tenant.userId },
          data: { status: "AWAITING_PAYMENT" },
        });
      }
    });

    // Notify tenant in-app
    await createNotification({
      userId: payment.tenant.userId,
      title: "Payment Rejected",
      message: `Your payment of ₦${payment.amount.toLocaleString()} was rejected. Please re-upload your receipt or contact the office.`,
      type: "PAYMENT",
      link: "/tenant/payments",
    });

    // Send email to both Tenant and Admin
    await sendPaymentRejectedEmail({
      email: payment.tenant.user.email,
      name: payment.tenant.user.name,
      amount: payment.amount,
      reason: reason || "Your payment receipt did not meet our requirements. Please ensure you upload a clear and valid receipt."
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reject payment error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
