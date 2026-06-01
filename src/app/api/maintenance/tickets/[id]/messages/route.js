import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification, getLandlordUserIds } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id: ticketId } = await params;
    if (!ticketId) {
      return NextResponse.json({ error: "Missing ticket ID" }, { status: 400 });
    }

    const messages = await prisma.ticketMessage.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id: ticketId } = await params;
    if (!ticketId) {
      return NextResponse.json({ error: "Missing ticket ID" }, { status: 400 });
    }

    const data = await request.json();
    const { senderId, senderRole, content, imageUrl } = data;

    if (!senderId || !senderRole || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ticket = await prisma.maintenanceTicket.findUnique({
      where: { id: ticketId },
      include: {
        tenant: { include: { user: true } },
        provider: { include: { user: true } },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const message = await prisma.ticketMessage.create({
      data: { ticketId, senderId, senderRole, content, imageUrl }
    });

    // Notify the other party
    const snippet = content.length > 50 ? `${content.slice(0, 50)}...` : content;

    if (senderRole === "TENANT") {
      const landlordIds = await getLandlordUserIds();
      const recipients = [...landlordIds];
      if (ticket.provider?.userId) recipients.push(ticket.provider.userId);
      const uniqueRecipients = [...new Set(recipients)].filter(id => id !== senderId);
      if (uniqueRecipients.length > 0) {
        await createNotification({
          userIds: uniqueRecipients,
          title: "New Ticket Message",
          message: `${ticket.tenant.user.name}: "${snippet}"`,
          type: "MAINTENANCE",
          link: "/landlord/maintenance",
        });
      }
    } else {
      await createNotification({
        userId: ticket.tenant.userId,
        title: "New Message on Ticket",
        message: `Admin/Provider: "${snippet}"`,
        type: "MAINTENANCE",
        link: "/tenant/maintenance",
      });
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
