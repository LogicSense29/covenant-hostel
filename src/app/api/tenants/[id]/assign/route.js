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
    const body = await req.json();
    const { roomId } = body;

    if (!roomId) {
      return new NextResponse("Missing roomId", { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // Unassign current tenant if the room is somehow already occupied
      const existingTenant = await tx.tenantProfile.findUnique({
        where: { roomId }
      });

      if (existingTenant) {
        await tx.tenantProfile.update({
          where: { id: existingTenant.id },
          data: { roomId: null, rentStartDate: null, rentExpiryDate: null }
        });
      }

      // Assign new tenant
      // We also set rent start date to now, and expiry to 1 year from now just for demo setup.
      // A more robust system would ask for duration.
      const now = new Date();
      const nextYear = new Date();
      nextYear.setFullYear(now.getFullYear() + 1);

      await tx.tenantProfile.update({
        where: { id },
        data: { 
          roomId,
          rentStartDate: now,
          rentExpiryDate: nextYear
        }
      });

      // Update room status
      await tx.room.update({
        where: { id: roomId },
        data: { status: "OCCUPIED" }
      });
    });

    return new NextResponse("Tenant assigned", { status: 200 });
  } catch (error) {
    console.error("Assign tenant error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
