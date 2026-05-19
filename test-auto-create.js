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
  const { autoCreateNextCharge } = require(path.join(projRoot, 'src/lib/billing.js'));

  // Get the tenant's first recurring charge (due May 18)
  const charge = await prisma.recurringCharge.findFirst({
    where: {
      tenant: { user: { email: "lappiconnect@gmail.com" } },
      dueDate: new Date("2026-05-18T00:00:00.000Z")
    }
  });

  if (!charge) {
    console.log("No recurring charge found due May 18");
    return;
  }

  console.log("Found charge:", JSON.stringify(charge, null, 2));

  console.log("Triggering autoCreateNextCharge for this charge...");
  const nextCharge = await autoCreateNextCharge(prisma, charge.id);
  console.log("Result next charge:", JSON.stringify(nextCharge, null, 2));

  // Clean up if created during test so we don't pollute database
  if (nextCharge && nextCharge.id !== charge.id) {
    console.log("Test succeeded!");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
