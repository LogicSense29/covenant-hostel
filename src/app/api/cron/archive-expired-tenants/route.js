import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Cron job: Auto-archive tenants who have been EXPIRED for 30+ days.
 * Runs daily via Vercel Cron or external scheduler.
 * 
 * Endpoint: GET /api/cron/archive-expired-tenants
 * Auth: Bearer token via CRON_SECRET env var
 */
export async function GET(req) {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  
  if (!process.env.CRON_SECRET?.trim() || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find tenants whose rentExpiryDate passed 30+ days ago and status is EXPIRED
    const expiredTenants = await prisma.tenantProfile.findMany({
      where: {
        rentExpiryDate: {
          lte: thirtyDaysAgo,
        },
        user: {
          status: "EXPIRED",
        },
      },
      include: { user: true },
    });

    // Find tenants stuck awaiting room assignment for 30+ days (no room, no active rent)
    const stuckTenants = await prisma.tenantProfile.findMany({
      where: {
        roomId: null,
        createdAt: { lte: thirtyDaysAgo },
        archivedAt: null,
        user: {
          status: { in: ["AWAITING_PAYMENT", "PENDING", "PAYMENT_MADE"] },
        },
      },
      include: { user: true },
    });

    const allToArchive = [...expiredTenants, ...stuckTenants];

    let archivedCount = 0;

    for (const tenant of allToArchive) {
      await prisma.$transaction(async (tx) => {
        // Update user status to ARCHIVED
        await tx.user.update({
          where: { id: tenant.userId },
          data: { status: "ARCHIVED" },
        });

        // Stamp archivedAt timestamp
        await tx.tenantProfile.update({
          where: { id: tenant.id },
          data: { archivedAt: now },
        });

        // Notify the tenant
        await createNotification({
          userId: tenant.userId,
          title: "Tenancy Archived",
          message: "Your tenancy has been archived due to extended expiry. Contact management to renew.",
          type: "SYSTEM",
        });
      });

      archivedCount++;
    }

    console.log(`[Cron] Archived ${archivedCount} expired tenants.`);

    return NextResponse.json({
      success: true,
      message: `Archived ${archivedCount} tenant(s).`,
      archivedCount,
    });
  } catch (error) {
    console.error("[Cron] Archive expired tenants error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
