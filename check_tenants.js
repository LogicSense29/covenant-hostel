const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const tenants = await prisma.tenantProfile.findMany({ include: { user: true } });
  console.log(`Found ${tenants.length} tenants`);
  tenants.forEach(t => console.log(`- ${t.user?.name} (${t.user?.status})` || 'N/A'));
  await prisma.$disconnect();
}

check();
