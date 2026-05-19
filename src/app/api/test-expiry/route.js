import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendRentExpiredNotification } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return new NextResponse(
      "Unauthorized. Please log into the tenant or landlord portal first.",
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action"); // "expire" or "activate"
  const email = searchParams.get("email") || session.user.email; // Use session email if not specified

  // Find the target tenant profile
  const tenant = await prisma.tenantProfile.findFirst({
    where: { user: { email } },
    include: { user: true, room: true },
  });

  if (!tenant) {
    return NextResponse.json(
      { error: `No tenant profile found for email: ${email}` },
      { status: 404 }
    );
  }

  if (action === "expire") {
    // 1. Set rent expiry date to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await prisma.tenantProfile.update({
      where: { id: tenant.id },
      data: { rentExpiryDate: yesterday },
    });

    // 2. Process expiration: Flip user status to EXPIRED
    await prisma.user.update({
      where: { id: tenant.userId },
      data: { status: "EXPIRED" },
    });

    // 3. Try to send the email notification (wrapped in try/catch in case SMTP is not configured)
    let emailSent = false;
    try {
      if (tenant.user?.email) {
        await sendRentExpiredNotification({
          email: tenant.user.email,
          name: tenant.user.name,
          roomNumber: tenant.room?.roomNumber || "N/A",
          expiryDate: yesterday,
        });
        emailSent = true;
      }
    } catch (e) {
      console.warn("SMTP email notification skipped or failed:", e.message);
    }

    return new NextResponse(`
      <html>
        <head>
          <title>Simulate Expiry Success</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; padding: 40px; text-align: center; color: #1e293b; }
            .card { background: white; border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px; max-width: 500px; margin: auto; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
            h1 { color: #e11d48; margin-top: 0; }
            .status { font-weight: bold; color: #e11d48; background: #fff1f2; padding: 8px 16px; border-radius: 12px; display: inline-block; margin-bottom: 20px; }
            .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 20px; }
            .btn-secondary { background: #64748b; margin-left: 10px; }
            .meta { font-size: 0.85em; color: #64748b; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Tenancy Expired!</h1>
            <div class="status">STATUS: EXPIRED</div>
            <p><strong>Tenant:</strong> ${tenant.user.name} (${tenant.user.email})</p>
            <p><strong>Rent Expiry Date:</strong> set to yesterday (${yesterday.toLocaleDateString("en-GB")})</p>
            <p><strong>Email Notification:</strong> ${emailSent ? "Sent Successfully ✅" : "Skipped (check server console logs) ⚠️"}</p>
            <p class="meta">If you log in as this tenant, you will now see the Rent Expired block page.</p>
            <a href="/tenant" class="btn">Go to Tenant Dashboard</a>
            <a href="/api/test-expiry?action=activate&email=${encodeURIComponent(email)}" class="btn btn-secondary">Restore to Active</a>
          </div>
        </body>
      </html>
    `, { headers: { "Content-Type": "text/html" } });
  }

  if (action === "activate") {
    // Restore tenant back to active and set expiry date dynamically based on rent frequency
    const matchingRules = tenant.roomId ? await prisma.billingRule.findMany({
      where: {
        type: { in: ["Base Rent", "Base_Rent", "BaseRent", "Rent", "RENT", "BASE_RENT"] },
        OR: [
          { isGlobal: true },
          { blockId: tenant.room?.blockId || undefined },
          { rooms: { some: { id: tenant.roomId } } },
          { roomId: tenant.roomId }
        ]
      },
      include: {
        rooms: true
      }
    }) : [];

    const rentRule = matchingRules.find(r => r.roomId === tenant.roomId || r.rooms?.some(rm => rm.id === tenant.roomId))
      || matchingRules.find(r => r.blockId === tenant.room?.blockId)
      || matchingRules.find(r => r.isGlobal)
      || null;

    const frequency = rentRule?.frequency || "YEARLY";

    const expiryDate = new Date();
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

    await prisma.tenantProfile.update({
      where: { id: tenant.id },
      data: { rentExpiryDate: expiryDate },
    });

    await prisma.user.update({
      where: { id: tenant.userId },
      data: { status: "ACTIVE" },
    });

    return new NextResponse(`
      <html>
        <head>
          <title>Tenancy Restored Success</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; padding: 40px; text-align: center; color: #1e293b; }
            .card { background: white; border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px; max-width: 500px; margin: auto; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
            h1 { color: #16a34a; margin-top: 0; }
            .status { font-weight: bold; color: #16a34a; background: #f0fdf4; padding: 8px 16px; border-radius: 12px; display: inline-block; margin-bottom: 20px; }
            .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 20px; }
            .btn-secondary { background: #e11d48; margin-left: 10px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Tenancy Restored!</h1>
            <div class="status">STATUS: ACTIVE</div>
            <p><strong>Tenant:</strong> ${tenant.user.name} (${tenant.user.email})</p>
            <p><strong>Rent Expiry Date:</strong> reset dynamically based on rent frequency (${expiryDate.toLocaleDateString("en-GB")})</p>
            <p>Your tenant profile is now active and the dashboard is unlocked.</p>
            <a href="/tenant" class="btn">Go to Tenant Dashboard</a>
            <a href="/api/test-expiry?action=expire&email=${encodeURIComponent(email)}" class="btn btn-secondary">Simulate Expiry</a>
          </div>
        </body>
      </html>
    `, { headers: { "Content-Type": "text/html" } });
  }

  // Base view showing controls
  return new NextResponse(`
    <html>
      <head>
        <title>Rent Expiration Testing Center</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; padding: 40px; text-align: center; color: #1e293b; }
          .card { background: white; border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px; max-width: 500px; margin: auto; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
          h1 { color: #2563eb; margin-top: 0; }
          .btn { display: inline-block; background: #e11d48; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 20px; }
          .btn-active { background: #16a34a; margin-left: 10px; }
          .meta { margin-top: 20px; font-size: 0.9em; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Rent Expiration Simulator</h1>
          <p>You can simulate what happens when a tenant's rent expires end-to-end, and restore them back at any time.</p>
          <p><strong>Target Tenant:</strong> ${tenant.user.name} (${tenant.user.email})</p>
          <p class="meta">Current user status in database is <strong>${tenant.user.status}</strong>.</p>
          <div>
            <a href="/api/test-expiry?action=expire&email=${encodeURIComponent(email)}" class="btn">Simulate Expiry</a>
            <a href="/api/test-expiry?action=activate&email=${encodeURIComponent(email)}" class="btn btn-active">Simulate Active</a>
          </div>
        </div>
      </body>
    </html>
  `, { headers: { "Content-Type": "text/html" } });
}
