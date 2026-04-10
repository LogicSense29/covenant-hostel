import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { name, phone } = await req.json();

    await prisma.$transaction(async (tx) => {
      if (name) {
        await tx.user.update({
          where: { id: session.user.id },
          data: { name },
        });
      }
      if (phone) {
        await tx.tenantProfile.update({
          where: { userId: session.user.id },
          data: { phone },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Profile update error:", err);
    if (err.code === "P2002") {
      return new NextResponse("Phone number already in use", { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
