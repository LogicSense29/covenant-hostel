import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanInvalidStayHistory() {
  try {
    const pendingUsersWithStays = await prisma.user.findMany({
      where: {
        status: { in: ['PENDING', 'AWAITING_PAYMENT', 'PAYMENT_MADE', 'REJECTED'] }
      },
      include: {
        tenantProfile: {
          include: {
            stayHistory: true
          }
        }
      }
    });

    let deletedCount = 0;
    for (const user of pendingUsersWithStays) {
      if (user.tenantProfile && user.tenantProfile.stayHistory.length > 0) {
        console.log(`Found invalid StayHistory for user ${user.email} (Status: ${user.status})`);
        
        await prisma.stayHistory.deleteMany({
          where: { tenantId: user.tenantProfile.id }
        });
        deletedCount += user.tenantProfile.stayHistory.length;
      }
    }
    
    console.log(`Cleanup complete. Deleted ${deletedCount} invalid StayHistory records.`);
  } catch (err) {
    console.error("Cleanup error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

cleanInvalidStayHistory();
