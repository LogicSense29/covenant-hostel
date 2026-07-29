import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendProviderAssignedEmail, sendTenantProviderAssignedEmail } from "@/lib/email";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { sendSMS } from "@/lib/sms";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;
    const { providerId } = await req.json();

    const newStatus = providerId ? "IN_PROGRESS" : "OPEN";

    const ticket = await prisma.maintenanceTicket.update({
      where: { id },
      data: {
        providerId,
        status: newStatus
      },
      include: {
        tenant: { include: { user: true } },
        provider: { include: { user: true } }
      }
    });

    // ---------------------------------------------------------
    // NOTIFICATIONS
    // ---------------------------------------------------------
    // Only send notifications if we are ASSIGNING a provider (not unassigning)
    if (providerId) {
      const { tenant, provider } = ticket;
      const roomNumber = ticket.roomNumber || ticket.roomId || "Unknown Room";

      // 1. Notify the Service Provider
      if (provider && provider.user) {
        // Email
        if (provider.user.email) {
          await sendProviderAssignedEmail({
            email: provider.user.email,
            name: provider.user.name,
            roomNumber,
            issue: ticket.title,
            description: ticket.description,
            priority: ticket.priority
          });
        }

        // WhatsApp / SMS Fallback
        if (provider.phone) {
          const body = `Covenant Hostel: You have been assigned a new maintenance task for Room ${roomNumber}. Issue: ${ticket.title}. Priority: ${ticket.priority}. Please log in for details.`;
          
          // Attempt WhatsApp first
          const waSuccess = await sendWhatsAppMessage({ to: provider.phone, body });
          
          // If WhatsApp fails or is disabled (skipped), fallback to SMS
          if (!waSuccess) {
            await sendSMS({ to: provider.phone, body });
          }
        }
      }

      // 2. Notify the Tenant
      if (tenant && tenant.user) {
        // In-app Notification
        await createNotification({
          userId: tenant.userId,
          title: "Provider Assigned",
          message: `${provider?.user?.name || 'A service provider'} has been assigned to your maintenance request for Room ${roomNumber}.`,
          type: "MAINTENANCE",
          link: "/tenant/maintenance"
        });

        // Email
        if (tenant.user.email) {
          await sendTenantProviderAssignedEmail({
            email: tenant.user.email,
            name: tenant.user.name,
            providerName: provider?.user?.name || "Service Provider",
            specialty: provider?.specialty || "Maintenance",
            roomNumber,
            issue: ticket.title
          });
        }
      }
    }

    return NextResponse.json(ticket);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to assign ticket" }, { status: 500 });
  }
}
