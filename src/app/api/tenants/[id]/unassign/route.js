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
    const { id } = params;

    const tenant = await prisma.tenantProfile.findUnique({
      where: { id }
    });

    if (!tenant || !tenant.roomId) {
      return new NextResponse("Tenant is not assigned to a room", { status: 400 });
    }

    const roomId = tenant.roomId;

    await prisma.$transaction(async (tx) => {
      // Unassign tenant
      await tx.tenantProfile.update({
        where: { id },
        data: { roomId: null, rentStartDate: null, rentExpiryDate: null }
      });

      // Update room status
      await tx.room.update({
        where: { id: roomId },
        data: { status: "AVAILABLE" }
      });
    });

    return new NextResponse("Tenant unassigned", { status: 200 });
  } catch (error) {
    console.error("Unassign tenant error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
