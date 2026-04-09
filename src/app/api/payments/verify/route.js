import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const verifySchema = z.object({
  reference: z.string().min(1),
  amount: z.number().positive(),
  signature: z.string().optional(),
  isPartial: z.boolean().optional(),
  installmentNumber: z.number().optional().nullable(),
  totalInstallments: z.number().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const validation = verifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Validation failed", details: validation.error.flatten() }, { status: 400 });
    }

    const { reference, amount, signature, isPartial, installmentNumber, totalInstallments, dueDate } = validation.data;

    // Verify with Paystack
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || paystackData.data.status !== "success") {
      return NextResponse.json({
        error: "Payment verification failed",
        details: paystackData.message || "Invalid transaction reference",
      }, { status: 400 });
    }

    const profile = await prisma.tenantProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) return NextResponse.json({ error: "Tenant profile not found" }, { status: 404 });

    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          amount,
          reference,
          status: "SUCCESS",
          isPartial: !!isPartial,
          paymentType: isPartial ? "PARTIAL" : "FULL",
          installmentNumber: installmentNumber || null,
          totalInstallments: totalInstallments || null,
          dueDate: dueDate ? new Date(dueDate) : null,
          tenantId: profile.id,
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { status: "PAYMENT_MADE" },
      }),
      prisma.tenantProfile.update({
        where: { id: profile.id },
        data: {
          rulesSigned: true,
          rulesSignedAt: new Date(),
          rulesSignedName: signature || "Signed Online",
        },
      }),
    ]);

    return NextResponse.json({ success: true, payment });
  } catch (err) {
    console.error("Paystack verification error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
