const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get all tenants with partial payments
  const profiles = await prisma.tenantProfile.findMany({
    where: { allowPartialPayment: true },
    include: {
      user: { select: { name: true, status: true } },
      room: { select: { roomNumber: true, rentAmount: true } },
    },
    take: 5,
  });

  if (profiles.length === 0) {
    console.log('No tenants with allowPartialPayment=true found.');
    console.log('Checking recent payments instead...');
    const payments = await prisma.payment.findMany({
      where: { isPartial: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { tenant: { include: { user: { select: { name: true, status: true } }, room: { select: { roomNumber: true, rentAmount: true } } } } },
    });
    payments.forEach(p => {
      console.log('\nPayment:', p.id, '| Status:', p.status, '| Amount:', p.amount, '| Type:', p.paymentType, '| installmentNumber:', p.installmentNumber);
      console.log('  Tenant:', p.tenant?.user?.name, '| Room:', p.tenant?.room?.roomNumber, '| RentAmount:', p.tenant?.room?.rentAmount);
      if (p.breakdown) console.log('  breakdown:', JSON.stringify(p.breakdown));
    });
    return;
  }

  for (const p of profiles) {
    console.log('\n=== Tenant:', p.user.name, '| Status:', p.user.status, '| Room:', p.room?.roomNumber, '| Installments:', p.partialPaymentInstallments);
    console.log('rentStartDate:', p.rentStartDate, '| rentExpiryDate:', p.rentExpiryDate);
    console.log('Room rentAmount:', p.room?.rentAmount);

    const payments = await prisma.payment.findMany({
      where: { tenantId: p.id },
      orderBy: { createdAt: 'desc' },
    });

    console.log('Payments:');
    payments.forEach(pay => {
      console.log(' ', pay.status, '|', pay.paymentType, '| amount:', pay.amount, '| installmentNumber:', pay.installmentNumber, '| isPartial:', pay.isPartial);
      if (pay.breakdown) console.log('   breakdown:', JSON.stringify(pay.breakdown));
    });

    // Simulate verifiedRentTotal calculation from page.js
    const verifiedPayments = payments.filter(p => p.status === 'SUCCESS' || p.status === 'VERIFIED');
    const cycleStart = p.rentStartDate
      ? new Date(new Date(p.rentStartDate).getTime() - 30 * 24 * 60 * 60 * 1000)
      : null;

    const isRentPaymentRecord = (pay) => {
      if (pay.paymentType === 'FULL' || pay.paymentType === 'PARTIAL' || pay.isPartial || pay.installmentNumber != null) return true;
      if (Array.isArray(pay.breakdown) && pay.breakdown.some(b => b.name?.toLowerCase().includes('rent'))) return true;
      return false;
    };

    const verifiedRentPayments = verifiedPayments.filter(pay => {
      if (!isRentPaymentRecord(pay)) return false;
      if (cycleStart && new Date(pay.createdAt) < cycleStart) return false;
      return true;
    });

    const verifiedRentTotal = verifiedRentPayments.reduce((s, pay) => {
      if (Array.isArray(pay.breakdown)) {
        const rentItem = pay.breakdown.find(b => b.name?.toLowerCase().includes('rent'));
        if (rentItem?.amount) return s + rentItem.amount;
      }
      return s + pay.amount;
    }, 0);

    console.log('\nverifiedRentTotal:', verifiedRentTotal);
    console.log('rentRemaining:', Math.max(0, (p.room?.rentAmount || 0) - verifiedRentTotal));

    const recurringCharges = await prisma.recurringCharge.findMany({
      where: { tenantId: p.id, billingRuleId: '__system_rent_installment__' },
      orderBy: { dueDate: 'asc' },
    });
    console.log('Installment charges:');
    recurringCharges.forEach(c => {
      console.log(' ', c.status, '| amount:', c.amount, '| due:', c.dueDate?.toISOString().slice(0,10));
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
