import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/whatsapp/unread-count
 * Returns total unread inbound message count across all conversations.
 * Used for nav badge in the sidebar.
 */
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || !["LANDLORD", "ADMIN"].includes(session.user.role)) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const result = await prisma.whatsAppConversation.aggregate({
      _sum: { unreadCount: true },
    });

    return NextResponse.json({ count: result._sum.unreadCount || 0 });
  } catch (error) {
    // Table might not exist yet before db push
    return NextResponse.json({ count: 0 });
  }
}
