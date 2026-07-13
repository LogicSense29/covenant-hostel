import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * DELETE /api/admin/fix-stay-history
 * 
 * Finds all ACTIVE StayHistory records that belong to tenants
 * whose user account is NOT actually ACTIVE, and deletes them.
 * These are orphaned records left over from premature room assignment.
 */
export async function GET() {
  try {
    // Find ACTIVE stay records where the owning tenant's user is NOT ACTIVE
    const orphanedStays = await prisma.stayHistory.findMany({
      where: {
        status: 'ACTIVE',
        tenant: {
          user: {
            status: { not: 'ACTIVE' }
          }
        }
      },
      include: {
        tenant: {
          include: { user: { select: { email: true, status: true } } }
        }
      }
    });

    if (orphanedStays.length === 0) {
      return NextResponse.json({ message: 'No orphaned stay records found. All clean!', deletedCount: 0 });
    }

    const ids = orphanedStays.map((s) => s.id);

    await prisma.stayHistory.deleteMany({
      where: { id: { in: ids } }
    });

    return NextResponse.json({
      success: true,
      deletedCount: ids.length,
      affected: orphanedStays.map((s) => ({
        stayId: s.id,
        email: s.tenant.user.email,
        userStatus: s.tenant.user.status,
      }))
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
