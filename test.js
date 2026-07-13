const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const stays = await prisma.stayHistory.findMany({
    include: { tenant: { include: { user: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(stays, null, 2));
}

main().finally(() => prisma.$disconnect());
