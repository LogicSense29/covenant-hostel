import { prisma } from "@/lib/prisma";

/**
 * Hard-deletes a single tenant and all related records.
 * Throws if the tenant has roomSharers linked to them.
 * Returns the deleted tenant's name + email for logging.
 */
export async function hardDeleteTenant(tenantId) {
  const tenant = await prisma.tenantProfile.findUnique({
    where: { id: tenantId },
    include: { user: true, roomSharers: true },
  });

  if (!tenant) return null;

  if (tenant.roomSharers && tenant.roomSharers.length > 0) {
    throw new Error(`Tenant "${tenant.user.name}" has room sharers linked. Unlink them first.`);
  }

  await prisma.$transaction(async (tx) => {
    // 1. Delete ticket messages first (child of MaintenanceTicket)
    const tickets = await tx.maintenanceTicket.findMany({
      where: { tenantId },
      select: { id: true },
    });
    if (tickets.length > 0) {
      await tx.ticketMessage.deleteMany({
        where: { ticketId: { in: tickets.map(t => t.id) } },
      });
    }

    // 2. Delete maintenance tickets
    await tx.maintenanceTicket.deleteMany({ where: { tenantId } });

    // 3. Delete inspections
    await tx.inspection.deleteMany({ where: { tenantId } });

    // 4. Delete recurring charges
    await tx.recurringCharge.deleteMany({ where: { tenantId } });

    // 5. Delete payments
    await tx.payment.deleteMany({ where: { tenantId } });

    // 6. Delete stay history
    await tx.stayHistory.deleteMany({ where: { tenantId } });

    // 7. Delete notifications
    await tx.notification.deleteMany({ where: { userId: tenant.userId } });

    // 8. Delete tenant profile
    await tx.tenantProfile.delete({ where: { id: tenantId } });

    // 9. Delete user account
    await tx.user.delete({ where: { id: tenant.userId } });
  });

  return { name: tenant.user.name, email: tenant.user.email };
}
