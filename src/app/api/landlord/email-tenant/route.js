import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendAccountApprovedEmail, sendRentExpiryReminder } from "@/lib/email";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

const smtpHost = process.env.SMTP_HOST || "smtp.ethereal.email";
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER || "ethereal.user@ethereal.email";
const smtpPass = process.env.SMTP_PASS || "ethereal_password";

function createTransporter() {
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const { userId, type, subject, message } = await req.json();

  if (!userId || !type) {
    return new NextResponse("Missing required fields", { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { tenantProfile: { include: { room: true } } },
  });

  if (!user) return new NextResponse("User not found", { status: 404 });

  const profile = user.tenantProfile;
  const email = user.email;
  const name = user.name;

  try {
    if (type === "resend_approval") {
      // Generate a fresh token
      const token =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      const expires = new Date(Date.now() + 48 * 60 * 60 * 1000);

      await prisma.setupToken.upsert({
        where: { userId },
        update: { token, expires },
        create: { userId, token, expires },
      });

      const host = req.headers.get("host");
      const protocol =
        req.headers.get("x-forwarded-proto") ||
        (host?.includes("localhost") ? "http" : "https");
      const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`;
      const setupLink = `${baseUrl}/setup-password/${token}`;

      await sendAccountApprovedEmail({ email, name, setupLink });
      return NextResponse.json({ success: true, message: "Approval email resent." });
    }

    if (type === "payment_reminder") {
      const transporter = createTransporter();

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
            <p>If you have already made a payment, please disregard this message or contact management to confirm your status.</p>
            <p>Best regards,<br/>The Covenant Hostel Management Team</p>
          </div>
        `,
      });
      return NextResponse.json({ success: true, message: "Payment reminder sent." });
    }

    if (type === "rent_expiry") {
      if (!profile?.room || !profile?.rentExpiryDate) {
        return new NextResponse("Tenant has no room or expiry date set", { status: 400 });
      }
      const daysLeft = Math.ceil(
        (new Date(profile.rentExpiryDate) - new Date()) / (1000 * 60 * 60 * 24)
      );
      await sendRentExpiryReminder({
        email,
        name,
        roomNumber: profile.room.roomNumber,
        expiryDate: profile.rentExpiryDate,
        daysLeft: Math.max(daysLeft, 0),
      });
      return NextResponse.json({ success: true, message: "Rent expiry reminder sent." });
    }

    if (type === "custom") {
      if (!subject?.trim() || !message?.trim()) {
        return new NextResponse("Subject and message are required", { status: 400 });
      }
      const transporter = createTransporter();

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
      return NextResponse.json({ success: true, message: "Email sent successfully." });
    }

    return new NextResponse("Unknown email type", { status: 400 });
  } catch (err) {
    console.error("Email tenant error:", err);
    return new NextResponse("Failed to send email", { status: 500 });
  }
}
