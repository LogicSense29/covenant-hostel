import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting StayHistory cleanup script...');
  
  const activeStays = await prisma.stayHistory.findMany({
    where: { status: 'ACTIVE' },
    include: { tenant: true }
  });

  console.log(`Found ${activeStays.length} ACTIVE stay records.`);

  let updatedCount = 0;

  for (const stay of activeStays) {
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
    await pool.end();
  });
