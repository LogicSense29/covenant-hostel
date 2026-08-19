const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const history = await prisma.stayHistory.findMany({
      where: { status: 'COMPLETED' },
      orderBy: { endDate: 'desc' },
      take: 5,
      include: {
        tenant: {
          include: { user: true }
        },
        room: true
      }
    });
    console.log(JSON.stringify(history, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
