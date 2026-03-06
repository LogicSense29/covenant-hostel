import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendRentExpiryReminder, sendAdminRentSummary } from "@/lib/email";

export const dynamic = "force-dynamic";

// This endpoint should be triggered daily by a cron service (e.g. Vercel Cron, GitHub Actions)
export async function GET(req) {
  // Simple security check (Optional: Add a CRON_SECRET header check)
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thresholds = [7, 3, 1]; // Days before expiry to send reminder
    let adminSummaryList = [];

    for (const days of thresholds) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + days);
      
      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);

      // 1. Check TenantProfile Expiries
      const expiringTenants = await prisma.tenantProfile.findMany({
        where: {
          rentExpiryDate: {
            gte: targetDate,
            lt: nextDay
          }
        },
        include: {
          user: true,
          room: true
        }
      });

      for (const tenant of expiringTenants) {
        if (tenant.user?.email) {
          await sendRentExpiryReminder({
            email: tenant.user.email,
            name: tenant.user.name,
            roomNumber: tenant.room?.roomNumber || "N/A",
            expiryDate: tenant.rentExpiryDate,
            daysLeft: days
          });

          adminSummaryList.push({
            roomNumber: tenant.room?.roomNumber || "N/A",
            tenantName: tenant.user.name,
            expiryDate: tenant.rentExpiryDate
          });
        }
      }

      // 2. Check Room-level Expiries (for units where individual tenants might not be set or for general room alerts)
      const expiringRooms = await prisma.room.findMany({
        where: {
          rentExpiryDate: {
            gte: targetDate,
            lt: nextDay
          }
        }
      });

      for (const room of expiringRooms) {
         adminSummaryList.push({
            roomNumber: room.roomNumber,
            tenantName: "General Room Expiry",
            expiryDate: room.rentExpiryDate
         });
      }
    }

    // Send consolidated summary to Admin if there are any expiries
    if (adminSummaryList.length > 0) {
      await sendAdminRentSummary({ expiries: adminSummaryList });
    }

    return NextResponse.json({ 
      success: true, 
      processed: adminSummaryList.length,
      timestamp: new Date().toISOString() 
    });

  } catch (error) {
    console.error("Cron Rent Reminder Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
