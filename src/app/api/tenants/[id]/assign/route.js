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
    const { roomId, rentExpiryDate } = body;

    if (!roomId) {
      return new NextResponse("Missing roomId", { status: 400 });
    }

    const now = new Date();
    const expiry = new Date(rentExpiryDate);

    await prisma.$transaction(async (tx) => {
      // Check if tenant is already active
      const profile = await tx.tenantProfile.findUnique({
        where: { id },
        include: { user: true }
      });

      if (!profile) {
        throw new Error("Tenant profile not found");
      }

      // Close previous StayHistory if moving
      if (profile.roomId) {
        await tx.stayHistory.updateMany({
          where: { 
            tenantId: id,
            status: "ACTIVE"
          },
          data: {
            endDate: now,
            status: "COMPLETED"
          }
        });
      }

      await tx.tenantProfile.update({
        where: { id },
        data: { 
          roomId,
          rentStartDate: now,
          rentExpiryDate: expiry
        }
      });

      // Create new StayHistory if they were already active
      if (profile.user.status === "ACTIVE") {
        await tx.stayHistory.create({
          data: {
            tenantId: id,
            roomId,
            startDate: now,
            status: "ACTIVE"
          }
        });
      }

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
