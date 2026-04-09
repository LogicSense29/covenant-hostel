import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const body = await req.json();
    const { amount, receiptUrl, isPartial, tenantId, installmentNumber, totalInstallments, dueDate, paymentType } = body;

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

    // Receipt upload payments start as PENDING (need landlord approval)
    // Paystack payments are verified separately via /verify
    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          amount,
          receiptUrl: receiptUrl || null,
          isPartial: !!isPartial,
          paymentType: paymentType || (isPartial ? "PARTIAL" : "FULL"),
          installmentNumber: installmentNumber || null,
          totalInstallments: totalInstallments || null,
          dueDate: dueDate ? new Date(dueDate) : null,
          status: receiptUrl ? "PENDING" : "SUCCESS",
          tenantId,
        },
      });

      // Only update user status if it's a receipt upload (landlord will confirm later)
      // or if it's a direct full payment
      if (receiptUrl) {
        await tx.user.update({
          where: { id: tenant.userId },
          data: { status: "PAYMENT_MADE" },
        });
      }

      return p;
    });

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
