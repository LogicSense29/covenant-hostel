import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { autoCreateNextCharge, scheduleRemainingInstallments } from "@/lib/billing";
import { sendPaymentRejectedEmail, sendPaymentReceiptEmail } from "@/lib/email";

/** Maps rent frequency to its duration in months. */
const FREQUENCY_MONTHS = {
  DAILY: 0, // handled separately in days
  MONTHLY: 1,
  QUARTERLY: 3,
  YEARLY: 12,
  PER_SEMESTER: 6,
};

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
      
      let isRentPayment = payment.paymentType === "FULL" || payment.paymentType === "PARTIAL";

      for (const charge of linkedCharges) {
        await tx.recurringCharge.update({
          where: { id: charge.id },
          data: { status: "PAID" },
        });
        await autoCreateNextCharge(tx, charge.id);

        const rType = charge.billingRule?.type;
        if (rType && ["Base Rent", "Base_Rent", "BaseRent", "Rent", "RENT", "BASE_RENT", "RENT_INSTALLMENT"].includes(rType)) {
          isRentPayment = true;
        }
      }

      if (isRentPayment && payment.tenant.rentStartDate) {
        // Only extend expiry for manual receipt payments (PENDING → VERIFIED).
        // Paystack payments (SUCCESS) already had their expiry extended in verify/route.js.
        // Extending again here would double the lease duration.
        const wasAlreadyVerifiedByPaystack = payment.status === "SUCCESS";

        if (!wasAlreadyVerifiedByPaystack) {
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
        
        const leaseMonths = FREQUENCY_MONTHS[frequency] ?? 12;
        const leaseDays = frequency === "DAILY" ? 1 : leaseMonths * 30;
        
        // Use total installments from payment or tenant profile for the calculation
        const totalInstallments = payment.totalInstallments || payment.tenant.partialPaymentInstallments || 1;
        const isPartialPayment = payment.isPartial || (payment.installmentNumber != null && totalInstallments > 1);

        let targetExpiryDate;
        if (!isPartialPayment && payment.paymentType === "FULL") {
          // Paying full rent: lease extends to full lease duration from rentStartDate (or extended by leaseDays if renewing)
          const fullLeaseEndDate = new Date(payment.tenant.rentStartDate);
          fullLeaseEndDate.setDate(fullLeaseEndDate.getDate() + leaseDays);

          if (expiryDate < fullLeaseEndDate) {
            targetExpiryDate = fullLeaseEndDate;
          } else {
            expiryDate.setDate(expiryDate.getDate() + leaseDays);
            targetExpiryDate = expiryDate;
          }
        } else {
          const intervalDays = Math.round(leaseDays / totalInstallments);
          expiryDate.setDate(expiryDate.getDate() + intervalDays);
          targetExpiryDate = expiryDate;
        }

        await tx.user.update({
          where: { id: payment.tenant.userId },
          data: { status: "ACTIVE" },
        });

        await tx.tenantProfile.update({
          where: { userId: payment.tenant.userId },
          data: {
            rentExpiryDate: targetExpiryDate,
            ...(!isPartialPayment ? { allowPartialPayment: false, partialPaymentInstallments: null } : {})
          }
        });
        } else {
          // Paystack payment — expiry already extended in verify route. Just activate the user.
          await tx.user.update({
            where: { id: payment.tenant.userId },
            data: { status: "ACTIVE" },
          });
        }
      } else if (payment.tenant.user.status === "PAYMENT_MADE" || payment.tenant.user.status === "AWAITING_PAYMENT") {
        // For new tenants, or non-rent payments, just ensure they are PAYMENT_MADE 
        // so the landlord can assign a room / activate them later if needed.
        await tx.user.update({
          where: { id: payment.tenant.userId },
          data: { status: "PAYMENT_MADE" },
        });
      }

      return p;
    });

    // ── Generate remaining installment charges if first installment is approved ──
    if (payment.isPartial) {
      const totalInstallments = payment.totalInstallments || payment.tenant.partialPaymentInstallments || 2;
      const installmentNum = payment.installmentNumber || 1;
      if (installmentNum === 1 && totalInstallments > 1) {
        try {
          const matchingRules = payment.tenant.roomId ? await prisma.billingRule.findMany({
            where: {
              type: { in: ["Base Rent", "Base_Rent", "BaseRent", "Rent", "RENT", "BASE_RENT"] },
              rooms: { some: { id: payment.tenant.roomId } },
            },
          }) : [];
          const rentRule = matchingRules[0] || null;
          const frequency = rentRule?.frequency || "YEARLY";

          // Use only the rent portion of the payment for scheduling future installments.
          // The first installment may include one-time fees (caution, security deposit, etc.)
          // that must NOT be included in installments 2+.
          // Extract from breakdown if present, otherwise fall back to the billing rule amount.
          let rentOnlyAmount = payment.amount;
          if (Array.isArray(payment.breakdown)) {
            const rentItem = payment.breakdown.find(b =>
              b.name?.toLowerCase().includes("rent")
            );
            if (rentItem?.amount) rentOnlyAmount = rentItem.amount;
          } else if (rentRule?.amount) {
            // Divide full rent by installments to get per-installment rent amount
            rentOnlyAmount = Math.round((rentRule.amount / totalInstallments) * 100) / 100;
          }

          await scheduleRemainingInstallments({
            tenantId: payment.tenantId,
            installmentAmount: rentOnlyAmount,
            totalInstallments,
            paidInstallmentNumber: 1,
            rentFrequency: frequency,
            startDate: payment.tenant.rentStartDate || new Date(),
          });
        } catch (err) {
          console.error("[Installments] Failed to schedule remaining installments on approval:", err);
        }
      }
    }

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
        // Only change status for rent payments (FULL or PARTIAL).
        // Rejecting a utility/recurring charge should never lock the tenant out.
        const isRentPayment = payment.paymentType === "FULL" || payment.paymentType === "PARTIAL" || payment.isPartial;

        if (isRentPayment) {
          // Determine the correct locked status.
          // We do NOT trust rentExpiryDate to decide if they are "active" —
          // the payment was just rejected, meaning their rent money did not go through.
          // For a returning tenant whose previous cycle had already expired: EXPIRED.
          // For a new tenant or one whose previous cycle has not yet expired but
          // they were trying to pay a fresh cycle: AWAITING_PAYMENT.
          const rentExpiry = payment.tenant.rentExpiryDate;
          const now = new Date();

          let newStatus;
          if (rentExpiry && rentExpiry < now) {
            // Previous rent cycle already expired — keep them EXPIRED
            newStatus = "EXPIRED";
          } else {
            // No expiry yet (new tenant) or future expiry (renewal rejected mid-cycle)
            // → lock back to AWAITING_PAYMENT so routes are restricted
            newStatus = "AWAITING_PAYMENT";
          }

          await tx.user.update({
            where: { id: payment.tenant.userId },
            data: { status: newStatus },
          });
        }
        // If RECURRING payment rejected: do not change user status.
        // Tenant keeps their current access — they just need to re-upload the utility receipt.
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
