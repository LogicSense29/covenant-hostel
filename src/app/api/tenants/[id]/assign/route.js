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
    const { roomId, rentExpiryDate: clientExpiry } = body;

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

      if (isRoomChange) {
        // ── Room change: tenant already has a paid cycle — preserve it ──
        rentStartDate = profile.rentStartDate;
        expiry        = profile.rentExpiryDate;

        // Close the old StayHistory entry
        await tx.stayHistory.updateMany({
          where: { tenantId: id, status: "ACTIVE" },
          data: { endDate: now, status: "COMPLETED" },
        });
      } else {
        // ── Fresh assignment ──
        rentStartDate = now;

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

        // Promote pre-active tenants to ACTIVE so the directory shows their room correctly.
        // PENDING and REJECTED are never promoted here — they need to go through the proper flow.
        if (PROMOTABLE_STATUSES.includes(currentStatus)) {
          await tx.user.update({
            where: { id: profile.userId },
            data: { status: "ACTIVE" },
          });
        }
      }

      // Update the tenant profile with the new room and dates
      await tx.tenantProfile.update({
        where: { id },
        data: { roomId, rentStartDate, rentExpiryDate: expiry },
      });

      // ── Transfer Room Sharers ──
      // Automatically move all linked room sharers to the new room
      // and sync their lease dates with the primary tenant
      await tx.tenantProfile.updateMany({
        where: { primaryTenantId: id },
        data: { roomId, rentStartDate, rentExpiryDate: expiry },
      });

      // Mark the room as OCCUPIED
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
