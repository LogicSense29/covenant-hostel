const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const userCount = await prisma.user.count();
    const tenantCount = await prisma.tenantProfile.count();
    const pendingUsers = await prisma.user.count({ where: { status: 'PENDING' } });
    
    console.log(JSON.stringify({
      userCount,
      tenantCount,
      pendingUsers
    }, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
