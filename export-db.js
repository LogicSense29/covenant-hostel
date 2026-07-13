// Database Export Script
// Exports all tables to JSON files in ./db-backup/
// Run with: node export-db.js

require("dotenv").config();
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "db-backup");

const TABLES = [
  "User",
  "TenantProfile",
  "ServiceProviderProfile",
  "Block",
  "Room",
  "StayHistory",
  "Payment",
  "MaintenanceTicket",
  "TicketMessage",
  "Inspection",
  "BillingRule",
  "RecurringCharge",
  "GuestInspection",
  "SystemSetting",
  "SetupToken",
  "RegistrationDraft",
  "Notification",
];

async function exportDatabase() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    console.log("Connecting to database...");
    await client.connect();
    console.log("Connected.\n");

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const summary = {};

    for (const table of TABLES) {
      try {
        // Prisma uses quoted table names matching the model name
        const res = await client.query(`SELECT * FROM "${table}"`);
        const rows = res.rows;

        const filePath = path.join(OUTPUT_DIR, `${table}.json`);
        fs.writeFileSync(filePath, JSON.stringify(rows, null, 2), "utf8");

        summary[table] = rows.length;
        console.log(`✓ ${table}: ${rows.length} rows → ${table}.json`);
      } catch (err) {
        console.warn(`✗ ${table}: skipped (${err.message})`);
        summary[table] = "error";
      }
    }

    // Write a summary file
    const summaryPath = path.join(OUTPUT_DIR, "_summary.json");
    fs.writeFileSync(
      summaryPath,
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          tables: summary,
        },
        null,
        2
      ),
      "utf8"
    );

    console.log(`\nDone! Backup saved to: ${OUTPUT_DIR}`);
    console.log(`Summary written to: _summary.json`);
  } catch (err) {
    console.error("Connection error:", err.message);
  } finally {
    await client.end();
  }
}

exportDatabase();
