import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/sms";

export const dynamic = "force-dynamic";

/**
 * POST /api/whatsapp/webhook
 * Twilio posts here when a WhatsApp message is received.
 * Configure in Twilio Console → Phone Numbers → WhatsApp → "When a message comes in"
 * URL: https://yoursite.com/api/whatsapp/webhook
 */
export async function POST(req) {
  try {
    // Twilio sends form-encoded data
    const text = await req.text();
    const params = new URLSearchParams(text);

    const from = params.get("From");       // e.g. "whatsapp:+2348012345678"
    const body = params.get("Body") || "";
    const profileName = params.get("ProfileName") || null; // sender's WhatsApp display name
    const messageSid = params.get("MessageSid") || null;

    if (!from || !body.trim()) {
      return new NextResponse("OK", { status: 200 });
    }

    // Strip the "whatsapp:" prefix to get the raw phone number
    const phone = from.replace("whatsapp:", "").trim();

    // Try to match to a known tenant by phone number
    const tenantProfile = await prisma.tenantProfile.findFirst({
      where: { phone },
      include: { user: true },
    });

    const displayName = tenantProfile?.user?.name || profileName || phone;

    // Upsert conversation — one conversation per phone number
    const conversation = await prisma.whatsAppConversation.upsert({
      where: { phone },
      update: {
        lastMessageAt: new Date(),
        status: "OPEN",
        unreadCount: { increment: 1 },
        // Update tenant link if it wasn't set before but is now matchable
        ...(tenantProfile && { tenantId: tenantProfile.id }),
        ...(displayName && { displayName }),
      },
      create: {
        phone,
        displayName,
        tenantId: tenantProfile?.id || null,
        status: "OPEN",
        unreadCount: 1,
        lastMessageAt: new Date(),
      },
    });

    // Save inbound message
    await prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        body: body.trim(),
        direction: "INBOUND",
        twilioSid: messageSid,
        read: false,
      },
    });

    // Notify management — email + SMS (non-blocking, non-fatal)
    notifyManagement({ phone, displayName, body: body.trim(), conversationId: conversation.id })
      .catch(err => console.error("[Webhook] Management notification failed:", err));

    // Twilio expects a 200 with empty TwiML body (or we can send an auto-reply later)
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      }
    );
  } catch (error) {
    console.error("[Webhook] WhatsApp inbound error:", error);
    // Always return 200 to Twilio — otherwise it retries repeatedly
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { status: 200, headers: { "Content-Type": "text/xml" } }
    );
  }
}

async function notifyManagement({ phone, displayName, body, conversationId }) {
  const managementEmail = process.env.MANAGEMENT_EMAIL;
  const managementPhone = process.env.MANAGEMENT_PHONE;
  const appUrl = process.env.NEXTAUTH_URL || "https://covenant-hostel.vercel.app";
  const inboxUrl = `${appUrl}/landlord/messages?id=${conversationId}`;

  // Email notification
  if (managementEmail) {
    try {
      const nodemailer = (await import("nodemailer")).default;
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT || 465),
        secure: Number(process.env.SMTP_PORT || 465) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      await transporter.sendMail({
        from: `"Covenant Hostel" <${process.env.SMTP_USER}>`,
        to: managementEmail,
        subject: `New WhatsApp Message from ${displayName}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e2e8f0;border-radius:12px;">
            <h2 style="color:#0b69ff;margin:0 0 16px;">New WhatsApp Message</h2>
            <div style="background:#f0f7ff;padding:16px;border-radius:10px;border-left:4px solid #0b69ff;margin-bottom:16px;">
              <p style="margin:0 0 6px;"><strong>From:</strong> ${displayName}</p>
              <p style="margin:0 0 6px;"><strong>Phone:</strong> ${phone}</p>
              <p style="margin:0;"><strong>Message:</strong> ${body}</p>
            </div>
            <a href="${inboxUrl}" style="display:inline-block;padding:12px 24px;background:#0b69ff;color:white;border-radius:8px;text-decoration:none;font-weight:bold;">
              Reply in Dashboard
            </a>
            <p style="margin-top:16px;color:#94a3b8;font-size:12px;">Covenant Hostel Management System</p>
          </div>
        `,
      });
    } catch (err) {
      console.error("[Webhook] Email notification failed:", err);
    }
  }

  // SMS notification
  if (managementPhone) {
    const smsBody = `New WhatsApp from ${displayName} (${phone}): "${body.substring(0, 100)}${body.length > 100 ? "..." : ""}" — Reply: ${inboxUrl}`;
    await sendSMS({ to: managementPhone, body: smsBody });
  }
}
