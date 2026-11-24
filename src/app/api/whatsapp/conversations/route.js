import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/whatsapp/conversations
 * Returns all conversations ordered by most recent message.
 * Optional query: ?id=conversationId to get a single conversation with its messages.
 */
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || !["LANDLORD", "ADMIN"].includes(session.user.role)) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  try {
    // Single conversation with messages
    if (id) {
      const conversation = await prisma.whatsAppConversation.findUnique({
        where: { id },
        include: {
          tenant: { include: { user: true } },
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!conversation) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }

      // Mark all inbound messages as read
      await prisma.whatsAppMessage.updateMany({
        where: { conversationId: id, direction: "INBOUND", read: false },
        data: { read: true },
      });

      // Reset unread count
      await prisma.whatsAppConversation.update({
        where: { id },
        data: { unreadCount: 0 },
      });

      return NextResponse.json(conversation);
    }

    // All conversations list
    const conversations = await prisma.whatsAppConversation.findMany({
      orderBy: { lastMessageAt: "desc" },
      include: {
        tenant: { include: { user: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // only latest message for preview
        },
      },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("[Conversations] Fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PATCH /api/whatsapp/conversations
 * Update conversation status (OPEN / RESOLVED).
 * Body: { id, status }
 */
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session || !["LANDLORD", "ADMIN"].includes(session.user.role)) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const { id, status } = await req.json();

    if (!id || !["OPEN", "RESOLVED"].includes(status)) {
      return NextResponse.json({ error: "id and valid status required" }, { status: 400 });
    }

    const updated = await prisma.whatsAppConversation.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Conversations] Update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
