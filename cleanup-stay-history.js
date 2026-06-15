const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting StayHistory cleanup script...');
  
  // Find all ACTIVE stay histories with their associated tenant profile
  const activeStays = await prisma.stayHistory.findMany({
    where: { status: 'ACTIVE' },
    include: { tenant: true }
  });

  console.log(`Found ${activeStays.length} ACTIVE stay records.`);

  let updatedCount = 0;

  for (const stay of activeStays) {
    // If the tenant's current roomId doesn't match the stay's roomId, it means they moved or left
    if (stay.tenant.roomId !== stay.roomId) {
      console.log(`Closing StayHistory ID: ${stay.id} for Tenant: ${stay.tenant.id} (Current Room: ${stay.tenant.roomId}, Stay Room: ${stay.roomId})`);
      
      await prisma.stayHistory.update({
        where: { id: stay.id },
        data: {
          status: 'COMPLETED',
          endDate: new Date(),
        }
      });
      updatedCount++;
    }
  }

  console.log(`\nCleanup complete! Closed ${updatedCount} stale StayHistory records.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
