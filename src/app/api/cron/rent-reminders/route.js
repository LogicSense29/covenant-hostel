import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  sendRentExpiryReminder,
  sendAdminRentSummary,
  sendPartialPaymentDueReminder,
  sendAdminPartialPaymentAlert,
  sendRecurringChargeDueReminder,
  sendAdminRecurringChargeAlert,
  sendRentExpiredNotification,
  sendPartialPaymentOverdueAlert,
  sendAdminPartialPaymentOverdueAlert,
  sendRecurringChargeOverdueAlert,
  sendAdminRecurringChargeOverdueAlert,
} from "@/lib/email";
import { createNotification, getLandlordUserIds } from "@/lib/notifications";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req) {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
    const adminEmail = process.env.ADMIN_EMAIL;
    const thresholds = [7, 3, 1];
    // Extended thresholds for YEARLY tenants — 30 days and 14 days ahead
    const yearlyThresholds = [30, 14];
    let adminSummaryList = [];

    // Check master WhatsApp toggle from DB
    const whatsappSetting = await prisma.systemSetting.findUnique({
      where: { key: "WHATSAPP_REMINDERS_ENABLED" },
    });
    const whatsappEnabled = whatsappSetting?.value === "true";

    // ── 1. Standard rent expiry reminders ──
    for (const days of thresholds) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + days);
      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);

      const expiringTenants = await prisma.tenantProfile.findMany({
        where: { 
          rentExpiryDate: { gte: targetDate, lt: nextDay },
          primaryTenantId: null // Room sharers don't pay rent directly
        },
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

        // WhatsApp: rent expiry reminder
        if (whatsappEnabled && tenant.phone) {
          const expiryFormatted = new Date(tenant.rentExpiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
          await sendWhatsAppMessage({
            to: tenant.phone,
            body: `🏠 *Covenant Hostel Reminder*\n\nDear ${tenant.user?.name || "Tenant"}, your tenancy for Room ${tenant.room?.roomNumber || "N/A"} expires in *${days} day${days > 1 ? "s" : ""}* on ${expiryFormatted}.\n\nPlease log in to your portal to renew: ${process.env.NEXTAUTH_URL || ""}/tenant/payments`,
          });
        }

        // In-app notification: rent expiry
        const expiryMsg = days === 1
          ? `Your tenancy expires tomorrow. Please renew to avoid disruption.`
          : `Your tenancy expires in ${days} days. Please renew soon.`;
        await createNotification({
          userId: tenant.userId,
          title: "Rent Expiry Reminder",
          message: expiryMsg,
          type: "PAYMENT",
          link: "/tenant/payments",
        });
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

    // ── 1b. Extended reminders for YEARLY tenants: 30 days and 14 days ──
    for (const days of yearlyThresholds) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + days);
      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);

      const yearlyExpiringTenants = await prisma.tenantProfile.findMany({
        where: { 
          rentExpiryDate: { gte: targetDate, lt: nextDay },
          primaryTenantId: null 
        },
        include: {
          user: true,
          room: {
            include: {
              billingRules: {
                where: {
                  type: { in: ["Base Rent", "Base_Rent", "BaseRent", "Rent", "RENT", "BASE_RENT"] },
                  frequency: "YEARLY",
                }
              }
            }
          }
        },
      });

      for (const tenant of yearlyExpiringTenants) {
        if (!tenant.room?.billingRules?.length) continue;
        if (tenant.user?.email) {
          await sendRentExpiryReminder({
            email: tenant.user.email,
            name: tenant.user.name,
            roomNumber: tenant.room?.roomNumber || "N/A",
            expiryDate: tenant.rentExpiryDate,
            daysLeft: days,
          });
        }
        // WhatsApp: yearly expiry reminder
        if (whatsappEnabled && tenant.phone) {
          await sendWhatsAppMessage({
            to: tenant.phone,
            body: `🏠 *Covenant Hostel – Annual Reminder*\n\nDear ${tenant.user?.name || "Tenant"}, your annual tenancy expires in *${days} days*. Please start your renewal process soon.\n\n${process.env.NEXTAUTH_URL || ""}/tenant/payments`,
          });
        }
        await createNotification({
          userId: tenant.userId,
          title: "Annual Rent Expiry Reminder",
          message: days === 30
            ? "Your annual tenancy expires in 1 month. Please start your renewal process soon."
            : "Your annual tenancy expires in 2 weeks. Please renew to avoid disruption.",
          type: "PAYMENT",
          link: "/tenant/payments",
        });
      }
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
      // WhatsApp: tenancy expired
      if (whatsappEnabled && tenant.phone) {
        await sendWhatsAppMessage({
          to: tenant.phone,
          body: `⚠️ *Covenant Hostel – Tenancy Expired*\n\nDear ${tenant.user?.name || "Tenant"}, your tenancy has now *expired*. Please renew immediately to avoid losing your room.\n\n${process.env.NEXTAUTH_URL || ""}/tenant/payments`,
        });
      }

      // Notify admin via the shared email helper (consistent with the rest of this file)
      if (adminEmail) {
        await sendAdminRentSummary({
          expiries: [{
            roomNumber: tenant.room?.roomNumber || "N/A",
            tenantName: `${tenant.user?.name} — TENANCY EXPIRED`,
            expiryDate: tenant.rentExpiryDate,
          }],
        });
      }

      // ── Notify room sharers linked to this primary tenant ──
      // Sharers don't pay rent directly but their access is tied to the primary's tenancy.
      const sharers = await prisma.tenantProfile.findMany({
        where: { primaryTenantId: tenant.id },
        include: { user: true },
      });

      const sharerTasks = sharers.map(async (sharer) => {
        const tasks = [];

        tasks.push(createNotification({
          userId: sharer.userId,
          title: "Room Tenancy Expired",
          message: `Your room's tenancy (managed by ${tenant.user?.name || "your primary tenant"}) has expired. Some features will be restricted until the tenancy is renewed.`,
          type: "PAYMENT",
          link: "/tenant",
        }));

        if (sharer.user?.email) {
          tasks.push(sendRentExpiredNotification({
            email: sharer.user.email,
            name: sharer.user.name,
            roomNumber: tenant.room?.roomNumber || "N/A",
            expiryDate: tenant.rentExpiryDate,
          }));
        }

        if (whatsappEnabled && sharer.phone) {
          tasks.push(sendWhatsAppMessage({
            to: sharer.phone,
            body: `⚠️ *Covenant Hostel – Room Tenancy Expired*\n\nDear ${sharer.user?.name || "Tenant"}, the tenancy for Room ${tenant.room?.roomNumber || "N/A"} managed by ${tenant.user?.name || "your primary tenant"} has now *expired*. Some features will be restricted until the tenancy is renewed.\n\n${process.env.NEXTAUTH_URL || ""}/tenant`,
          }));
        }

        await Promise.allSettled(tasks);
      });

      await Promise.allSettled(sharerTasks);
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
        // WhatsApp: partial payment due
        if (whatsappEnabled && tenant.phone) {
          const dueDateStr = new Date(payment.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
          await sendWhatsAppMessage({
            to: tenant.phone,
            body: `💰 *Covenant Hostel – Installment Due*\n\nDear ${tenant.user?.name || "Tenant"}, installment *${payment.installmentNumber}/${payment.totalInstallments}* of ₦${payment.amount.toLocaleString()} is due in *${days} day${days > 1 ? "s" : ""}* (${dueDateStr}).\n\n${process.env.NEXTAUTH_URL || ""}/tenant/payments`,
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

    // ── 3b. Overdue partial payment reminders (sent daily for up to 3 days after due date) ──
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);

    const overdueInstallments = await prisma.payment.findMany({
      where: {
        paymentType: "PARTIAL",
        status: "PENDING",
        dueDate: { lt: today, gte: threeDaysAgo },
      },
      include: {
        tenant: {
          include: { user: true, room: true },
        },
      },
    });

    const paymentPromises = overdueInstallments.map(async (payment) => {
      const { tenant } = payment;
      const tasks = [];

      if (tenant.user?.email) {
        tasks.push(sendPartialPaymentOverdueAlert({
          email: tenant.user.email,
          name: tenant.user.name,
          roomNumber: tenant.room?.roomNumber || "N/A",
          dueDate: payment.dueDate,
          amount: payment.amount,
          installmentNumber: payment.installmentNumber,
          totalInstallments: payment.totalInstallments,
        }));
      }
      
      if (whatsappEnabled && tenant.phone) {
        const dueDateStr = new Date(payment.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
        tasks.push(sendWhatsAppMessage({
          to: tenant.phone,
          body: `⚠️ *Covenant Hostel – OVERDUE Installment*\n\nDear ${tenant.user?.name || "Tenant"}, installment *${payment.installmentNumber}/${payment.totalInstallments}* of ₦${payment.amount.toLocaleString()} is now *OVERDUE*. It was due on ${dueDateStr}.\n\nPlease pay immediately: ${process.env.NEXTAUTH_URL || ""}/tenant/payments`,
        }));
      }

      tasks.push(createNotification({
        userId: tenant.userId,
        title: "Installment Overdue",
        message: `Your installment of ₦${payment.amount.toLocaleString()} is OVERDUE. Please pay immediately.`,
        type: "PAYMENT",
        link: "/tenant/payments",
      }));

      if (adminEmail) {
        tasks.push(sendAdminPartialPaymentOverdueAlert({
          adminEmail,
          tenantName: tenant.user?.name || "Unknown",
          roomNumber: tenant.room?.roomNumber || "N/A",
          amount: payment.amount,
          installmentNumber: payment.installmentNumber,
          totalInstallments: payment.totalInstallments,
          dueDate: payment.dueDate,
        }));
      }

      await Promise.allSettled(tasks);
    });

    await Promise.allSettled(paymentPromises);

    // ── 4. Mark overdue recurring charges ──
    const newlyOverdueCharges = await prisma.recurringCharge.findMany({
      where: {
        status: "UNPAID",
        dueDate: { lt: today },
      },
      include: {
        tenant: { include: { user: true, room: true } },
        billingRule: true,
      }
    });

    const chargePromises = newlyOverdueCharges.map(async (charge) => {
      const chargeTitle = charge.billingRule.title || charge.billingRule.description;
      const formattedDue = new Date(charge.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      const tasks = [];

      if (charge.tenant.user?.email) {
        tasks.push(sendRecurringChargeOverdueAlert({
          email: charge.tenant.user.email,
          name: charge.tenant.user.name,
          roomNumber: charge.tenant.room?.roomNumber || "N/A",
          chargeTitle,
          amount: charge.amount,
          dueDate: charge.dueDate,
        }));
      }

      if (whatsappEnabled && charge.tenant.phone) {
        tasks.push(sendWhatsAppMessage({
          to: charge.tenant.phone,
          body: `⚠️ *Covenant Hostel – OVERDUE Bill*\n\nDear ${charge.tenant.user?.name || "Tenant"}, your *${chargeTitle}* bill of ₦${charge.amount.toLocaleString()} is now *OVERDUE*. It was due on ${formattedDue}.\n\nPlease pay immediately: ${process.env.NEXTAUTH_URL || ""}/tenant/payments`,
        }));
      }

      tasks.push(createNotification({
        userId: charge.tenant.userId,
        title: "Bill Overdue",
        message: `Your ${chargeTitle} bill of ₦${charge.amount.toLocaleString()} is OVERDUE.`,
        type: "PAYMENT",
        link: "/tenant/payments",
      }));

      if (adminEmail) {
        tasks.push(sendAdminRecurringChargeOverdueAlert({
          adminEmail,
          tenantName: charge.tenant.user?.name || "Unknown",
          roomNumber: charge.tenant.room?.roomNumber || "N/A",
          chargeTitle,
          amount: charge.amount,
          dueDate: charge.dueDate,
        }));
      }

      await Promise.allSettled(tasks);
    });

    await Promise.allSettled(chargePromises);

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
        primaryTenantId: null // Room sharers do not get billed; the primary tenant handles it
      },
      include: { user: true, room: { include: { block: true } } },
    });

    for (const tenant of activeTenants) {
      // Find all recurring billing rules explicitly connected to this tenant's room
      const applicableRules = await prisma.billingRule.findMany({
        where: {
          frequency: { not: "ONCE" },
          rooms: { some: { id: tenant.room.id } },
        },
      });

      for (const rule of applicableRules) {
        // Find the latest existing charge for this tenant + rule
        const latestCharge = await prisma.recurringCharge.findFirst({
          where: {
            tenantId: tenant.id,
            billingRuleId: rule.id,
          },
          orderBy: { dueDate: "desc" },
        });

        let nextDue;
        if (latestCharge) {
          nextDue = new Date(latestCharge.dueDate);
        } else {
          nextDue = new Date(tenant.rentStartDate || tenant.createdAt);
        }

        switch (rule.frequency) {
          case "DAILY":
            nextDue.setDate(nextDue.getDate() + 1);
            break;
          case "MONTHLY":
            nextDue.setMonth(nextDue.getMonth() + 1);
            break;
          case "QUARTERLY":
            nextDue.setMonth(nextDue.getMonth() + 3);
            break;
          case "YEARLY":
            nextDue.setFullYear(nextDue.getFullYear() + 1);
            break;
          case "PER_SEMESTER":
            nextDue.setMonth(nextDue.getMonth() + 6);
            break;
          default:
            continue;
        }

        // Normalize nextDue to UTC midnight
        const normalizedNextDue = new Date(Date.UTC(
          nextDue.getFullYear(),
          nextDue.getMonth(),
          nextDue.getDate(),
          0, 0, 0, 0
        ));

        // Check if a charge already exists for this tenant, rule, and exact dueDate
        const alreadyExists = await prisma.recurringCharge.findFirst({
          where: {
            tenantId: tenant.id,
            billingRuleId: rule.id,
            dueDate: normalizedNextDue,
          },
        });

        const limitDate = new Date(today);
        limitDate.setDate(limitDate.getDate() + 1); // allow generating up to tomorrow

        if (!alreadyExists && normalizedNextDue <= limitDate) {
          const status = normalizedNextDue < today ? "OVERDUE" : "UNPAID";
          await prisma.recurringCharge.create({
            data: {
              tenantId: tenant.id,
              billingRuleId: rule.id,
              amount: rule.amount,
              dueDate: normalizedNextDue,
              status,
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
          const chargeTitle = charge.billingRule.title || charge.billingRule.description;
          const formattedDue = new Date(charge.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

          if (tenant.user?.email) {
            await sendRecurringChargeDueReminder({
              email: tenant.user.email,
              name: tenant.user.name,
              roomNumber: tenant.room?.roomNumber || "N/A",
              chargeTitle,
              amount: charge.amount,
              dueDate: charge.dueDate,
            });
          }

          // WhatsApp: recurring charge due
          if (whatsappEnabled && tenant.phone) {
            await sendWhatsAppMessage({
              to: tenant.phone,
              body: `📋 *Covenant Hostel – Bill Reminder*\n\nDear ${tenant.user?.name || "Tenant"}, your *${chargeTitle}* bill of ₦${charge.amount.toLocaleString()} is due in *${days} day${days > 1 ? "s" : ""}* on ${formattedDue}.\n\n${process.env.NEXTAUTH_URL || ""}/tenant/payments`,
            });
          }

          if (adminEmail) {
            await sendAdminRecurringChargeAlert({
              adminEmail,
              tenantName: tenant.user?.name || "Unknown",
              roomNumber: tenant.room?.roomNumber || "N/A",
              chargeTitle,
              amount: charge.amount,
              dueDate: charge.dueDate,
            });
          }

          // In-app notification: upcoming bill reminder
          const dueMsg = days === 1
            ? `Your ${chargeTitle} bill of ₦${charge.amount.toLocaleString()} is due tomorrow (${formattedDue}).`
            : `Your ${chargeTitle} bill of ₦${charge.amount.toLocaleString()} is due in ${days} days on ${formattedDue}.`;
          await createNotification({
            userId: tenant.userId,
            title: `Bill Due ${days === 1 ? "Tomorrow" : `in ${days} Days`}`,
            message: dueMsg,
            type: "PAYMENT",
            link: "/tenant/payments",
          });

          // Notify landlords too
          const landlordIds = await getLandlordUserIds();
          await createNotification({
            userIds: landlordIds,
            title: "Upcoming Bill Reminder",
            message: `${tenant.user?.name || "A tenant"}'s ${chargeTitle} of ₦${charge.amount.toLocaleString()} is due in ${days} day${days > 1 ? "s" : ""}.`,
            type: "PAYMENT",
            link: "/landlord/payments",
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
