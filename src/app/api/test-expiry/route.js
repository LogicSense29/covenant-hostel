import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendRentExpiredNotification, sendRentExpiryReminder } from "@/lib/email";
import { createNotification } from "@/lib/notifications";

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

  if (action === "set-expiry") {
    // Just moves the expiry date to N days from now — no emails, no status change.
    // Use this to put the tenant in the "about to expire" window, then run the cron.
    const daysParam = parseInt(searchParams.get("days") || "7", 10);
    const days = [7, 3, 1].includes(daysParam) ? daysParam : 7;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    await prisma.tenantProfile.update({
      where: { id: tenant.id },
      data: { rentExpiryDate: targetDate },
    });

    return new NextResponse(`
      <html>
        <head><title>Expiry Date Set</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; padding: 40px; color: #1e293b; }
          .card { background: white; border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px; max-width: 520px; margin: auto; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
          h1 { color: #0b69ff; margin-top: 0; }
          .status { font-weight: bold; color: #0b69ff; background: #eff6ff; padding: 8px 16px; border-radius: 12px; display: inline-block; margin-bottom: 20px; }
          .note { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; font-size: 0.85rem; color: #475569; margin: 16px 0; }
          .btn { display: inline-block; padding: 11px 20px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 0.85rem; margin-right: 8px; margin-top: 12px; }
          .btn-blue { background: #2563eb; color: white; }
          .btn-red { background: #e11d48; color: white; }
          .btn-green { background: #16a34a; color: white; }
        </style></head>
        <body>
          <div class="card">
            <h1>Expiry Date Updated</h1>
            <div class="status">EXPIRY IN ${days} DAY${days > 1 ? "S" : ""}</div>
            <p><strong>Tenant:</strong> ${tenant.user.name} (${tenant.user.email})</p>
            <p><strong>New expiry date:</strong> ${targetDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
            <div class="note">
              ℹ️ No emails or notifications were sent. The tenant's status is still <strong>${tenant.user.status}</strong>.<br/>
              Now run <code>/api/cron/rent-reminders</code> to trigger the actual reminder flow, or use the buttons below to fire reminders manually.
            </div>
            <a href="/api/test-expiry?action=remind&days=${days}&email=${encodeURIComponent(email)}" class="btn btn-blue">Fire ${days}-Day Reminder Now</a>
            <a href="/api/test-expiry?action=expire&email=${encodeURIComponent(email)}" class="btn btn-red">Simulate Full Expiry</a>
            <a href="/api/test-expiry?email=${encodeURIComponent(email)}" class="btn btn-green">Back to Controls</a>
          </div>
        </body>
      </html>
    `, { headers: { "Content-Type": "text/html" } });
  }

  if (action === "remind") {
    // Simulate an upcoming expiry reminder — sets expiry to N days from now and sends reminder
    const daysParam = parseInt(searchParams.get("days") || "7", 10);
    const days = [7, 3, 1].includes(daysParam) ? daysParam : 7;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    await prisma.tenantProfile.update({
      where: { id: tenant.id },
      data: { rentExpiryDate: targetDate },
    });

    // Send reminder email
    let emailSent = false;
    try {
      if (tenant.user?.email) {
        await sendRentExpiryReminder({
          email: tenant.user.email,
          name: tenant.user.name,
          roomNumber: tenant.room?.roomNumber || "N/A",
          expiryDate: targetDate,
          daysLeft: days,
        });
        emailSent = true;
      }
    } catch (e) {
      console.warn("Reminder email skipped:", e.message);
    }

    // Send in-app notification
    const msg = days === 1
      ? "Your tenancy expires tomorrow. Please renew to avoid disruption."
      : `Your tenancy expires in ${days} days. Please renew soon.`;
    await createNotification({
      userId: tenant.userId,
      title: "Rent Expiry Reminder",
      message: msg,
      type: "PAYMENT",
      link: "/tenant/payments",
    });

    return new NextResponse(`
      <html>
        <head><title>Reminder Sent</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; padding: 40px; text-align: center; color: #1e293b; }
          .card { background: white; border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px; max-width: 520px; margin: auto; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
          h1 { color: #2563eb; margin-top: 0; }
          .status { font-weight: bold; color: #2563eb; background: #eff6ff; padding: 8px 16px; border-radius: 12px; display: inline-block; margin-bottom: 20px; }
          .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 16px; }
          .btn-red { background: #e11d48; margin-left: 8px; }
          .btn-green { background: #16a34a; margin-left: 8px; }
        </style></head>
        <body>
          <div class="card">
            <h1>Reminder Triggered!</h1>
            <div class="status">${days} DAY${days > 1 ? "S" : ""} WARNING SENT</div>
            <p><strong>Tenant:</strong> ${tenant.user.name} (${tenant.user.email})</p>
            <p><strong>Expiry set to:</strong> ${targetDate.toLocaleDateString("en-GB")} (${days} day${days > 1 ? "s" : ""} from now)</p>
            <p><strong>Email:</strong> ${emailSent ? "Sent ✅" : "Skipped ⚠️"}</p>
            <p><strong>In-app notification:</strong> Sent ✅</p>
            <a href="/api/test-expiry?email=${encodeURIComponent(email)}" class="btn">Back to Controls</a>
            <a href="/api/test-expiry?action=expire&email=${encodeURIComponent(email)}" class="btn btn-red">Simulate Expiry</a>
            <a href="/api/test-expiry?action=activate&email=${encodeURIComponent(email)}" class="btn btn-green">Restore Active</a>
          </div>
        </body>
      </html>
    `, { headers: { "Content-Type": "text/html" } });
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
        rooms: { some: { id: tenant.roomId } },
      },
    }) : [];

    const rentRule = matchingRules[0] || null;

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
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; padding: 40px; color: #1e293b; }
          .card { background: white; border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px; max-width: 560px; margin: auto; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
          h1 { color: #2563eb; margin-top: 0; font-size: 1.6rem; }
          h3 { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin: 24px 0 10px; }
          .btn-row { display: flex; gap: 8px; flex-wrap: wrap; }
          .btn { display: inline-block; padding: 11px 20px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 0.85rem; }
          .btn-blue { background: #2563eb; color: white; }
          .btn-amber { background: #f59e0b; color: white; }
          .btn-red { background: #e11d48; color: white; }
          .btn-green { background: #16a34a; color: white; }
          .info { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; margin-bottom: 8px; font-size: 0.85rem; color: #475569; line-height: 1.6; }
          .tag { display: inline-block; font-size: 0.7rem; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
          .tag-active { background: #dcfce7; color: #16a34a; }
          .tag-expired { background: #fee2e2; color: #e11d48; }
          .tag-other { background: #f1f5f9; color: #475569; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Rent Expiry Test Center</h1>
          <div class="info">
            <strong>Target:</strong> ${tenant.user.name} (${tenant.user.email})<br/>
            <strong>Status:</strong> <span class="tag ${tenant.user.status === 'ACTIVE' ? 'tag-active' : tenant.user.status === 'EXPIRED' ? 'tag-expired' : 'tag-other'}">${tenant.user.status}</span><br/>
            <strong>Current Expiry:</strong> ${tenant.rentExpiryDate ? new Date(tenant.rentExpiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Not set"}
          </div>

          <h3>Set Expiry Date Only</h3>
          <p style="font-size:0.85rem;color:#64748b;margin:0 0 10px">Moves the expiry date without sending any notifications. Use this to set up the window, then run the cron to test the full flow.</p>
          <div class="btn-row">
            <a href="/api/test-expiry?action=set-expiry&days=7&email=${encodeURIComponent(email)}" class="btn btn-blue">Set to 7 Days</a>
            <a href="/api/test-expiry?action=set-expiry&days=3&email=${encodeURIComponent(email)}" class="btn btn-amber">Set to 3 Days</a>
            <a href="/api/test-expiry?action=set-expiry&days=1&email=${encodeURIComponent(email)}" class="btn btn-red">Set to 1 Day</a>
          </div>

          <h3>Reminder Notifications</h3>
          <p style="font-size:0.85rem;color:#64748b;margin:0 0 10px">Sets expiry to N days from now AND fires the reminder email + in-app notification immediately — same as what the cron does.</p>
          <div class="btn-row">
            <a href="/api/test-expiry?action=remind&days=7&email=${encodeURIComponent(email)}" class="btn btn-blue">7-Day Warning</a>
            <a href="/api/test-expiry?action=remind&days=3&email=${encodeURIComponent(email)}" class="btn btn-amber">3-Day Warning</a>
            <a href="/api/test-expiry?action=remind&days=1&email=${encodeURIComponent(email)}" class="btn btn-red">1-Day Warning</a>
          </div>

          <h3>Full Expiry</h3>
          <p style="font-size:0.85rem;color:#64748b;margin:0 0 10px">Sets status to EXPIRED and fires the expiry email.</p>
          <div class="btn-row">
            <a href="/api/test-expiry?action=expire&email=${encodeURIComponent(email)}" class="btn btn-red">Simulate Expiry</a>
          </div>

          <h3>Restore</h3>
          <p style="font-size:0.85rem;color:#64748b;margin:0 0 10px">Resets status to ACTIVE and sets a fresh expiry date based on the ticked rent frequency.</p>
          <div class="btn-row">
            <a href="/api/test-expiry?action=activate&email=${encodeURIComponent(email)}" class="btn btn-green">Restore to Active</a>
          </div>
        </div>
      </body>
    </html>
  `, { headers: { "Content-Type": "text/html" } });
}
