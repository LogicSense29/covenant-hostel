import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { createNotification } from "@/lib/notifications";

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

async function sendTenantActivationEmail({ email, name, roomNumber, rentStartDate, rentExpiryDate }) {
  try {
    await createTransporter().sendMail({
      from: `"Covenant Hostel" <${smtpUser}>`,
      to: email,
      subject: "Your Tenancy is Now Active — Covenant Hostel",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e2e8f0;border-radius:12px;">
          <h2 style="color:#16a34a;">🎉 Tenancy Activated!</h2>
          <p>Hi ${name},</p>
          <p>Your tenancy at Covenant Hostel has been confirmed and is now active. Welcome!</p>
          <div style="background:#f0fdf4;padding:20px;border-radius:10px;margin:20px 0;border-left:4px solid #16a34a;">
            <p style="margin:0 0 8px;"><strong>Room:</strong> Room ${roomNumber}</p>
            <p style="margin:0 0 8px;"><strong>Start Date:</strong> ${new Date(rentStartDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p style="margin:0;"><strong>Expiry Date:</strong> ${new Date(rentExpiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <p>You can now log in to your tenant portal to view your billing, submit maintenance requests, and manage your tenancy.</p>
          <p>Best regards,<br/>The Covenant Hostel Management Team</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Error sending tenant activation email:", err);
  }
}

async function sendAdminActivationAlert({ adminEmail, tenantName, tenantEmail, roomNumber, rentStartDate, rentExpiryDate }) {
  if (!adminEmail) return;
  try {
    await createTransporter().sendMail({
      from: `"Covenant Hostel" <${smtpUser}>`,
      to: adminEmail,
      subject: `Tenancy Activated — ${tenantName} (Room ${roomNumber})`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e2e8f0;border-radius:12px;">
          <h3 style="color:#0b69ff;">Tenancy Activated</h3>
          <p>A tenant's account has been activated.</p>
          <table style="width:100%;border-collapse:collapse;margin-top:12px;">
            <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Tenant</td><td style="padding:8px 0;font-weight:bold;">${tenantName}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Email</td><td style="padding:8px 0;font-weight:bold;">${tenantEmail}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Room</td><td style="padding:8px 0;font-weight:bold;">Room ${roomNumber}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Start Date</td><td style="padding:8px 0;font-weight:bold;">${new Date(rentStartDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Expiry Date</td><td style="padding:8px 0;font-weight:bold;">${new Date(rentExpiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
          </table>
          <p style="margin-top:16px;color:#94a3b8;font-size:12px;">Covenant Hostel Management System</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Error sending admin activation alert:", err);
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "LANDLORD")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenantProfile: { include: { room: true } } }
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    if (user.status !== "PAYMENT_MADE") {
      return new NextResponse("Tenancy can only be activated after payment is made", { status: 400 });
    }

    // Determine rent frequency from billing rules — only rules explicitly connected to this room
    const matchingRules = user.tenantProfile?.roomId ? await prisma.billingRule.findMany({
      where: {
        type: { in: ["Base Rent", "Base_Rent", "BaseRent", "Rent", "RENT", "BASE_RENT"] },
        rooms: { some: { id: user.tenantProfile.roomId } },
      },
    }) : [];

    const rentRule = matchingRules[0] || null;

    const frequency = rentRule?.frequency || "YEARLY";

    const now = new Date();
    const expiryDate = new Date(now);
    
    switch (frequency) {
      case "DAILY":
        expiryDate.setDate(expiryDate.getDate() + 1);
        break;
      case "MONTHLY":
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        break;
      case "QUARTERLY":
        expiryDate.setMonth(expiryDate.getMonth() + 3);
        break;
      case "YEARLY":
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        break;
      case "PER_SEMESTER":
        expiryDate.setMonth(expiryDate.getMonth() + 6);
        break;
      default:
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        break;
    }


    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { status: "ACTIVE" }
      }),
      prisma.tenantProfile.update({
        where: { userId: userId },
        data: { 
          rentStartDate: now,
          rentExpiryDate: expiryDate
        }
      }),
      prisma.stayHistory.create({
        data: {
          tenantId: user.tenantProfile.id,
          roomId: user.tenantProfile.roomId,
          startDate: now,
          status: "ACTIVE"
        }
      })
    ]);

    // Send emails to tenant and admin (non-blocking)
    const roomNumber = user.tenantProfile?.room?.roomNumber || user.tenantProfile?.roomId || "N/A";
    await Promise.allSettled([
      sendTenantActivationEmail({
        email: user.email,
        name: user.name,
        roomNumber,
        rentStartDate: now,
        rentExpiryDate: expiryDate,
      }),
      sendAdminActivationAlert({
        adminEmail: process.env.ADMIN_EMAIL,
        tenantName: user.name,
        tenantEmail: user.email,
        roomNumber,
        rentStartDate: now,
        rentExpiryDate: expiryDate,
      }),
      createNotification({
        userId: user.id,
        title: "Tenancy Activated",
        message: `Your tenancy for Room ${roomNumber} is now active. Welcome to Covenant Hostel!`,
        type: "TENANCY",
        link: "/tenant",
      }),
    ]);

    return NextResponse.json({ success: true, message: "Tenancy activated successfully." });

  } catch (error) {
    console.error("ACTIVATE_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
