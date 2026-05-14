import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST — mark one or all notifications as read
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json().catch(() => ({}));

  if (id) {
    // Mark single notification read (only if it belongs to this user)
    await prisma.notification.updateMany({
      where: { id, userId: session.user.id },
      data: { read: true },
    });
  } else {
    // Mark all read
    await prisma.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true },
    });
  }

  return NextResponse.json({ success: true });
}
