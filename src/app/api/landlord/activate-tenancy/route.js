import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "LANDLORD")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenantProfile: true }
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    if (user.status !== "PAYMENT_MADE") {
      return new NextResponse("Tenancy can only be activated after payment is made", { status: 400 });
    }

    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { status: "ACTIVE" }
      }),
      prisma.tenantProfile.update({
        where: { userId: userId },
        data: { 
          rentStartDate: now,
          rentExpiryDate: expiryDate
        }
      }),
      prisma.stayHistory.create({
        data: {
          tenantId: user.tenantProfile.id,
          roomId: user.tenantProfile.roomId,
          startDate: now,
          status: "ACTIVE"
        }
      })
    ]);

    return NextResponse.json({ success: true, message: "Tenancy activated successfully." });

  } catch (error) {
    console.error("ACTIVATE_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
