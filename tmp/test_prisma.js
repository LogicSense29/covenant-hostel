
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const tenants = await prisma.tenantProfile.findMany({
      include: {
        user: true,
        room: {
          include: { block: true }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    console.log("Tenants fetched successfully:", tenants.length);
  } catch (error) {
    console.error("Prisma error fetching tenants:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
