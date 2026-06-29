const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixStuckSharers() {
  const sharers = await prisma.user.findMany({
    where: { status: 'AWAITING_PAYMENT' },
    include: {
      tenantProfile: {
        include: {
          primaryTenant: {
            include: { user: true }
          }
        }
      }
    }
  });

  let fixedCount = 0;
  const now = new Date();

  for (const user of sharers) {
    if (user.tenantProfile?.primaryTenant?.user?.status === 'ACTIVE') {
      const primaryProfile = user.tenantProfile.primaryTenant;
      
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: { status: 'ACTIVE' }
        });

        await tx.tenantProfile.update({
          where: { id: user.tenantProfile.id },
          data: {
            roomId: primaryProfile.roomId,
            rentStartDate: now,
            rentExpiryDate: primaryProfile.rentExpiryDate,
          }
        });

        if (primaryProfile.roomId) {
          await tx.stayHistory.create({
            data: {
              tenantId: user.tenantProfile.id,
              roomId: primaryProfile.roomId,
              startDate: now,
              status: 'ACTIVE'
            }
          });
        }
      });
      console.log(`Fixed sharer: ${user.email}`);
      fixedCount++;
    }
  }

  console.log(`Finished. Fixed ${fixedCount} stuck sharer(s).`);
}

fixStuckSharers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
