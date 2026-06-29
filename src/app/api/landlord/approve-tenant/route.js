import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendAccountApprovedEmail } from "@/lib/email";

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
      include: { 
        tenantProfile: {
          include: { 
            primaryTenant: {
              include: { user: true }
            }
          }
        } 
      }
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    if (user.status !== "PENDING" && user.status !== "AWAITING_PAYMENT") {
      return new NextResponse("User is not in PENDING or AWAITING_PAYMENT status", { status: 400 });
    }

    // Generate secure token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const now = new Date();
    
    // Check if they are a sharer and their primary is already ACTIVE
    const isSharerWithActivePrimary = user.tenantProfile?.primaryTenant?.user?.status === "ACTIVE";
    const newStatus = isSharerWithActivePrimary ? "ACTIVE" : "AWAITING_PAYMENT";

    await prisma.$transaction(async (tx) => {
      // 1. Update user status
      await tx.user.update({
        where: { id: userId },
        data: { status: newStatus }
      });

      // 2. Setup token for password
      await tx.setupToken.upsert({
        where: { userId: userId },
        update: { token, expires },
        create: { userId, token, expires }
      });

      // 3. If auto-activating a sharer, also set their dates and stay history
      if (isSharerWithActivePrimary) {
        const primaryProfile = user.tenantProfile.primaryTenant;
        
        await tx.tenantProfile.update({
          where: { id: user.tenantProfile.id },
          data: {
            roomId: primaryProfile.roomId,
            rentStartDate: now,
            rentExpiryDate: primaryProfile.rentExpiryDate,
          }
        });

        if (primaryProfile.roomId) {
          await tx.stayHistory.create({
            data: {
              tenantId: user.tenantProfile.id,
              roomId: primaryProfile.roomId,
              startDate: now,
              status: "ACTIVE"
            }
          });
        }
      }
    });

    // Derive base URL from request headers so it works in both dev and production
    const host = req.headers.get("host");
    const protocol = req.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
    const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`;
    const setupLink = `${baseUrl}/setup-password/${token}`;

    await sendAccountApprovedEmail({
      email: user.email,
      name: user.name,
      setupLink
    });

    return NextResponse.json({ 
      success: true, 
      message: isSharerWithActivePrimary 
        ? "User approved and automatically activated (Primary is active). Email sent." 
        : "User approved and email sent." 
    });

  } catch (error) {
    console.error("APPROVE_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
