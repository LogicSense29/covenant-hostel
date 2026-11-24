import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MessagesClient from "./MessagesClient";

export const dynamic = "force-dynamic";

export default async function MessagesPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session || !["LANDLORD", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  const { id } = await searchParams;

  // Fetch all conversations for sidebar list
  let conversations = [];
  let activeConversation = null;

  try {
    conversations = await prisma.whatsAppConversation.findMany({
      orderBy: { lastMessageAt: "desc" },
      include: {
        tenant: { include: { user: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    // If a specific conversation is requested, load it with all messages
    if (id) {
      activeConversation = await prisma.whatsAppConversation.findUnique({
        where: { id },
        include: {
          tenant: { include: { user: true } },
          messages: { orderBy: { createdAt: "asc" } },
        },
      });

      // Mark inbound messages as read
      if (activeConversation) {
        await prisma.whatsAppMessage.updateMany({
          where: { conversationId: id, direction: "INBOUND", read: false },
          data: { read: true },
        });
        await prisma.whatsAppConversation.update({
          where: { id },
          data: { unreadCount: 0 },
        });
        // Reflect cleared unread in the list too
        conversations = conversations.map(c =>
          c.id === id ? { ...c, unreadCount: 0 } : c
        );
      }
    }
  } catch {
    // Tables may not exist yet before db push — render empty state
  }

  return (
    <MessagesClient
      conversations={conversations}
      activeConversation={activeConversation}
    />
  );
}
