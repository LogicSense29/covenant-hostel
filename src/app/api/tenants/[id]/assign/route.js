import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Calculate the expiry date based on billing rule frequency.
 * Starts from `fromDate` (defaults to now).
 */
function calcExpiry(frequency, fromDate = new Date()) {
  const expiry = new Date(fromDate);
  switch (frequency) {
    case "DAILY":        expiry.setDate(expiry.getDate() + 1);         break;
    case "MONTHLY":      expiry.setMonth(expiry.getMonth() + 1);       break;
    case "QUARTERLY":    expiry.setMonth(expiry.getMonth() + 3);       break;
    case "PER_SEMESTER": expiry.setMonth(expiry.getMonth() + 6);       break;
    case "YEARLY":
    default:             expiry.setFullYear(expiry.getFullYear() + 1); break;
  }
  return expiry;
}

// Statuses that mean "vetted" — assigning a room may promote them to ACTIVE user status.
// NOTE: StayHistory creation is handled separately in activate-tenancy after payment is confirmed.
const PROMOTABLE_STATUSES = ["AWAITING_PAYMENT", "PAYMENT_MADE", "APPROVED"];

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { roomId, rentExpiryDate: clientExpiry, carryOverBalance = false } = body;

    if (!roomId) {
      return new NextResponse("Missing roomId", { status: 400 });
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      const profile = await tx.tenantProfile.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!profile) throw new Error("Tenant profile not found");

      const isRoomChange = Boolean(profile.roomId);
      const currentStatus = profile.user?.status;

      let rentStartDate;
      let expiry;
      let newCarriedOverBalance = 0;

      if (isRoomChange) {
        // ── Room change ──
        const rentIsActive = profile.rentExpiryDate && new Date(profile.rentExpiryDate) > now;

        if (rentIsActive && carryOverBalance) {
          // Tenant has an active unexpired cycle AND landlord chose to carry over.
          // Calculate what's still owed on the old room, store it as carriedOverBalance.
          // Preserve the existing cycle dates so expiry doesn't reset.
          const verifiedPayments = await tx.payment.findMany({
            where: {
              tenantId: profile.id,
              status: { in: ["VERIFIED", "SUCCESS"] },
              type: "RENT",
              createdAt: { gte: profile.rentStartDate ?? new Date(0) },
            },
            select: { amount: true },
          });
          const alreadyPaid = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);

          // Determine full rent amount for the old room
          const oldBaseRentRule = await tx.billingRule.findFirst({
            where: {
              type: { in: ["Base Rent", "Base_Rent", "BaseRent", "Rent", "RENT", "BASE_RENT"] },
              rooms: { some: { id: profile.roomId } },
            },
          });
          const oldFullRent = oldBaseRentRule?.amount ?? profile.room?.rentAmount ?? 0;
          const remaining = Math.max(0, oldFullRent - alreadyPaid);

          newCarriedOverBalance = remaining;

          // Preserve existing cycle dates — tenant is mid-cycle
          rentStartDate = now; // reset start to now so payment scoping works correctly
          expiry = profile.rentExpiryDate;
        } else {
          // Rent expired OR landlord chose fresh start — reset everything
          rentStartDate = now;
          newCarriedOverBalance = 0;

          if (clientExpiry) {
            expiry = new Date(clientExpiry);
          } else {
            const baseRentRule = await tx.billingRule.findFirst({
              where: {
                type: { in: ["Base Rent", "Base_Rent", "BaseRent", "Rent", "RENT", "BASE_RENT"] },
                rooms: { some: { id: roomId } },
              },
              orderBy: { createdAt: "asc" },
            });
            expiry = calcExpiry(baseRentRule?.frequency ?? "YEARLY", now);
          }
        }

        // Close the old StayHistory entry
        await tx.stayHistory.updateMany({
          where: { tenantId: id, status: "ACTIVE" },
          data: { endDate: now, status: "COMPLETED" },
        });

      } else {
        // ── Fresh assignment (no previous room) ──
        rentStartDate = now;
        newCarriedOverBalance = 0;

        if (clientExpiry) {
          expiry = new Date(clientExpiry);
        } else {
          const baseRentRule = await tx.billingRule.findFirst({
            where: {
              type: { in: ["Base Rent", "Base_Rent", "BaseRent", "Rent", "RENT", "BASE_RENT"] },
              rooms: { some: { id: roomId } },
            },
            orderBy: { createdAt: "asc" },
          });
          expiry = calcExpiry(baseRentRule?.frequency ?? "YEARLY", now);
        }

        // Promote pre-active tenants to ACTIVE
        if (PROMOTABLE_STATUSES.includes(currentStatus)) {
          await tx.user.update({
            where: { id: profile.userId },
            data: { status: "ACTIVE" },
          });
        }
      }

      // Update tenant profile with new room, dates, and carried-over balance
      await tx.tenantProfile.update({
        where: { id },
        data: {
          roomId,
          rentStartDate,
          rentExpiryDate: expiry,
          carriedOverBalance: newCarriedOverBalance,
        },
      });

      // ── Transfer Room Sharers ──
      await tx.tenantProfile.updateMany({
        where: { primaryTenantId: id },
        data: { roomId, rentStartDate, rentExpiryDate: expiry },
      });

      // Mark the new room as OCCUPIED
      await tx.room.update({
        where: { id: roomId },
        data: { status: "OCCUPIED" },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Assign tenant error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
