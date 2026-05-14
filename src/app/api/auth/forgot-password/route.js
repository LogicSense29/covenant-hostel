import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import crypto from "crypto";

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
  try {
    const { email } = await req.json();

    if (!email) {
      return new NextResponse("Email is required", { status: 400 });
    }

    // Always return 200 — never reveal whether the email exists
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.hashedPassword) {
      // No account or account hasn't set a password yet — silently succeed
      return NextResponse.json({ success: true });
    }

    // Generate a secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Upsert into SetupToken table (reuse existing table)
    await prisma.setupToken.upsert({
      where: { userId: user.id },
      update: { token, expires },
      create: { userId: user.id, token, expires },
    });

    // Build reset URL
    const host = req.headers.get("host");
    const protocol =
      req.headers.get("x-forwarded-proto") ||
      (host?.includes("localhost") ? "http" : "https");
    const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`;
    const resetLink = `${baseUrl}/reset-password/${token}`;

    // Send email
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"Covenant Hostel" <${smtpUser}>`,
      to: email,
      subject: "Reset Your Password — Covenant Hostel",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0b69ff;">Password Reset Request</h2>
          <p>Hi ${user.name || "there"},</p>
          <p>We received a request to reset your password for your Covenant Hostel account. Click the button below to set a new password.</p>
          <div style="margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #0b69ff; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
              Reset My Password
            </a>
          </div>
          <p style="font-size: 13px; color: #64748b;">This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.</p>
          <p style="font-size: 12px; color: #94a3b8;">If the button doesn't work, copy and paste this link:<br/>${resetLink}</p>
          <p>Best regards,<br/>The Covenant Hostel Management Team</p>
        </div>
      `,
    });

    if (smtpHost === "smtp.ethereal.email") {
      console.log("Password reset email preview:", nodemailer.getTestMessageUrl(info));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FORGOT_PASSWORD_ERROR", error);
    // Still return 200 to avoid leaking info
    return NextResponse.json({ success: true });
  }
}
