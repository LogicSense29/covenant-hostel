const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const rooms = await prisma.room.findMany({
      select: { roomNumber: true, status: true }
    });
    console.log('--- ROOMS ---');
    console.log(rooms);

    const guestInspections = await prisma.guestInspection.findMany({
      select: { name: true, feePaid: true, amountPaid: true }
    });
    console.log('--- GUEST INSPECTIONS ---');
    console.log(guestInspections);

    const payments = await prisma.payment.findMany({
      select: { amount: true, status: true }
    });
    console.log('--- PAYMENTS ---');
    console.log(payments);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
