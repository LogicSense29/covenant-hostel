import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { crypto } from "crypto";
import { sendAccountApprovedEmail } from "@/lib/email";

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

    if (user.status !== "PENDING") {
      return new NextResponse("User is not in PENDING status", { status: 400 });
    }

    // Generate secure token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { status: "APPROVED" }
      }),
      prisma.setupToken.upsert({
        where: { userId: userId },
        update: {
          token,
          expires
        },
        create: {
          userId,
          token,
          expires
        }
      })
    ]);

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const setupLink = `${baseUrl}/setup-password/${token}`;

    await sendAccountApprovedEmail({
      email: user.email,
      name: user.name,
      setupLink
    });

    return NextResponse.json({ success: true, message: "User approved and email sent." });

  } catch (error) {
    console.error("APPROVE_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
