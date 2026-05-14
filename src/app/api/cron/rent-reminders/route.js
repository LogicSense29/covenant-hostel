import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendRentExpiryReminder,
  sendAdminRentSummary,
  sendPartialPaymentDueReminder,
  sendAdminPartialPaymentAlert,
  sendRecurringChargeDueReminder,
  sendAdminRecurringChargeAlert,
  sendRentExpiredNotification,
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

    // ── 2. Mark expired tenants and notify them ──
    const expiredTenants = await prisma.tenantProfile.findMany({
      where: {
        rentExpiryDate: { lt: today },
        user: { status: "ACTIVE" },
      },
      include: { user: true, room: true },
    });

    for (const tenant of expiredTenants) {
      // Flip user status to EXPIRED
      await prisma.user.update({
        where: { id: tenant.userId },
        data: { status: "EXPIRED" },
      });

      // Notify tenant
      if (tenant.user?.email) {
        await sendRentExpiredNotification({
          email: tenant.user.email,
          name: tenant.user.name,
          roomNumber: tenant.room?.roomNumber || "N/A",
          expiryDate: tenant.rentExpiryDate,
        });
      }

      // Notify admin
      if (adminEmail) {
        await createTransporter().sendMail({
          from: `"Covenant Hostel" <${smtpUser}>`,
          to: adminEmail,
          subject: `Tenancy Expired — ${tenant.user?.name} (Room ${tenant.room?.roomNumber || "N/A"})`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <h3 style="color: #e11d48;">Tenancy Expired</h3>
              <p>Tenant <strong>${tenant.user?.name}</strong> (Room ${tenant.room?.roomNumber || "N/A"}) tenancy expired on <strong>${new Date(tenant.rentExpiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</strong>.</p>
              <p>Their portal access has been restricted. They will need to renew and be re-activated.</p>
            </div>
          `,
        }).catch(err => console.error("Admin expiry alert error:", err));
      }
    }

    // ── 3. Partial payment installment reminders ──
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

    // ── 4. Mark overdue recurring charges ──
    await prisma.recurringCharge.updateMany({
      where: {
        status: "UNPAID",
        dueDate: { lt: today },
      },
      data: { status: "OVERDUE" },
    });

    // ── 5. Generate recurring charges and send reminders ──
    // Find all active tenants with rooms
    const activeTenants = await prisma.tenantProfile.findMany({
      where: {
        room: { isNot: null },
        user: { status: "ACTIVE" },
      },
      include: { user: true, room: { include: { block: true } } },
    });

    for (const tenant of activeTenants) {
      // Find all recurring billing rules that apply to this tenant
      const applicableRules = await prisma.billingRule.findMany({
        where: {
          frequency: { not: "ONCE" },
          OR: [
            { isGlobal: true },
            { blockId: tenant.room.blockId ?? undefined },
            { rooms: { some: { id: tenant.room.id } } },
          ],
        },
      });

      for (const rule of applicableRules) {
        // Check if a charge already exists for this rule + tenant in the current cycle
        const existingCharge = await prisma.recurringCharge.findFirst({
          where: {
            tenantId: tenant.id,
            billingRuleId: rule.id,
            dueDate: { gte: today },
          },
        });

        if (!existingCharge) {
          // Calculate next due date based on frequency
          let nextDue = new Date(today);
          switch (rule.frequency) {
            case "DAILY":
              nextDue.setDate(today.getDate() + 1);
              break;
            case "MONTHLY":
              nextDue.setMonth(today.getMonth() + 1);
              break;
            case "QUARTERLY":
              nextDue.setMonth(today.getMonth() + 3);
              break;
            case "YEARLY":
              nextDue.setFullYear(today.getFullYear() + 1);
              break;
            case "PER_SEMESTER":
              nextDue.setMonth(today.getMonth() + 6);
              break;
            default:
              continue;
          }

          // Create the recurring charge
          await prisma.recurringCharge.create({
            data: {
              tenantId: tenant.id,
              billingRuleId: rule.id,
              amount: rule.amount,
              dueDate: nextDue,
              status: "UNPAID",
            },
          });
        }
      }

      // Send reminders for upcoming recurring charges
      for (const days of thresholds) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + days);
        const nextDay = new Date(targetDate);
        nextDay.setDate(targetDate.getDate() + 1);

        const upcomingCharges = await prisma.recurringCharge.findMany({
          where: {
            tenantId: tenant.id,
            status: "UNPAID",
            dueDate: { gte: targetDate, lt: nextDay },
          },
          include: { billingRule: true },
        });

        for (const charge of upcomingCharges) {
          if (tenant.user?.email) {
            await sendRecurringChargeDueReminder({
              email: tenant.user.email,
              name: tenant.user.name,
              roomNumber: tenant.room?.roomNumber || "N/A",
              chargeTitle: charge.billingRule.title || charge.billingRule.description,
              amount: charge.amount,
              dueDate: charge.dueDate,
            });
          }

          if (adminEmail) {
            await sendAdminRecurringChargeAlert({
              adminEmail,
              tenantName: tenant.user?.name || "Unknown",
              roomNumber: tenant.room?.roomNumber || "N/A",
              chargeTitle: charge.billingRule.title || charge.billingRule.description,
              amount: charge.amount,
              dueDate: charge.dueDate,
            });
          }
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
