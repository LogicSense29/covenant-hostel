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

    // ── 3. Proactive installment reminders (calculated from rentStartDate, like rent expiry) ──
    // Works even before the tenant has submitted any payment.
    // Thresholds: 14, 7, 3, 1 days before the next installment due date.
    const installmentThresholds = [14, 7, 3, 1];

    const partialTenants = await prisma.tenantProfile.findMany({
      where: {
        allowPartialPayment: true,
        partialPaymentInstallments: { gt: 1 },
        primaryTenantId: null,
        rentStartDate: { not: null },
        user: { status: "ACTIVE" },
      },
      include: {
        user: true,
        room: true,
        payments: {
          where: {
            paymentType: "PARTIAL",
            status: { notIn: ["REJECTED"] },
          },
          orderBy: { installmentNumber: "asc" },
        },
      },
    });

    for (const tenant of partialTenants) {
      const n = tenant.partialPaymentInstallments;
      const start = new Date(tenant.rentStartDate);

      // Count fully verified installments to find the next one due
      const paidCount = tenant.payments.filter(
        (p) => p.status === "SUCCESS" || p.status === "VERIFIED"
      ).length;

      if (paidCount >= n) continue; // All installments already paid — nothing to remind

      const nextInstallmentNumber = paidCount + 1;

      // Skip if tenant has already submitted a PENDING receipt for this installment
      const alreadySubmitted = tenant.payments.some(
        (p) => p.installmentNumber === nextInstallmentNumber && p.status === "PENDING"
      );
      if (alreadySubmitted) continue;

      // Calculate the due date: rentStartDate + (paidCount) months
      // Use Date.UTC to avoid setMonth() day-overflow (e.g. Jan 31 + 1 month → Mar 3).
      // We always anchor to the same day-of-month as rentStartDate, clamped to month end.
      const startDay = start.getUTCDate();
      const targetMonth = start.getUTCMonth() + paidCount;
      const targetYear = start.getUTCFullYear() + Math.floor(targetMonth / 12);
      const clampedMonth = targetMonth % 12;
      // Clamp day to last day of the target month
      const daysInTargetMonth = new Date(Date.UTC(targetYear, clampedMonth + 1, 0)).getUTCDate();
      const clampedDay = Math.min(startDay, daysInTargetMonth);
      const normalizedDue = new Date(Date.UTC(targetYear, clampedMonth, clampedDay, 0, 0, 0, 0));

      const daysUntilDue = Math.ceil(
        (normalizedDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (!installmentThresholds.includes(daysUntilDue)) continue;

      // Determine installment amount: use the first recorded payment amount if available,
      // otherwise fall back to room.rentAmount / n.
      // Guard: if amount resolves to 0, skip — no point sending a ₦0 reminder.
      const referencePayment = tenant.payments.find((p) => p.installmentNumber !== null && p.amount > 0);
      const installmentAmount = referencePayment
        ? referencePayment.amount
        : Math.round((tenant.room?.rentAmount || 0) / n);
      if (!installmentAmount || installmentAmount <= 0) continue;

      const dueDateStr = normalizedDue.toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
      });

      // Email reminder
      if (tenant.user?.email) {
        await sendPartialPaymentDueReminder({
          email: tenant.user.email,
          name: tenant.user.name,
          roomNumber: tenant.room?.roomNumber || "N/A",
          dueDate: normalizedDue,
          amount: installmentAmount,
          installmentNumber: nextInstallmentNumber,
          totalInstallments: n,
        });
      }

      // WhatsApp reminder
      if (whatsappEnabled && tenant.phone) {
        await sendWhatsAppMessage({
          to: tenant.phone,
          body: `💰 *Covenant Hostel – Installment Due*\n\nDear ${tenant.user?.name || "Tenant"}, installment *${nextInstallmentNumber}/${n}* of ₦${installmentAmount.toLocaleString()} is due in *${daysUntilDue} day${daysUntilDue > 1 ? "s" : ""}* (${dueDateStr}).\n\nLog in to pay: ${process.env.NEXTAUTH_URL || ""}/tenant/payments`,
        });
      }

      // In-app notification (tenant)
      const dueMsg =
        daysUntilDue === 1
          ? `Your installment ${nextInstallmentNumber}/${n} of ₦${installmentAmount.toLocaleString()} is due tomorrow (${dueDateStr}).`
          : `Your installment ${nextInstallmentNumber}/${n} of ₦${installmentAmount.toLocaleString()} is due in ${daysUntilDue} days on ${dueDateStr}.`;
      await createNotification({
        userId: tenant.userId,
        title: `Installment Due ${daysUntilDue === 1 ? "Tomorrow" : `in ${daysUntilDue} Days`}`,
        message: dueMsg,
        type: "PAYMENT",
        link: "/tenant/payments",
      });

      // Admin alert
      if (adminEmail) {
        await sendAdminPartialPaymentAlert({
          adminEmail,
          tenantName: tenant.user?.name || "Unknown",
          roomNumber: tenant.room?.roomNumber || "N/A",
          amount: installmentAmount,
          installmentNumber: nextInstallmentNumber,
          totalInstallments: n,
          dueDate: normalizedDue,
        });
      }
    }

    // ── 3b. Proactive overdue installment reminders (up to 7 days after due date) ──
    // Fires for installments whose calculated due date has passed but haven't been paid/submitted.
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    // Re-use the same partialTenants list fetched above
    const overdueInstallmentTasks = partialTenants.map(async (tenant) => {
      const n = tenant.partialPaymentInstallments;
      const start = new Date(tenant.rentStartDate);

      const paidCount = tenant.payments.filter(
        (p) => p.status === "SUCCESS" || p.status === "VERIFIED"
      ).length;

      if (paidCount >= n) return;

      const nextInstallmentNumber = paidCount + 1;

      // If there's already a PENDING submission for this installment, the existing
      // PENDING-based overdue logic below will handle it — skip here.
      const alreadySubmitted = tenant.payments.some(
        (p) => p.installmentNumber === nextInstallmentNumber && p.status === "PENDING"
      );
      if (alreadySubmitted) return;

      // Same overflow-safe date calculation as section 3
      const startDay3b = start.getUTCDate();
      const targetMonth3b = start.getUTCMonth() + paidCount;
      const targetYear3b = start.getUTCFullYear() + Math.floor(targetMonth3b / 12);
      const clampedMonth3b = targetMonth3b % 12;
      const daysInTargetMonth3b = new Date(Date.UTC(targetYear3b, clampedMonth3b + 1, 0)).getUTCDate();
      const clampedDay3b = Math.min(startDay3b, daysInTargetMonth3b);
      const normalizedDue = new Date(Date.UTC(targetYear3b, clampedMonth3b, clampedDay3b, 0, 0, 0, 0));

      // Only alert if overdue within the past 7 days
      if (normalizedDue >= today || normalizedDue < sevenDaysAgo) return;

      const referencePayment = tenant.payments.find((p) => p.installmentNumber !== null && p.amount > 0);
      const installmentAmount = referencePayment
        ? referencePayment.amount
        : Math.round((tenant.room?.rentAmount || 0) / n);
      if (!installmentAmount || installmentAmount <= 0) return;

      const dueDateStr = normalizedDue.toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
      });
      const tasks = [];

      if (tenant.user?.email) {
        tasks.push(sendPartialPaymentOverdueAlert({
          email: tenant.user.email,
          name: tenant.user.name,
          roomNumber: tenant.room?.roomNumber || "N/A",
          dueDate: normalizedDue,
          amount: installmentAmount,
          installmentNumber: nextInstallmentNumber,
          totalInstallments: n,
        }));
      }

      if (whatsappEnabled && tenant.phone) {
        tasks.push(sendWhatsAppMessage({
          to: tenant.phone,
          body: `⚠️ *Covenant Hostel – OVERDUE Installment*\n\nDear ${tenant.user?.name || "Tenant"}, installment *${nextInstallmentNumber}/${n}* of ₦${installmentAmount.toLocaleString()} was due on *${dueDateStr}* and is now *OVERDUE*.\n\nPlease pay immediately: ${process.env.NEXTAUTH_URL || ""}/tenant/payments`,
        }));
      }

      tasks.push(createNotification({
        userId: tenant.userId,
        title: "Installment Overdue",
        message: `Your installment ${nextInstallmentNumber}/${n} of ₦${installmentAmount.toLocaleString()} was due on ${dueDateStr} and is OVERDUE. Please pay immediately.`,
        type: "PAYMENT",
        link: "/tenant/payments",
      }));

      if (adminEmail) {
        tasks.push(sendAdminPartialPaymentOverdueAlert({
          adminEmail,
          tenantName: tenant.user?.name || "Unknown",
          roomNumber: tenant.room?.roomNumber || "N/A",
          amount: installmentAmount,
          installmentNumber: nextInstallmentNumber,
          totalInstallments: n,
          dueDate: normalizedDue,
        }));
      }

      await Promise.allSettled(tasks);
    });

    await Promise.allSettled(overdueInstallmentTasks);

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
