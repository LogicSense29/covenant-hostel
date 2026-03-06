import { prisma } from "./src/lib/prisma.js";

async function check() {
  try {
    const userCount = await prisma.user.count();
    const tenantCount = await prisma.tenantProfile.count();
    const tenants = await prisma.tenantProfile.findMany({ include: { user: true } });
    
    console.log(JSON.stringify({
      userCount,
      tenantCount,
      tenants: tenants.map(t => ({ id: t.id, name: t.user?.name, status: t.user?.status }))
    }, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
