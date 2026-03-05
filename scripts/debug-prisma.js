const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Attempting to query counts...");
    const counts = await prisma.maintenanceTicket.count();
    console.log(`MaintenanceTicket count: ${counts}`);

    console.log("Attempting simple findMany...");
    const tickets = await prisma.maintenanceTicket.findMany({ take: 1 });
    console.log("Simple query success:", tickets);

    console.log("Attempting query with include...");
    const ticketsWithInclude = await prisma.maintenanceTicket.findMany({
      take: 1,
      include: { tenant: { include: { user: true } } }
    });
    console.log("Include query success!");

    console.log("Attempting query with orderBy...");
    const ticketsWithOrder = await prisma.maintenanceTicket.findMany({
      take: 1,
      orderBy: { createdAt: "desc" }
    });
    console.log("OrderBy query success!");

  } catch (error) {
    console.error("DEBUG QUERY ERROR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
