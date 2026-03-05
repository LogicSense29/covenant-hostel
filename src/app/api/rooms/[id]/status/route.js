import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return new NextResponse("Missing status", { status: 400 });
    }

    if (status === "AVAILABLE") {
      await prisma.$transaction(async (tx) => {
        await tx.room.update({
          where: { id },
          data: { status }
        });

        const tenantProfile = await tx.tenantProfile.findUnique({
          where: { roomId: id }
        });

        if (tenantProfile) {
          await tx.tenantProfile.update({
            where: { id: tenantProfile.id },
            data: { roomId: null, rentStartDate: null, rentExpiryDate: null }
          });
        }
      });
    } else {
      await prisma.room.update({
        where: { id },
        data: { status }
      });
    }

    return new NextResponse("Status updated", { status: 200 });
  } catch (error) {
    console.error("Update room status error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
