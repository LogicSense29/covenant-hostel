import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { status: 'PENDING' },
    include: { tenantProfile: { include: { stayHistory: true } } }
  });
  console.log("PENDING USERS WITH STAY HISTORY:", JSON.stringify(users.filter(u => u.tenantProfile?.stayHistory?.length > 0), null, 2));
}

main().finally(() => prisma.$disconnect());
