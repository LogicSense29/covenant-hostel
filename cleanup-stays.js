const { PrismaClient } = require('@prisma/client');
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
      // Room sharers that have been approved (AWAITING_PAYMENT) legitimately have a StayHistory if primary is ACTIVE.
      // So let's be careful. Let's strictly delete StayHistory for PENDING users.
      if (user.status === 'PENDING' && user.tenantProfile && user.tenantProfile.stayHistory.length > 0) {
        console.log(`Found invalid StayHistory for PENDING user ${user.email}`);
        
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
