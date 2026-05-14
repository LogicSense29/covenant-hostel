import { prisma } from "@/lib/prisma";

/**
 * Create a notification for one or more users.
 * Silently swallows errors so a notification failure never breaks the main flow.
 */
export async function createNotification({ userId, userIds, title, message, type, link }) {
  try {
    const ids = userIds || (userId ? [userId] : []);
    if (ids.length === 0) return;

    await prisma.notification.createMany({
      data: ids.map(id => ({
        userId: id,
        title,
        message,
        type,
        link: link || null,
      })),
    });
  } catch (err) {
    console.error("createNotification error:", err);
  }
}

/**
 * Get the admin/landlord user IDs to notify.
 * Returns all LANDLORD and ADMIN users.
 */
export async function getLandlordUserIds() {
  const users = await prisma.user.findMany({
    where: { role: { in: ["LANDLORD", "ADMIN"] } },
    select: { id: true },
  });
  return users.map(u => u.id);
}
