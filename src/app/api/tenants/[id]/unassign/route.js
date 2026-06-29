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
    const now = new Date();

    // Fetch the tenant being unassigned, plus any sharers linked to them
    const tenant = await prisma.tenantProfile.findUnique({
      where: { id },
      include: {
        user: true,
        roomSharers: {
          include: { user: true },
        },
      },
    });

    if (!tenant || !tenant.roomId) {
      return new NextResponse("Tenant is not assigned to a room", { status: 400 });
    }

    const roomId = tenant.roomId;

    await prisma.$transaction(async (tx) => {
      // ── 1. Unassign the primary tenant ──
      await tx.tenantProfile.update({
        where: { id },
        data: { roomId: null, rentStartDate: null, rentExpiryDate: null },
      });

      // Close their StayHistory
      await tx.stayHistory.updateMany({
        where: { tenantId: id, status: "ACTIVE" },
        data: { endDate: now, status: "COMPLETED" },
      });

      // ── 2. Handle sharers ──
      for (const sharer of tenant.roomSharers) {
        const sharerStatus = sharer.user?.status;
        const isActiveSharer = sharerStatus === "ACTIVE";

        if (isActiveSharer) {
          // Active sharers: stay in the room — just clear their primary link
          // They become independent tenants in the same room
          await tx.tenantProfile.update({
            where: { id: sharer.id },
            data: { primaryTenantId: null },
          });
        } else {
          // Non-active sharers (AWAITING_PAYMENT, PAYMENT_MADE, APPROVED, etc.):
          // They shouldn't be in a room without a primary. Unassign them too.
          await tx.tenantProfile.update({
            where: { id: sharer.id },
            data: {
              roomId: null,
              rentStartDate: null,
              rentExpiryDate: null,
              primaryTenantId: null,
            },
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
