import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/**
 * POST /api/whatsapp/reply
 * Landlord sends a reply to a conversation from the dashboard.
 * Body: { conversationId, message }
 */
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !["LANDLORD", "ADMIN"].includes(session.user.role)) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const { conversationId, message } = await req.json();

    if (!conversationId || !message?.trim()) {
      return NextResponse.json({ error: "conversationId and message are required" }, { status: 400 });
    }

    const conversation = await prisma.whatsAppConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Send via Twilio (raw text — no template required for outbound replies in 24h window)
    const sent = await sendWhatsAppMessage({
      to: conversation.phone,
      body: message.trim(),
    });

    if (!sent) {
      return NextResponse.json(
        { error: "Failed to send WhatsApp message. Check Twilio configuration." },
        { status: 502 }
      );
    }

    // Save outbound message to DB
    const saved = await prisma.whatsAppMessage.create({
      data: {
        conversationId,
        body: message.trim(),
        direction: "OUTBOUND",
        read: true, // outbound messages are always "read"
      },
    });

    // Update conversation timestamp
    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json({ success: true, message: saved });
  } catch (error) {
    console.error("[Reply] WhatsApp reply error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
