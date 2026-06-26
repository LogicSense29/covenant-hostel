/**
 * fix-sharer-link.mjs
 * ─────────────────────────────────────────────────────────────
 * Usage:
 *   node scripts/fix-sharer-link.mjs
 * ─────────────────────────────────────────────────────────────
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import * as dotenv from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Load .env.local from project root
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env.local") });
dotenv.config({ path: resolve(__dirname, "../.env") });

// ── CONFIG: set these two emails before running ─────────────
const PRIMARY_TENANT_EMAIL = "primary@example.com";  // ← the main tenant (who pays)
const SHARER_EMAIL         = "sharer@example.com";   // ← the room sharer to fix
// ────────────────────────────────────────────────────────────

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. List all profiles for reference
  const allProfiles = await prisma.tenantProfile.findMany({
    include: { user: { select: { name: true, email: true, status: true } } },
    orderBy: { createdAt: "asc" },
  });

  console.log("\n📋 All Tenant Profiles:");
  console.log("─".repeat(90));
  for (const p of allProfiles) {
    console.log(
      `  Profile ID : ${p.id}\n` +
      `  Name       : ${p.user?.name}\n` +
      `  Email      : ${p.user?.email}\n` +
      `  Status     : ${p.user?.status}\n` +
      `  Primary ID : ${p.primaryTenantId ?? "(none — is primary)"}\n` +
      `  Room ID    : ${p.roomId ?? "(none)"}\n` +
      "─".repeat(90)
    );
  }

  // 2. Find the primary tenant's TenantProfile
  const primaryProfile = await prisma.tenantProfile.findFirst({
    where: { user: { email: PRIMARY_TENANT_EMAIL } },
    include: { user: { select: { name: true } } },
  });

  if (!primaryProfile) {
    console.error(`\n❌ No profile found for primary tenant email: ${PRIMARY_TENANT_EMAIL}`);
    console.error("   Check the emails above and update PRIMARY_TENANT_EMAIL in this script.\n");
    return;
  }

  // 3. Find the sharer's TenantProfile
  const sharerProfile = await prisma.tenantProfile.findFirst({
    where: { user: { email: SHARER_EMAIL } },
    include: { user: { select: { name: true } } },
  });

  if (!sharerProfile) {
    console.error(`\n❌ No profile found for sharer email: ${SHARER_EMAIL}`);
    console.error("   Check the emails above and update SHARER_EMAIL in this script.\n");
    return;
  }

  console.log(`\n🔗 Linking:`);
  console.log(`  Sharer  : ${sharerProfile.user?.name} (${SHARER_EMAIL})`);
  console.log(`  Primary : ${primaryProfile.user?.name} (${PRIMARY_TENANT_EMAIL})`);
  console.log(`  Setting primaryTenantId = "${primaryProfile.id}"\n`);

  // 4. Update the sharer
  await prisma.tenantProfile.update({
    where: { id: sharerProfile.id },
    data: { primaryTenantId: primaryProfile.id },
  });

  console.log("✅ Done! The sharer is now correctly linked to their primary tenant.");
  console.log("   Refresh the sharer's dashboard to see the updated message.\n");
}

main()
  .catch((e) => {
    console.error("Script error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
