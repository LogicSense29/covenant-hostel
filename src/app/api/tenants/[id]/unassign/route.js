import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const { id } = await params;
    
    // Parse force flag from body (if present)
    let force = false;
    try {
      const body = await req.json();
      force = !!body.force;
    } catch (e) {
      // Body might be empty
    }

    const now = new Date();

    // Fetch the tenant being unassigned, plus any sharers linked to them
    const tenant = await prisma.tenantProfile.findUnique({
      where: { id },
      include: {
        user: true,
        roomSharers: {
          include: { user: true },
          orderBy: { createdAt: "asc" } // Oldest sharer first
        },
      },
    });

    if (!tenant || !tenant.roomId) {
      return new NextResponse("Tenant is not assigned to a room", { status: 400 });
    }

    // ── Outstanding Payment Check ──
    if (!force) {
      const unpaidCharges = await prisma.recurringCharge.findFirst({
        where: { tenantId: id, status: { in: ["UNPAID", "OVERDUE"] } }
      });
      if (unpaidCharges) {
        return new NextResponse("Tenant has outstanding recurring charges. Force eviction required.", { status: 400 });
      }

      // If they are EXPIRED or AWAITING_PAYMENT, they owe rent.
      if (tenant.user?.status === "EXPIRED" || tenant.user?.status === "AWAITING_PAYMENT") {
         return new NextResponse("Tenant owes rent. Force eviction required.", { status: 400 });
      }
    }

    const roomId = tenant.roomId;

    await prisma.$transaction(async (tx) => {
      // ── 1. Unassign the primary tenant ──
      await tx.tenantProfile.update({
        where: { id },
        data: { 
          roomId: null, 
          rentStartDate: null, 
          rentExpiryDate: null,
          ...(tenant.primaryTenantId ? { 
            primaryTenantId: null, 
            formerPrimaryTenantIds: { push: tenant.primaryTenantId } 
          } : {})
        },
      });
      
      // Update primary user status if they are ACTIVE or EXPIRED
      if (tenant.user?.status === "ACTIVE" || tenant.user?.status === "EXPIRED") {
        await tx.user.update({
          where: { id: tenant.userId },
          data: { status: "EXPIRED" },
        });
      }

      // Close their StayHistory
      await tx.stayHistory.updateMany({
        where: { tenantId: id, status: "ACTIVE" },
        data: { endDate: now, status: "COMPLETED" },
      });

      // ── 2. Handle sharers & Ledger Migration ──
      // Find the first active sharer to promote
      const activeSharers = tenant.roomSharers.filter(s => s.user?.status === "ACTIVE");
      const promotedSharer = activeSharers.length > 0 ? activeSharers[0] : null;

      if (promotedSharer) {
        // Promote the oldest active sharer to Primary Tenant
        await tx.tenantProfile.update({
          where: { id: promotedSharer.id },
          data: { primaryTenantId: null, formerPrimaryTenantIds: { push: tenant.id } }
        });

        // Migrate the financial ledger (Payments and Recurring Charges) to the new primary
        await tx.payment.updateMany({
          where: { tenantId: id },
          data: { tenantId: promotedSharer.id }
        });

        await tx.recurringCharge.updateMany({
          where: { tenantId: id },
          data: { tenantId: promotedSharer.id }
        });

        // Handle remaining sharers (if any) -> map them to the new primary
        for (const sharer of tenant.roomSharers) {
          if (sharer.id !== promotedSharer.id) {
            if (sharer.user?.status === "ACTIVE") {
              await tx.tenantProfile.update({
                where: { id: sharer.id },
                data: { primaryTenantId: promotedSharer.id }
              });
            } else {
               // Non-active sharers get fully unassigned
               await tx.tenantProfile.update({
                 where: { id: sharer.id },
                 data: { roomId: null, rentStartDate: null, rentExpiryDate: null, primaryTenantId: null, formerPrimaryTenantIds: { push: tenant.id } },
               });
               await tx.stayHistory.updateMany({
                 where: { tenantId: sharer.id, status: "ACTIVE" },
                 data: { endDate: now, status: "COMPLETED" },
               });
            }
          }
        }
      } else {
        // No active sharers to promote. Unassign them all.
        for (const sharer of tenant.roomSharers) {
          await tx.tenantProfile.update({
            where: { id: sharer.id },
            data: { roomId: null, rentStartDate: null, rentExpiryDate: null, primaryTenantId: null, formerPrimaryTenantIds: { push: tenant.id } },
          });
          await tx.stayHistory.updateMany({
            where: { tenantId: sharer.id, status: "ACTIVE" },
            data: { endDate: now, status: "COMPLETED" },
          });
        }
      }

      // ── 3. Re-count remaining ACTIVE occupants after changes ──
      const remainingOccupants = await tx.tenantProfile.count({
        where: { roomId },
      });

      // Only mark room AVAILABLE if truly empty
      if (remainingOccupants === 0) {
        await tx.room.update({
          where: { id: roomId },
          data: { status: "AVAILABLE" },
        });
      }
    });

    return new NextResponse("Tenant unassigned successfully", { status: 200 });
  } catch (error) {
    console.error("Unassign tenant error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
