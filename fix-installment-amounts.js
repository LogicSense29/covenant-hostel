/**
 * One-time fix: correct installment charges that were created with the wrong amount
 * (included caution fee bundled in).
 *
 * Usage: node fix-installment-amounts.js
 *
 * What it does:
 * - Finds all UNPAID __system_rent_installment__ charges
 * - For each tenant, looks up the BASE_RENT billing rule amount
 * - Recalculates the correct per-installment amount (rent only)
 * - Updates the charge amounts in the database
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function fixInstallmentAmounts() {
  console.log("🔧 Fixing installment charge amounts...\n");

  // Find all unpaid system installment charges
  const charges = await prisma.recurringCharge.findMany({
    where: {
      billingRuleId: "__system_rent_installment__",
      status: { in: ["UNPAID", "OVERDUE"] }
    },
    include: {
      tenant: {
        include: {
          room: {
            include: { billingRules: true }
          }
        }
      }
    }
  });

  if (charges.length === 0) {
    console.log("✅ No unpaid installment charges found.");
    return;
  }

  console.log(`Found ${charges.length} unpaid installment charge(s).\n`);

  let fixed = 0;
  let skipped = 0;

  for (const charge of charges) {
    const tenant = charge.tenant;
    const room = tenant?.room;

    if (!room) {
      console.log(`⚠️  Charge ${charge.id}: tenant has no room — skipping`);
      skipped++;
      continue;
    }

    // Find the BASE_RENT rule for this room
    const rentRule = room.billingRules?.find(r => {
      const t = String(r.type || "").toUpperCase().replace(/[_\s-]/g, "");
      return t === "BASERENT" || t === "RENT";
    });

    if (!rentRule) {
      console.log(`⚠️  Charge ${charge.id}: no BASE_RENT rule found for room ${room.roomNumber} — skipping`);
      skipped++;
      continue;
    }

    // Find total installments — look at the sibling charges for this tenant
    const allCharges = await prisma.recurringCharge.findMany({
      where: {
        tenantId: charge.tenantId,
        billingRuleId: "__system_rent_installment__",
        ...(tenant.rentStartDate ? { createdAt: { gte: tenant.rentStartDate } } : {}),
      }
    });

    const totalInstallments = allCharges.length + 1; // +1 for the first (already paid as a Payment)
    const correctAmount = Math.round((rentRule.amount / totalInstallments) * 100) / 100;

    if (Math.abs(charge.amount - correctAmount) < 0.01) {
      console.log(`✅ Charge ${charge.id} (${room.roomNumber}): amount ₦${charge.amount} already correct`);
      skipped++;
      continue;
    }

    console.log(`🔧 Charge ${charge.id} (${room.roomNumber}):`);
    console.log(`   Wrong amount:   ₦${charge.amount.toLocaleString()}`);
    console.log(`   Correct amount: ₦${correctAmount.toLocaleString()} (₦${rentRule.amount} ÷ ${totalInstallments} installments)`);

    await prisma.recurringCharge.update({
      where: { id: charge.id },
      data: { amount: correctAmount }
    });

    console.log(`   ✅ Fixed!\n`);
    fixed++;
  }

  console.log(`\n━━━ Summary ━━━`);
  console.log(`Fixed:   ${fixed}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total:   ${charges.length}`);

  await prisma.$disconnect();
}

fixInstallmentAmounts().catch(e => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
