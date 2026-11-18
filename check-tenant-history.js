/**
 * Tenant History Diagnostic Tool
 * Checks a tenant's full room assignment and payment history
 * 
 * Usage: node check-tenant-history.js tenant@email.com
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const tenantEmail = process.argv[2];

if (!tenantEmail) {
  console.error("❌ Please provide tenant email as argument");
  console.log("\nUsage: node check-tenant-history.js tenant@email.com");
  process.exit(1);
}

async function checkTenantHistory() {
  console.log(`🔍 Checking history for: ${tenantEmail}\n`);

  try {
    // Fetch user and tenant profile
    const user = await prisma.user.findUnique({
      where: { email: tenantEmail },
      include: {
        tenantProfile: {
          include: {
            room: {
              include: {
                block: { select: { name: true, address: true } }
              }
            },
            primaryTenant: {
              include: { user: { select: { name: true, email: true } } }
            }
          }
        }
      }
    });

    if (!user) {
      console.error("❌ User not found with email:", tenantEmail);
      process.exit(1);
    }

    if (!user.tenantProfile) {
      console.error("❌ User exists but has no tenant profile");
      console.log("User details:", {
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
      });
      process.exit(1);
    }

    const profile = user.tenantProfile;

    console.log("━━━ USER INFORMATION ━━━");
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Status: ${user.status}`);
    console.log(`Account Created: ${user.createdAt}`);
    console.log();

    console.log("━━━ CURRENT TENANCY STATUS ━━━");
    console.log(`Tenant Profile ID: ${profile.id}`);
    console.log(`Phone: ${profile.phone}`);
    console.log(`Room Assigned: ${profile.roomId ? '✅ YES' : '❌ NO'}`);
    
    if (profile.roomId && profile.room) {
      console.log(`Room Number: ${profile.room.roomNumber}`);
      console.log(`Block: ${profile.room.block?.name || 'N/A'}`);
      console.log(`Address: ${profile.room.block?.address || 'N/A'}`);
      console.log(`Capacity: ${profile.room.capacity} bed(s)`);
    }

    if (profile.primaryTenantId) {
      console.log(`⚠️  Room Sharer (Primary: ${profile.primaryTenant?.user?.name || profile.primaryTenantId})`);
    }

    console.log(`Rent Start: ${profile.rentStartDate || 'Not set'}`);
    console.log(`Rent Expiry: ${profile.rentExpiryDate || 'Not set'}`);
    
    if (profile.rentExpiryDate) {
      const daysUntilExpiry = Math.ceil((new Date(profile.rentExpiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry < 0) {
        console.log(`⚠️  EXPIRED ${Math.abs(daysUntilExpiry)} days ago`);
      } else if (daysUntilExpiry === 0) {
        console.log(`⚠️  EXPIRES TODAY`);
      } else {
        console.log(`Expires in: ${daysUntilExpiry} days`);
      }
    }
    console.log();

    // Fetch stay history
    const stayHistory = await prisma.stayHistory.findMany({
      where: { tenantId: profile.id },
      include: {
        room: {
          include: {
            block: { select: { name: true } }
          }
        }
      },
      orderBy: { startDate: 'desc' }
    });

    console.log("━━━ STAY HISTORY ━━━");
    if (stayHistory.length === 0) {
      console.log("❌ No stay history found (tenant never had a room assigned)");
    } else {
      console.log(`Found ${stayHistory.length} stay record(s):\n`);
      stayHistory.forEach((stay, index) => {
        console.log(`Stay #${index + 1}:`);
        console.log(`  Room: ${stay.room?.roomNumber || stay.roomId}`);
        console.log(`  Block: ${stay.room?.block?.name || 'N/A'}`);
        console.log(`  Started: ${stay.startDate}`);
        console.log(`  Ended: ${stay.endDate || '⏳ Current (still active)'}`);
        
        if (stay.endDate) {
          const duration = Math.ceil((new Date(stay.endDate) - new Date(stay.startDate)) / (1000 * 60 * 60 * 24));
          console.log(`  Duration: ${duration} days`);
        }
        console.log();
      });
    }

    // Fetch payment history
    const payments = await prisma.payment.findMany({
      where: { tenantId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log("━━━ RECENT PAYMENTS (Last 10) ━━━");
    if (payments.length === 0) {
      console.log("❌ No payments found");
    } else {
      console.log(`Found ${payments.length} payment(s):\n`);
      payments.forEach((payment, index) => {
        console.log(`Payment #${index + 1}:`);
        console.log(`  Amount: ₦${payment.amount.toLocaleString()}`);
        console.log(`  Status: ${payment.status}`);
        console.log(`  Type: ${payment.type || 'N/A'}`);
        console.log(`  Date: ${payment.createdAt}`);
        console.log(`  Reference: ${payment.paystackReference || 'N/A'}`);
        console.log();
      });

      // Calculate total paid
      const totalPaid = payments
        .filter(p => p.status === 'VERIFIED' || p.status === 'SUCCESS')
        .reduce((sum, p) => sum + p.amount, 0);
      console.log(`💰 Total Verified Payments: ₦${totalPaid.toLocaleString()}`);
    }
    console.log();

    // Fetch recurring charges
    const charges = await prisma.recurringCharge.findMany({
      where: { tenantId: profile.id },
      orderBy: { dueDate: 'asc' }
    });

    console.log("━━━ RECURRING CHARGES ━━━");
    if (charges.length === 0) {
      console.log("✅ No recurring charges");
    } else {
      console.log(`Found ${charges.length} charge(s):\n`);
      
      const unpaid = charges.filter(c => c.status === 'UNPAID' || c.status === 'OVERDUE');
      const paid = charges.filter(c => c.status === 'VERIFIED');
      
      if (unpaid.length > 0) {
        console.log(`⚠️  UNPAID (${unpaid.length}):`);
        unpaid.forEach((charge, index) => {
          console.log(`  ${index + 1}. ${charge.description || charge.billingRuleId}`);
          console.log(`     Amount: ₦${charge.amount.toLocaleString()}`);
          console.log(`     Due: ${charge.dueDate}`);
          console.log(`     Status: ${charge.status}`);
        });
        console.log();
      }
      
      if (paid.length > 0) {
        console.log(`✅ PAID (${paid.length}):`);
        paid.forEach((charge, index) => {
          console.log(`  ${index + 1}. ${charge.description || charge.billingRuleId}`);
          console.log(`     Amount: ₦${charge.amount.toLocaleString()}`);
          console.log(`     Paid: ${charge.paidAt || 'N/A'}`);
        });
      }
    }
    console.log();

    // Summary
    console.log("━━━ DIAGNOSIS ━━━");
    
    if (!profile.roomId) {
      console.log("❌ ISSUE: Tenant has NO room assigned");
      
      if (stayHistory.length > 0) {
        const lastStay = stayHistory[0];
        if (lastStay.endDate) {
          console.log(`⚠️  Tenant WAS in Room ${lastStay.room?.roomNumber || lastStay.roomId}`);
          console.log(`   Tenancy ended: ${lastStay.endDate}`);
          console.log(`   Possible reasons:`);
          console.log(`   1. Landlord manually ended tenancy`);
          console.log(`   2. Tenant did not renew/pay rent`);
          console.log(`   3. Tenant was evicted`);
        }
      } else {
        console.log("⚠️  Tenant NEVER had a room assigned");
        console.log(`   Status: ${user.status}`);
        console.log(`   Possible reasons:`);
        console.log(`   1. Application approved but room not assigned yet`);
        console.log(`   2. Tenant is waiting for landlord to assign room`);
      }
    } else {
      console.log("✅ Tenant currently has a room assigned");
      
      if (profile.rentExpiryDate && new Date(profile.rentExpiryDate) < new Date()) {
        console.log("⚠️  But rent is EXPIRED - needs renewal");
      } else {
        console.log("✅ Rent is active/valid");
      }
    }

  } catch (error) {
    console.error("\n❌ Error occurred:");
    console.error(error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTenantHistory();
