import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

const smtpHost = process.env.SMTP_HOST || "smtp.ethereal.email";
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER || "ethereal.user@ethereal.email";
const smtpPass = process.env.SMTP_PASS || "ethereal_password";

function createTransporter() {
  return nodemailer.createTransport({
    host: smtpHost, port: smtpPort, secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const { userIds, type, subject, message } = await req.json();

  if (!userIds?.length || !type) {
    return new NextResponse("Missing required fields", { status: 400 });
  }

  if (type === "custom" && (!subject?.trim() || !message?.trim())) {
    return new NextResponse("Subject and message are required", { status: 400 });
  }

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    include: { tenantProfile: { include: { room: true } } },
  });

  const transporter = createTransporter();
  const results = { sent: 0, failed: 0, skipped: 0 };

  for (const user of users) {
    const profile = user.tenantProfile;
    const name = user.name;
    const email = user.email;

    try {
      if (type === "payment_reminder") {
        await transporter.sendMail({
          from: `"Covenant Hostel" <${smtpUser}>`,
          to: email,
          subject: "Payment Reminder — Covenant Hostel",
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e2e8f0;border-radius:12px;">
              <h2 style="color:#0b69ff;">Payment Reminder</h2>
              <p>Hi ${name},</p>
              <p>This is a friendly reminder that your rent payment is outstanding. Please log in to your tenant portal to complete your payment at your earliest convenience.</p>
              ${profile?.room ? `<p><strong>Room:</strong> Room ${profile.room.roomNumber}</p>` : ""}
              <p>Best regards,<br/>The Covenant Hostel Management Team</p>
            </div>
          `,
        });
        results.sent++;
      } else if (type === "rent_expiry") {
        if (!profile?.room || !profile?.rentExpiryDate) { results.skipped++; continue; }
        const daysLeft = Math.max(0, Math.ceil(
          (new Date(profile.rentExpiryDate) - new Date()) / (1000 * 60 * 60 * 24)
        ));
        await transporter.sendMail({
          from: `"Covenant Hostel" <${smtpUser}>`,
          to: email,
          subject: `Rent Expiry Reminder - Room ${profile.room.roomNumber}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e2e8f0;border-radius:12px;">
              <h2 style="color:#e11d48;">Rent Expiry Notification</h2>
              <p>Hi ${name},</p>
              <p>Your rent for <strong>Room ${profile.room.roomNumber}</strong> expires in <strong>${daysLeft} days</strong> (${new Date(profile.rentExpiryDate).toLocaleDateString()}).</p>
              <p>Please make arrangements for renewal before the expiry date.</p>
              <p>Best regards,<br/>The Covenant Hostel Management Team</p>
            </div>
          `,
        });
        results.sent++;
      } else if (type === "custom") {
        await transporter.sendMail({
          from: `"Covenant Hostel" <${smtpUser}>`,
          to: email,
          subject,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e2e8f0;border-radius:12px;">
              <p>Hi ${name},</p>
              <div style="white-space:pre-wrap;line-height:1.7;color:#334155;">${message.replace(/\n/g, "<br/>")}</div>
              <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0;"/>
              <p style="color:#94a3b8;font-size:12px;">Covenant Hostel Management Team</p>
            </div>
          `,
        });
        results.sent++;
      }
    } catch (err) {
      console.error(`Failed to send to ${email}:`, err);
      results.failed++;
    }
  }

  return NextResponse.json({
    success: true,
    message: `Sent: ${results.sent}, Failed: ${results.failed}, Skipped: ${results.skipped}`,
    ...results,
  });
}
