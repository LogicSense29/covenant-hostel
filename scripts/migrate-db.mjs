/**
 * Database Migration Script (pg-based — no Prisma constructor issues)
 * Usage: node scripts/migrate-db.mjs
 * 
 * Copies ALL data from OLD_URL to NEW_URL using raw SQL pg_dump via SELECT/INSERT.
 */

import pg from "pg";
const { Client } = pg;

// ─── Configure your two databases here ──────────────────────────────────────
const OLD_URL = "postgresql://postgres:mQlBhRWEwsICVekZAIVWlsgbVXoYUTyG@zephyr.proxy.rlwy.net:56673/railway";
const NEW_URL = "postgresql://postgres:VXVqQDBByIevsNsPwSWQKsnrzsFdChDl@tokaido.proxy.rlwy.net:58566/railway";
// ─────────────────────────────────────────────────────────────────────────────

const oldDb = new Client({ connectionString: OLD_URL });
const newDb = new Client({ connectionString: NEW_URL });

// Tables in dependency order (parents first)
const TABLES = [
  "User",
  "Block",
  "Room",
  "BillingRule",
  "_RoomToBillingRules",  // many-to-many join table
  "TenantProfile",
  "ServiceProviderProfile",
  "Payment",
  "RecurringCharge",
  "MaintenanceTicket",
  "TicketMessage",
  "Inspection",
  "StayHistory",
  "Notification",
];

async function migrateTable(table) {
  const { rows } = await oldDb.query(`SELECT * FROM "${table}"`);
  if (rows.length === 0) {
    console.log(`  ⏭  ${table}: empty, skipping`);
    return;
  }

  // Build column list from first row
  const columns = Object.keys(rows[0]);
  const colList = columns.map((c) => `"${c}"`).join(", ");

  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const values = columns.map((c) => {
      const v = row[c];
      // Only JSON.stringify plain objects (JSON/JSONB columns).
      // JS arrays are Postgres array columns — pg handles them natively, don't stringify.
      if (v !== null && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) {
        return JSON.stringify(v);
      }
      return v;
    });

    const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

    try {
      await newDb.query(
        `INSERT INTO "${table}" (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
        values
      );
      inserted++;
    } catch (err) {
      console.warn(`  ⚠️  ${table} row skipped: ${err.message.split("\n")[0]}`);
      skipped++;
    }
  }

  console.log(`  ✅ ${table}: ${inserted} inserted, ${skipped} skipped`);
}

async function migrate() {
  console.log("🔌 Connecting to databases...");
  await oldDb.connect();
  await newDb.connect();
  console.log("✅ Connected!\n");

  // Disable FK checks during import to avoid ordering issues
  await newDb.query("SET session_replication_role = 'replica';");

  console.log("🚀 Starting migration...\n");

  for (const table of TABLES) {
    try {
      process.stdout.write(`📦 ${table}... `);
      const { rows } = await oldDb.query(`SELECT COUNT(*) FROM "${table}"`);
      process.stdout.write(`(${rows[0].count} rows)\n`);
      await migrateTable(table);
    } catch (err) {
      console.log(`\n  ❌ ${table} failed: ${err.message.split("\n")[0]}`);
    }
  }

  // Re-enable FK checks
  await newDb.query("SET session_replication_role = 'origin';");

  console.log("\n✅ Migration complete!");
  console.log("\n👉 Next step: Update DATABASE_URL in your .env to the new URL and restart the server.\n");

  await oldDb.end();
  await newDb.end();
}

migrate().catch((err) => {
  console.error("❌ Fatal error:", err.message);
  process.exit(1);
});
