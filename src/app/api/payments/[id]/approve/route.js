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
            roomSharers: { include: { user: true } },
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

      // If this payment is linked to any recurring charges (can be multiple from checklist flow), mark them paid
      const linkedCharges = await tx.recurringCharge.findMany({
        where: { paymentId: id },
        include: { billingRule: true }
      });
      
      let isRentPayment = false;

      for (const charge of linkedCharges) {
        await tx.recurringCharge.update({
          where: { id: charge.id },
          data: { status: "PAID" },
        });
        await autoCreateNextCharge(tx, charge.id);

        const rType = charge.billingRule?.type;
        if (rType && ["Base Rent", "Base_Rent", "BaseRent", "Rent", "RENT", "BASE_RENT"].includes(rType)) {
          isRentPayment = true;
        }
      }

      if (payment.tenant.user.status === "PAYMENT_MADE") {
        await tx.user.update({
          where: { id: payment.tenant.userId },
          data: { status: "PAYMENT_MADE" },
        });
      } else if (isRentPayment || payment.tenant.user.status === "EXPIRED") {
        // Automatic rent extension for returning tenants
        const matchingRules = payment.tenant.roomId ? await tx.billingRule.findMany({
          where: {
            type: { in: ["Base Rent", "Base_Rent", "BaseRent", "Rent", "RENT", "BASE_RENT"] },
            rooms: { some: { id: payment.tenant.roomId } },
          },
        }) : [];

        const rentRule = matchingRules[0] || null;
        const frequency = rentRule?.frequency || "YEARLY";

        // If ACTIVE and paying ahead, extend from current expiry date. Else from today.
        let baseDate = new Date();
        if (payment.tenant.user.status === "ACTIVE" && payment.tenant.rentExpiryDate && payment.tenant.rentExpiryDate > new Date()) {
          baseDate = new Date(payment.tenant.rentExpiryDate);
        }

        const expiryDate = new Date(baseDate);
        
        switch (frequency) {
          case "DAILY": expiryDate.setDate(expiryDate.getDate() + 1); break;
          case "MONTHLY": expiryDate.setMonth(expiryDate.getMonth() + 1); break;
          case "QUARTERLY": expiryDate.setMonth(expiryDate.getMonth() + 3); break;
          case "YEARLY": expiryDate.setFullYear(expiryDate.getFullYear() + 1); break;
          case "PER_SEMESTER": expiryDate.setMonth(expiryDate.getMonth() + 6); break;
          default: expiryDate.setFullYear(expiryDate.getFullYear() + 1); break;
        }

        await tx.user.update({
          where: { id: payment.tenant.userId },
          data: { status: "ACTIVE" },
        });

        await tx.tenantProfile.update({
          where: { userId: payment.tenant.userId },
          data: { rentExpiryDate: expiryDate }
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

    // Send receipt email and in-platform notifications to sharers
    if (payment.tenant.roomSharers && payment.tenant.roomSharers.length > 0) {
      for (const sharer of payment.tenant.roomSharers) {
        if (sharer.user?.email) {
          await sendPaymentReceiptEmail({
            email: sharer.user.email,
            name: sharer.user.name || "Room Sharer",
            amount: payment.amount,
            reference: payment.reference,
            paymentDate: updated.approvedAt || new Date(),
            roomNumber: room?.roomNumber || null,
            blockName: room?.block?.name || null,
            roomAddress: room?.block?.address || null,
            breakdown: payment.breakdown || null,
            paymentType: payment.paymentType,
          });
        }
        await createNotification({
          userId: sharer.userId,
          title: "Payment Approved",
          message: `A payment of ₦${payment.amount.toLocaleString()} has been approved.`,
          type: "PAYMENT",
          link: "/tenant/payments",
        });
      }
    }

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
      include: { 
        tenant: { 
          include: { 
            user: true,
            roomSharers: { include: { user: true } }
          } 
        } 
      },
    });

    if (!payment) return new NextResponse("Payment not found", { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id },
        data: { status: "REJECTED" },
      });

      const pendingPayments = await tx.payment.count({
        where: {
          tenantId: payment.tenantId,
          id: { not: id },
          status: "PENDING",
        },
      });

      if (pendingPayments === 0) {
        let newStatus = "AWAITING_PAYMENT";
        const rentExpiry = payment.tenant.rentExpiryDate;
        
        if (rentExpiry) {
          const now = new Date();
          if (rentExpiry > now) {
            newStatus = "ACTIVE"; // Rent is active
          } else {
            newStatus = "EXPIRED"; // Rent has expired
          }
        }

        await tx.user.update({
          where: { id: payment.tenant.userId },
          data: { status: newStatus },
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

    // Send email to Tenant
    await sendPaymentRejectedEmail({
      email: payment.tenant.user.email,
      name: payment.tenant.user.name,
      amount: payment.amount,
      reason: reason || "Your payment receipt did not meet our requirements. Please ensure you upload a clear and valid receipt."
    });

    // Send email and in-app notifications to sharers
    if (payment.tenant.roomSharers && payment.tenant.roomSharers.length > 0) {
      for (const sharer of payment.tenant.roomSharers) {
        if (sharer.user?.email) {
          await sendPaymentRejectedEmail({
            email: sharer.user.email,
            name: sharer.user.name || "Room Sharer",
            amount: payment.amount,
            reason: reason || "Your primary tenant's payment receipt did not meet our requirements."
          });
        }
        await createNotification({
          userId: sharer.userId,
          title: "Payment Rejected",
          message: `A payment of ₦${payment.amount.toLocaleString()} was rejected.`,
          type: "PAYMENT",
          link: "/tenant/payments",
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reject payment error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
