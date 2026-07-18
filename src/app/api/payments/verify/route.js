import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { autoCreateNextCharge } from "@/lib/billing";
import { createNotification, getLandlordUserIds } from "@/lib/notifications";
import { sendPaymentReceiptEmail } from "@/lib/email";


export const dynamic = "force-dynamic";

const verifySchema = z.object({
  reference: z.string().min(1),
  amount: z.number().positive(),
  signature: z.string().optional(),
  isPartial: z.boolean().optional(),
  installmentNumber: z.number().optional().nullable(),
  totalInstallments: z.number().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  recurringChargeId: z.string().optional().nullable(),
  recurringChargeIds: z.array(z.string()).optional(),
  isRentSelected: z.boolean().optional(),
  breakdown: z.array(z.object({
    name: z.string(),
    amount: z.number()
  })).optional(),
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

    const {
      reference,
      amount,
      signature,
      isPartial,
      installmentNumber,
      totalInstallments,
      dueDate,
      recurringChargeId,
      recurringChargeIds = [],
      isRentSelected = true,
      breakdown,
    } = validation.data;

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

    const actualPaidAmount = paystackData.data.amount / 100;
    
    // Ensure the client didn't spoof the amount payload
    if (Math.abs(actualPaidAmount - amount) > 0.01) {
      return NextResponse.json({ 
        error: "Payment verification failed",
        details: "Amount paid does not match the requested amount."
      }, { status: 400 });
    }

    const profile = await prisma.tenantProfile.findUnique({
      where: { userId: session.user.id },
      include: { 
        room: { include: { block: true } },
        roomSharers: { include: { user: true } }
      },
    });

    if (!profile) return NextResponse.json({ error: "Tenant profile not found" }, { status: 404 });

    // Handle single legacy recurring charge payment
    if (recurringChargeId) {
      const charge = await prisma.recurringCharge.findUnique({
        where: { id: recurringChargeId },
        include: { billingRule: true },
      });

      if (!charge) return NextResponse.json({ error: "Charge not found" }, { status: 404 });

      if (actualPaidAmount < charge.amount) {
        return NextResponse.json({ error: "Insufficient amount paid for this charge" }, { status: 400 });
      }

      const chargeTitle = charge?.billingRule?.title || charge?.billingRule?.description || "Recurring Charge";

      const rcPayment = await prisma.payment.create({
        data: {
          amount,
          reference,
          status: "SUCCESS",
          isPartial: false,
          paymentType: "RECURRING",
          tenantId: profile.id,
          breakdown: chargeTitle ? [{ name: chargeTitle, amount, frequency: charge?.billingRule?.frequency || null }] : null,
        },
      });

      await prisma.recurringCharge.update({
        where: { id: recurringChargeId },
        data: { status: "PAID", paymentId: rcPayment.id },
      });

      await autoCreateNextCharge(prisma, recurringChargeId);

      // Notify tenant
      await createNotification({
        userId: session.user.id,
        title: "Bill Paid Successfully",
        message: `Your payment for the utility charge of ₦${amount.toLocaleString()} was successful.`,
        type: "PAYMENT",
        link: "/tenant/payments",
      });

      // Send receipt email to primary tenant
      await sendPaymentReceiptEmail({
        email: session.user.email,
        name: session.user.name,
        amount,
        reference,
        paymentDate: new Date(),
        roomNumber: profile.room?.roomNumber || null,
        blockName: profile.room?.block?.name || null,
        roomAddress: profile.room?.block?.address || null,
        breakdown: rcPayment.breakdown || null,
        paymentType: "RECURRING",
      });

      // Send receipt email to sharers
      if (profile.roomSharers && profile.roomSharers.length > 0) {
        for (const sharer of profile.roomSharers) {
          if (sharer.user?.email) {
            await sendPaymentReceiptEmail({
              email: sharer.user.email,
              name: sharer.user.name || "Room Sharer",
              amount,
              reference,
              paymentDate: new Date(),
              roomNumber: profile.room?.roomNumber || null,
              blockName: profile.room?.block?.name || null,
              roomAddress: profile.room?.block?.address || null,
              breakdown: rcPayment.breakdown || null,
              paymentType: "RECURRING",
            });
          }
          await createNotification({
            userId: sharer.userId,
            title: "Bill Paid Successfully",
            message: `A payment for the utility charge of ₦${amount.toLocaleString()} was successful.`,
            type: "PAYMENT",
            link: "/tenant/payments",
          });
        }
      }

      // Notify landlords
      const landlordIds = await getLandlordUserIds();
      await createNotification({
        userIds: landlordIds,
        title: "Recurring Bill Payment",
        message: `${session.user.name} paid a recurring charge of ₦${amount.toLocaleString()} via Paystack.`,
        type: "PAYMENT",
        link: "/landlord/payments",
      });

      try {
        const { revalidatePath } = await import("next/cache");
        revalidatePath("/tenant/payments");
        revalidatePath("/tenant/payments/history");
        revalidatePath("/landlord/payments");
      } catch (e) {
        console.warn("Revalidation failed:", e);
      }

      return NextResponse.json({ success: true, payment: rcPayment });
    }

    // Handle consolidated checklist payments
    const charges = recurringChargeIds.length > 0 ? await prisma.recurringCharge.findMany({
      where: { id: { in: recurringChargeIds } },
      include: { billingRule: true },
    }) : [];

    const chargesTotal = charges.reduce((sum, c) => sum + c.amount, 0);

    if (actualPaidAmount < chargesTotal) {
      return NextResponse.json({ error: "Amount paid is less than the total of selected charges" }, { status: 400 });
    }

    // Create ONE single consolidated payment record
    const consolidatedPayment = await prisma.payment.create({
      data: {
        amount: actualPaidAmount, // Full verified amount
        reference,
        status: "SUCCESS",
        isPartial: !!isPartial,
        paymentType: isRentSelected ? (isPartial ? "PARTIAL" : "FULL") : "RECURRING",
        installmentNumber: installmentNumber || null,
        totalInstallments: totalInstallments || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        tenantId: profile.id,
        breakdown: breakdown || null,
      },
    });

    const txOps = [
      prisma.user.update({
        where: { id: session.user.id },
        data: { status: "PAYMENT_MADE" },
      })
    ];

    if (isRentSelected && rentAmount > 0) {
      txOps.push(
        prisma.tenantProfile.update({
          where: { id: profile.id },
          data: {
            rulesSigned: true,
            rulesSignedAt: new Date(),
            rulesSignedName: signature || "Signed Online",
          },
        })
      );
    }

    // Link all recurring charges to the consolidated payment
    for (const charge of charges) {
      txOps.push(
        prisma.recurringCharge.update({
          where: { id: charge.id },
          data: {
            status: "PAID",
            paymentId: consolidatedPayment.id,
          },
        })
      );
    }

    await prisma.$transaction(txOps);

    for (const charge of charges) {
      await autoCreateNextCharge(prisma, charge.id);
    }

    // Notify tenant
    await createNotification({
      userId: session.user.id,
      title: "Payment Received",
      message: `Your payment of ₦${actualPaidAmount.toLocaleString()} has been received successfully.`,
      type: "PAYMENT",
      link: "/tenant/payments",
    });

    // Send single consolidated receipt email to primary tenant
    await sendPaymentReceiptEmail({
      email: session.user.email,
      name: session.user.name,
      amount: actualPaidAmount,
      reference,
      paymentDate: new Date(),
      roomNumber: profile.room?.roomNumber || null,
      blockName: profile.room?.block?.name || null,
      roomAddress: profile.room?.block?.address || null,
      breakdown: breakdown || null,
      paymentType: consolidatedPayment.paymentType,
    });

    // Send single consolidated receipt email to sharers
    if (profile.roomSharers && profile.roomSharers.length > 0) {
      for (const sharer of profile.roomSharers) {
        if (sharer.user?.email) {
          await sendPaymentReceiptEmail({
            email: sharer.user.email,
            name: sharer.user.name || "Room Sharer",
            amount: actualPaidAmount,
            reference,
            paymentDate: new Date(),
            roomNumber: profile.room?.roomNumber || null,
            blockName: profile.room?.block?.name || null,
            roomAddress: profile.room?.block?.address || null,
            breakdown: breakdown || null,
            paymentType: consolidatedPayment.paymentType,
          });
        }
        await createNotification({
          userId: sharer.userId,
          title: "Payment Received",
          message: `A payment of ₦${actualPaidAmount.toLocaleString()} has been received successfully.`,
          type: "PAYMENT",
          link: "/tenant/payments",
        });
      }
    }

    // Notify landlords
    const landlordIds = await getLandlordUserIds();
    await createNotification({
      userIds: landlordIds,
      title: "Payment Received",
      message: `${session.user.name} paid ₦${actualPaidAmount.toLocaleString()} via Paystack.`,
      type: "PAYMENT",
      link: "/landlord/payments",
    });

    try {
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/tenant/payments");
      revalidatePath("/tenant/payments/history");
      revalidatePath("/landlord/payments");
      revalidatePath("/landlord/tenants");
    } catch (e) {
      console.warn("Revalidation failed:", e);
    }

    return NextResponse.json({ success: true, payment: consolidatedPayment });
  } catch (err) {
    console.error("Paystack verification error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
