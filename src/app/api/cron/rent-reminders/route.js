import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendRentExpiryReminder,
  sendAdminRentSummary,
  sendPartialPaymentDueReminder,
  sendAdminPartialPaymentAlert,
} from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const adminEmail = process.env.ADMIN_EMAIL;
    const thresholds = [7, 3, 1];
    let adminSummaryList = [];

    // ── 1. Standard rent expiry reminders ──
    for (const days of thresholds) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + days);
      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);

      const expiringTenants = await prisma.tenantProfile.findMany({
        where: { rentExpiryDate: { gte: targetDate, lt: nextDay } },
        include: { user: true, room: true },
      });

      for (const tenant of expiringTenants) {
        if (tenant.user?.email) {
          await sendRentExpiryReminder({
            email: tenant.user.email,
            name: tenant.user.name,
            roomNumber: tenant.room?.roomNumber || "N/A",
            expiryDate: tenant.rentExpiryDate,
            daysLeft: days,
          });
          adminSummaryList.push({
            roomNumber: tenant.room?.roomNumber || "N/A",
            tenantName: tenant.user.name,
            expiryDate: tenant.rentExpiryDate,
          });
        }
      }

      const expiringRooms = await prisma.room.findMany({
        where: { rentExpiryDate: { gte: targetDate, lt: nextDay } },
      });
      for (const room of expiringRooms) {
        adminSummaryList.push({
          roomNumber: room.roomNumber,
          tenantName: "General Room Expiry",
          expiryDate: room.rentExpiryDate,
        });
      }
    }

    if (adminSummaryList.length > 0) {
      await sendAdminRentSummary({ expiries: adminSummaryList });
    }

    // ── 2. Partial payment installment reminders ──
    for (const days of thresholds) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + days);
      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);

      // Find pending partial payments with a due date in the threshold window
      const upcomingInstallments = await prisma.payment.findMany({
        where: {
          paymentType: "PARTIAL",
          status: "PENDING",
          dueDate: { gte: targetDate, lt: nextDay },
        },
        include: {
          tenant: {
            include: { user: true, room: true },
          },
        },
      });

      for (const payment of upcomingInstallments) {
        const { tenant } = payment;
        if (tenant.user?.email) {
          await sendPartialPaymentDueReminder({
            email: tenant.user.email,
            name: tenant.user.name,
            roomNumber: tenant.room?.roomNumber || "N/A",
            dueDate: payment.dueDate,
            amount: payment.amount,
            installmentNumber: payment.installmentNumber,
            totalInstallments: payment.totalInstallments,
          });
        }

        if (adminEmail) {
          await sendAdminPartialPaymentAlert({
            adminEmail,
            tenantName: tenant.user?.name || "Unknown",
            roomNumber: tenant.room?.roomNumber || "N/A",
            amount: payment.amount,
            installmentNumber: payment.installmentNumber,
            totalInstallments: payment.totalInstallments,
            dueDate: payment.dueDate,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: adminSummaryList.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron Rent Reminder Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
