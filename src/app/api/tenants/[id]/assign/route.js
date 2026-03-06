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

    await prisma.$transaction(async (tx) => {
      // Assign new tenant
      const now = new Date();
      let expiry = new Date();
      expiry.setFullYear(now.getFullYear() + 1);

      if (rentExpiryDate) {
        expiry = new Date(rentExpiryDate);
      }

      await tx.tenantProfile.update({
        where: { id },
        data: { 
          roomId,
          rentStartDate: now,
          rentExpiryDate: expiry
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
