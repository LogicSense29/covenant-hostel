import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      include: { tenant: { include: { user: true } } },
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

      // If this is a full payment or the first installment, update user status
      if (payment.tenant.user.status === "PAYMENT_MADE") {
        await tx.user.update({
          where: { id: payment.tenant.userId },
          data: { status: "PAYMENT_MADE" }, // landlord will still activate tenancy separately
        });
      }

      return p;
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

      // Revert user status if this was their only payment
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reject payment error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
