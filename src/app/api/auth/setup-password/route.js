import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { createRateLimiter, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// 10 attempts per 15 minutes per IP
const limiter = createRateLimiter({ maxAttempts: 10, windowMs: 15 * 60 * 1_000, keyPrefix: "setup-pw" });

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
  const ip = getClientIp(req);
  const { allowed, retryAfterSeconds } = limiter.check(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Please try again in ${retryAfterSeconds} seconds.` },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return new NextResponse("Missing token or password", { status: 400 });
    }

    if (password.length < 6) {
      return new NextResponse("Password must be at least 6 characters", { status: 400 });
    }

    const setupToken = await prisma.setupToken.findUnique({
      where: { token },
    });

    if (!setupToken) {
      return new NextResponse("Invalid token", { status: 400 });
    }

    if (new Date() > setupToken.expires) {
      await prisma.setupToken.delete({ where: { token } });
      return new NextResponse("Token expired", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: setupToken.userId },
        // Stay at AWAITING_PAYMENT — tenant must pay before becoming ACTIVE
        // Only update status if currently PENDING (edge case), otherwise preserve AWAITING_PAYMENT
        data: { hashedPassword }
      }),
      prisma.setupToken.delete({ where: { token } })
    ]);

    // Fetch user details for emails
    const user = await prisma.user.findUnique({
      where: { id: setupToken.userId },
      include: { tenantProfile: { include: { room: { include: { block: true } } } } },
    });

    const roomNumber = user?.tenantProfile?.room?.roomNumber;
    const blockName = user?.tenantProfile?.room?.block?.name;
    const blockAddress = user?.tenantProfile?.room?.block?.address;

    // Notify tenant
    Promise.allSettled([
      createTransporter().sendMail({
        from: `"Covenant Hostel" <${smtpUser}>`,
        to: user.email,
        subject: "Account Activated — Covenant Hostel",
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e2e8f0;border-radius:12px;">
            <h2 style="color:#16a34a;">✅ Account Activated</h2>
            <p>Hi ${user.name},</p>
            <p>Your password has been set and your Covenant Hostel account is now fully active. You can log in to your tenant portal at any time.</p>
            ${roomNumber ? `
            <div style="background:#f0fdf4;padding:16px 20px;border-radius:10px;margin:20px 0;border-left:4px solid #16a34a;">
              <p style="margin:0 0 6px;"><strong>Room:</strong> Room ${roomNumber}</p>
              ${blockName ? `<p style="margin:0 0 6px;"><strong>Block:</strong> ${blockName}</p>` : ""}
              ${blockAddress ? `<p style="margin:0;"><strong>Address:</strong> ${blockAddress}</p>` : ""}
            </div>` : ""}
            <p>Best regards,<br/>The Covenant Hostel Management Team</p>
          </div>
        `,
      }),
      // Notify admin
      process.env.ADMIN_EMAIL ? createTransporter().sendMail({
        from: `"Covenant Hostel" <${smtpUser}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `Account Activated — ${user.name}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e2e8f0;border-radius:12px;">
            <h3 style="color:#0b69ff;">Tenant Account Activated</h3>
            <p>A tenant has set their password and activated their account.</p>
            <table style="width:100%;border-collapse:collapse;margin-top:12px;">
              <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Name</td><td style="padding:8px 0;font-weight:bold;">${user.name}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Email</td><td style="padding:8px 0;font-weight:bold;">${user.email}</td></tr>
              ${roomNumber ? `<tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Room</td><td style="padding:8px 0;font-weight:bold;">Room ${roomNumber}</td></tr>` : ""}
              ${blockName ? `<tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Block</td><td style="padding:8px 0;font-weight:bold;">${blockName}</td></tr>` : ""}
              ${blockAddress ? `<tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Address</td><td style="padding:8px 0;font-weight:bold;">${blockAddress}</td></tr>` : ""}
            </table>
            <p style="margin-top:16px;color:#94a3b8;font-size:12px;">Covenant Hostel Management System</p>
          </div>
        `,
      }) : Promise.resolve(),
    ]).catch(console.error);

    return NextResponse.json({ success: true, message: "Password set and account activated." });

  } catch (error) {
    console.error("SETUP_PASSWORD_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
