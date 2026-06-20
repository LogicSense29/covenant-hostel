import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendAccountRejectedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "LANDLORD")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { userId, reason } = body;

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

    if (user.status !== "PENDING") {
      return new NextResponse("Only pending applications can be rejected", { status: 400 });
    }

    // Delete the user (and cascade delete the tenant profile) so their email and phone are freed up for re-registration
    await prisma.user.delete({
      where: { id: userId }
    });

    await sendAccountRejectedEmail({
      email: user.email,
      name: user.name,
      reason: reason || "No detailed reason provided."
    });

    return NextResponse.json({ success: true, message: "Application rejected, user removed, and email sent." });

  } catch (error) {
    console.error("REJECT_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
