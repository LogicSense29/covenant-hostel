import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const smtpHost = process.env.SMTP_HOST || "smtp.ethereal.email";
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";

function createTransporter() {
  return nodemailer.createTransport({
    host: smtpHost, port: smtpPort, secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });
}

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const cutoff72h = new Date(Date.now() - 72 * 60 * 60 * 1000);

    // Drafts older than 24h but not yet reminded (updatedAt between 72h and 24h ago)
    const pendingDrafts = await prisma.registrationDraft.findMany({
      where: {
        updatedAt: { lte: cutoff24h, gte: cutoff72h },
      },
    });

    // Check master WhatsApp toggle from DB
    const whatsappSetting = await prisma.systemSetting.findUnique({
      where: { key: "WHATSAPP_REMINDERS_ENABLED" },
    });
    const whatsappEnabled = whatsappSetting?.value === "true";

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    let sent = 0;

    for (const draft of pendingDrafts) {
      try {
        const resumeUrl = `${baseUrl}/register?resume=${encodeURIComponent(draft.email)}`;
        const data = draft.data || {};
        const name = data.name || "there";

        await createTransporter().sendMail({
          from: `"Covenant Hostel" <${smtpUser}>`,
          to: draft.email,
          subject: "Complete Your Application — Covenant Hostel",
          html: `
            <div style="font-family:sans-serif;max-width:580px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;">
              <h2 style="color:#0b69ff;margin-top:0;">You left something behind 👋</h2>
              <p>Hi ${name},</p>
              <p>You started an application for Covenant Hostel but didn't quite finish. Your progress has been saved — pick up right where you left off.</p>
              <div style="margin:24px 0;">
                <a href="${resumeUrl}" style="background:#0b69ff;color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block;">
                  Continue My Application
                </a>
              </div>
              <p style="font-size:12px;color:#94a3b8;">This link takes you back to your saved form. Available rooms may change — complete your application soon to secure your spot.</p>
              <p>Best regards,<br/>Covenant Hostel Management</p>
            </div>
          `,
        });

        // WhatsApp Reminder
        if (whatsappEnabled && data.phone) {
          try {
            await sendWhatsAppMessage({
              to: data.phone,
              body: `👋 Hi ${name}, you started an application for Covenant Hostel but didn't finish. Pick up right where you left off: ${resumeUrl}`
            });
          } catch (waError) {
            console.error(`WhatsApp reminder failed for ${data.phone}:`, waError.message);
          }
        }

        sent++;
      } catch (e) {
        console.error(`Reminder failed for ${draft.email}:`, e.message);
      }
    }

    // Clean up very old drafts (older than 7 days — abandoned)
    const cutoff7days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await prisma.registrationDraft.deleteMany({ where: { updatedAt: { lt: cutoff7days } } });

    return NextResponse.json({ success: true, reminded: sent });
  } catch (error) {
    console.error("Registration reminder cron error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
