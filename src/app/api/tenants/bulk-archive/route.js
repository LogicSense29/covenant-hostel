import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * POST /api/tenants/bulk-archive
 * Archive multiple tenants at once (landlord/admin only)
 */
export async function POST(req) {
  const session = await getServerSession(authOptions);
  
  if (!session || !["LANDLORD", "ADMIN"].includes(session.user.role)) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const { tenantIds } = await req.json();

    if (!tenantIds || !Array.isArray(tenantIds) || tenantIds.length === 0) {
      return new NextResponse("tenantIds array is required", { status: 400 });
    }

    const now = new Date();
    let archivedCount = 0;

    // Process each tenant
    for (const tenantId of tenantIds) {
      try {
        const tenant = await prisma.tenantProfile.findUnique({
          where: { id: tenantId },
          include: { user: true },
        });

        if (!tenant || tenant.user.status === "ARCHIVED") {
          continue; // Skip if not found or already archived
        }

        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: tenant.userId },
            data: { status: "ARCHIVED" },
          });

          await tx.tenantProfile.update({
            where: { id: tenantId },
            data: { archivedAt: now },
          });

          await createNotification({
            userId: tenant.userId,
            title: "Tenancy Archived",
            message: "Your tenancy has been archived by management. Contact the office for details.",
            type: "SYSTEM",
          });
        });

        archivedCount++;
      } catch (err) {
        console.error(`Failed to archive tenant ${tenantId}:`, err);
        // Continue with other tenants
      }
    }

    return NextResponse.json({
      success: true,
      message: `Archived ${archivedCount} tenant(s)`,
      archivedCount,
    });
  } catch (error) {
    console.error("Bulk archive error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
