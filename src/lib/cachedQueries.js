import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * Cached DB queries for heavy pages.
 * Data revalidates every 30 seconds automatically.
 * Call revalidateTag("tenants") / ("payments") etc. after mutations to bust instantly.
 */

export const getCachedRooms = unstable_cache(
  async () => {
    return prisma.room.findMany({
      include: {
        tenants: {
          where: {
            user: { status: { in: ["ACTIVE", "PAYMENT_MADE", "AWAITING_PAYMENT", "PENDING", "EXPIRED"] } }
          }
        },
        block: true,
        billingRules: true,
      },
      orderBy: { roomNumber: "asc" },
    });
  },
  ["rooms-list"],
  { revalidate: 30, tags: ["rooms"] }
);

export const getCachedBlocks = unstable_cache(
  async () => {
    return prisma.block.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { rooms: true } } },
    });
  },
  ["blocks-list"],
  { revalidate: 60, tags: ["blocks"] }
);

export const getCachedDashboardStats = unstable_cache(
  async () => {
    const now = new Date();
    const in7days = new Date(now); in7days.setDate(now.getDate() + 7);
    const in30days = new Date(now); in30days.setDate(now.getDate() + 30);

    const [
      openTickets,
      expiredTenantCount,
      expiringSoon7,
      expiringSoon30,
      roomReservations,
      inspectionRequests,
      rentPayments,
      otherBillingsPayments,
      inspectionPayments,
    ] = await Promise.all([
      prisma.maintenanceTicket.count({ where: { status: "OPEN" } }),
      prisma.tenantProfile.count({ where: { user: { status: "EXPIRED" } } }),
      prisma.tenantProfile.count({ where: { rentExpiryDate: { gte: now, lte: in7days }, user: { status: "ACTIVE" } } }),
      prisma.tenantProfile.count({ where: { rentExpiryDate: { gte: now, lte: in30days }, user: { status: "ACTIVE" } } }),
      prisma.tenantProfile.count({ where: { roomId: { not: null }, user: { status: { in: ["PENDING", "AWAITING_PAYMENT"] } } } }),
      prisma.guestInspection.count({ where: { status: { in: ["PENDING", "CONFIRMED"] } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: { in: ["SUCCESS", "VERIFIED"] }, paymentType: { not: "RECURRING" } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: { in: ["SUCCESS", "VERIFIED"] }, paymentType: "RECURRING" } }),
      prisma.guestInspection.aggregate({ _sum: { amountPaid: true }, where: { feePaid: true } }),
    ]);

    return {
      openTickets,
      expiredTenantCount,
      expiringSoon7,
      expiringSoon30,
      roomReservations,
      inspectionRequests,
      totalRentCollected: rentPayments._sum.amount || 0,
      totalOtherBillings: otherBillingsPayments._sum.amount || 0,
      totalInspectionFees: inspectionPayments._sum.amountPaid || 0,
    };
  },
  ["dashboard-stats"],
  { revalidate: 30, tags: ["dashboard", "payments", "tenants"] }
);

export const getCachedRecentTickets = unstable_cache(
  async () => {
    return prisma.maintenanceTicket.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { tenant: { include: { user: true } } },
    });
  },
  ["recent-tickets"],
  { revalidate: 30, tags: ["tickets"] }
);

export const getCachedPayments = unstable_cache(
  async () => {
    return prisma.payment.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        tenant: {
          include: {
            user: true,
            room: { include: { block: true } },
          },
        },
      },
    });
  },
  ["pending-payments"],
  { revalidate: 30, tags: ["payments"] }
);
