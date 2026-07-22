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
    // Moves the expiry date to N days from now, then immediately triggers the cron
    // so the full reminder flow fires in one click.
    const daysParam = parseInt(searchParams.get("days") || "7", 10);
    const days = [30, 14, 7, 3, 1].includes(daysParam) ? daysParam : 7;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    await prisma.tenantProfile.update({
      where: { id: tenant.id },
      data: { rentExpiryDate: targetDate },
    });

    // Trigger the cron job — it will detect the expiry window and fire emails + notifications
    const baseUrl = req.nextUrl?.origin || process.env.NEXTAUTH_URL || "http://localhost:3000";
    let cronResult = "unknown";
    try {
      const cronHeaders = {};
      if (process.env.CRON_SECRET) cronHeaders["Authorization"] = `Bearer ${process.env.CRON_SECRET}`;
      const cronRes = await fetch(`${baseUrl}/api/cron/rent-reminders`, { headers: cronHeaders });
      cronResult = cronRes.ok ? "✅ Cron ran successfully" : `⚠️ Cron returned ${cronRes.status}`;
    } catch (e) {
      cronResult = `⚠️ Cron error: ${e.message}`;
    }

    return new NextResponse(`
      <html>
        <head><title>Expiry Set + Cron Triggered</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; padding: 40px; color: #1e293b; }
          .card { background: white; border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px; max-width: 520px; margin: auto; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
          h1 { color: #0b69ff; margin-top: 0; }
          .status { font-weight: bold; color: #0b69ff; background: #eff6ff; padding: 8px 16px; border-radius: 12px; display: inline-block; margin-bottom: 20px; }
          .note { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; font-size: 0.85rem; color: #475569; margin: 16px 0; line-height: 1.7; }
          .btn { display: inline-block; padding: 11px 20px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 0.85rem; margin-right: 8px; margin-top: 12px; }
          .btn-blue { background: #2563eb; color: white; }
          .btn-green { background: #16a34a; color: white; }
        </style></head>
        <body>
          <div class="card">
            <h1>Done!</h1>
            <div class="status">EXPIRY IN ${days} DAY${days > 1 ? "S" : ""}</div>
            <p><strong>Tenant:</strong> ${tenant.user.name} (${tenant.user.email})</p>
            <p><strong>New expiry date:</strong> ${targetDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
            <div class="note">
              <strong>Cron result:</strong> ${cronResult}<br/>
              The cron checked all expiry windows. If this tenant fell in the ${days}-day window, reminder emails and in-app notifications were sent.
            </div>
            <a href="/api/test-expiry?email=${encodeURIComponent(email)}" class="btn btn-blue">Back to Controls</a>
            <a href="/api/test-expiry?action=activate&email=${encodeURIComponent(email)}" class="btn btn-green">Restore to Active</a>
          </div>
        </body>
      </html>
    `, { headers: { "Content-Type": "text/html" } });
  }

  if (action === "remind") {
    // Simulate an upcoming expiry reminder — sets expiry to N days from now and sends reminder
    const daysParam = parseInt(searchParams.get("days") || "7", 10);
    const days = [30, 14, 7, 3, 1].includes(daysParam) ? daysParam : 7;

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
            <p><strong>Email:</strong> ${emailSent ? "Sent" : "Skipped"}</p>
            <p><strong>In-app notification:</strong> Sent</p>
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

    // Also trigger the cron to process any other expiry side-effects
    const baseUrl = req.nextUrl?.origin || process.env.NEXTAUTH_URL || "http://localhost:3000";
    try {
      const cronHeaders = {};
      if (process.env.CRON_SECRET) cronHeaders["Authorization"] = `Bearer ${process.env.CRON_SECRET}`;
      await fetch(`${baseUrl}/api/cron/rent-reminders`, { headers: cronHeaders });
    } catch (e) {
      console.warn("Cron trigger failed:", e.message);
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
            <p><strong>Email Notification:</strong> ${emailSent ? "Sent Successfully" : "Skipped (check server console logs)"}</p>
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
          <title>Restore Success</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; padding: 40px; text-align: center; color: #1e293b; }
            .card { background: white; border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px; max-width: 500px; margin: auto; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
            h1 { color: #16a34a; margin-top: 0; }
            .status { font-weight: bold; color: #16a34a; background: #dcfce7; padding: 8px 16px; border-radius: 12px; display: inline-block; margin-bottom: 20px; }
            .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 20px; }
            .btn-secondary { background: #64748b; margin-left: 10px; }
            .meta { font-size: 0.85em; color: #64748b; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Restored to Active!</h1>
            <div class="status">STATUS: ACTIVE</div>
            <p><strong>Tenant:</strong> ${tenant.user.name} (${tenant.user.email})</p>
            <p><strong>Rent Expiry Date:</strong> set to ${expiryDate.toLocaleDateString("en-GB")} (Frequency: ${frequency})</p>
            <p class="meta">If you log in as this tenant, you will now see the standard active dashboard.</p>
            <a href="/tenant" class="btn">Go to Tenant Dashboard</a>
            <a href="/api/test-expiry?email=${encodeURIComponent(email)}" class="btn btn-secondary">Back to Controls</a>
          </div>
        </body>
      </html>
    `, { headers: { "Content-Type": "text/html" } });
  }

  if (action === "clear-payments") {
    // Delete all payments and recurring charges for the tenant
    await prisma.payment.deleteMany({
      where: { tenantId: tenant.id },
    });
    
    await prisma.recurringCharge.deleteMany({
      where: { tenantId: tenant.id },
    });

    return new NextResponse(`
      <html>
        <head>
          <title>Payments Cleared</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; padding: 40px; text-align: center; color: #1e293b; }
            .card { background: white; border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px; max-width: 500px; margin: auto; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
            h1 { color: #8b5cf6; margin-top: 0; }
            .status { font-weight: bold; color: #8b5cf6; background: #ede9fe; padding: 8px 16px; border-radius: 12px; display: inline-block; margin-bottom: 20px; }
            .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 20px; }
            .btn-secondary { background: #64748b; margin-left: 10px; }
            .meta { font-size: 0.85em; color: #64748b; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Payments Cleared!</h1>
            <div class="status">CLEAN SLATE</div>
            <p><strong>Tenant:</strong> ${tenant.user.name} (${tenant.user.email})</p>
            <p class="meta">All payment records and recurring charges have been deleted. If you log in as this tenant, they will be prompted to pay their initial rent and checkout fees.</p>
            <a href="/tenant/payments" class="btn">Go to Payments Page</a>
            <a href="/api/test-expiry?email=${encodeURIComponent(email)}" class="btn btn-secondary">Back to Controls</a>
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

          <h3>Set Expiry + Auto-run Cron</h3>
          <p style="font-size:0.85rem;color:#64748b;margin:0 0 10px">Sets expiry to N days from now then automatically runs the cron — reminder emails and in-app notifications fire if the tenant falls in the window.</p>
          <div class="btn-row">
            <a href="/api/test-expiry?action=set-expiry&days=30&email=${encodeURIComponent(email)}" class="btn btn-blue">Set to 30 Days</a>
            <a href="/api/test-expiry?action=set-expiry&days=14&email=${encodeURIComponent(email)}" class="btn btn-blue">Set to 14 Days</a>
            <a href="/api/test-expiry?action=set-expiry&days=7&email=${encodeURIComponent(email)}" class="btn btn-blue">Set to 7 Days</a>
            <a href="/api/test-expiry?action=set-expiry&days=3&email=${encodeURIComponent(email)}" class="btn btn-amber">Set to 3 Days</a>
            <a href="/api/test-expiry?action=set-expiry&days=1&email=${encodeURIComponent(email)}" class="btn btn-red">Set to 1 Day</a>
          </div>

          <h3>Manual Reminder Fire</h3>
          <p style="font-size:0.85rem;color:#64748b;margin:0 0 10px">Sets expiry AND directly fires the reminder email + in-app notification without going through the cron.</p>
          <div class="btn-row">
            <a href="/api/test-expiry?action=remind&days=30&email=${encodeURIComponent(email)}" class="btn btn-blue">30-Day Warning</a>
            <a href="/api/test-expiry?action=remind&days=14&email=${encodeURIComponent(email)}" class="btn btn-blue">14-Day Warning</a>
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

          <h3>Clean Slate (Testing)</h3>
          <p style="font-size:0.85rem;color:#64748b;margin:0 0 10px">Deletes ALL payments and recurring charges for this tenant, forcing them to re-pay their initial checkout bundle.</p>
          <div class="btn-row">
            <a href="/api/test-expiry?action=clear-payments&email=${encodeURIComponent(email)}" class="btn" style="background:#8b5cf6">Clear All Payments</a>
          </div>
        </div>
      </body>
    </html>
  `, { headers: { "Content-Type": "text/html" } });
}

{/* <a href="/api/test-expiry?action=expire&email=${encodeURIComponent(email)}" class="btn btn-secondary">Simulate Expiry</a>
          </div> */}