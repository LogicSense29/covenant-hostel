// Load env variables
const path = require('path');
const projRoot = "c:/Users/USER/Desktop/convenant hostel management system/convenant-hostel";
require(path.join(projRoot, 'node_modules/dotenv')).config({ path: path.join(projRoot, '.env') });

const { PrismaClient } = require(path.join(projRoot, 'node_modules/@prisma/client'));
const { PrismaPg } = require(path.join(projRoot, 'node_modules/@prisma/adapter-pg'));
const pg = require(path.join(projRoot, 'node_modules/pg'));

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Mark overdue recurring charges
  const overdueCount = await prisma.recurringCharge.updateMany({
    where: {
      status: "UNPAID",
      dueDate: { lt: today },
    },
    data: { status: "OVERDUE" },
  });
  console.log(`Marked ${overdueCount.count} charges as OVERDUE.`);

  // 2. Generate recurring charges
  const activeTenants = await prisma.tenantProfile.findMany({
    where: {
      room: { isNot: null },
      user: { status: "ACTIVE" },
    },
    include: { user: true, room: { include: { block: true } } },
  });

  console.log(`Found ${activeTenants.length} active tenants with rooms.`);

  for (const tenant of activeTenants) {
    const applicableRules = await prisma.billingRule.findMany({
      where: {
        frequency: { not: "ONCE" },
        OR: [
          { isGlobal: true },
          { blockId: tenant.room.blockId ?? undefined },
          { rooms: { some: { id: tenant.room.id } } },
        ],
      },
    });

    console.log(`Tenant ${tenant.user.name} has ${applicableRules.length} applicable rules.`);

    for (const rule of applicableRules) {
      const existingCharge = await prisma.recurringCharge.findFirst({
        where: {
          tenantId: tenant.id,
          billingRuleId: rule.id,
          dueDate: { gte: today },
        },
      });

      if (!existingCharge) {
        let nextDue = new Date(today);
        switch (rule.frequency) {
          case "DAILY":
            nextDue.setDate(today.getDate() + 1);
            break;
          case "MONTHLY":
            nextDue.setMonth(today.getMonth() + 1);
            break;
          case "QUARTERLY":
            nextDue.setMonth(today.getMonth() + 3);
            break;
          case "YEARLY":
            nextDue.setFullYear(today.getFullYear() + 1);
            break;
          case "PER_SEMESTER":
            nextDue.setMonth(today.getMonth() + 6);
            break;
          default:
            continue;
        }

        const newCharge = await prisma.recurringCharge.create({
          data: {
            tenantId: tenant.id,
            billingRuleId: rule.id,
            amount: rule.amount,
            dueDate: nextDue,
            status: "UNPAID",
          },
        });
        console.log(`Created charge for rule "${rule.title || rule.description}" due ${newCharge.dueDate.toISOString().split('T')[0]}`);
      } else {
        console.log(`Charge already exists for rule "${rule.title || rule.description}" due ${existingCharge.dueDate.toISOString().split('T')[0]}`);
      }
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
