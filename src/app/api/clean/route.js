import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const usersWithStays = await prisma.user.findMany({
      where: {
        status: { not: 'REJECTED' } // Check everyone
      },
      include: {
        tenantProfile: {
          include: {
            stayHistory: true,
            payments: true
          }
        }
      }
    });

    const problematicUsers = usersWithStays.filter(u => {
      // Find users with StayHistory who shouldn't have one
      if (!u.tenantProfile) return false;
      if (u.tenantProfile.stayHistory.length === 0) return false;
      
      // If they are not ACTIVE, they probably shouldn't have a stay history 
      // (unless they are a sharer who was approved, but let's just list them)
      if (u.status !== 'ACTIVE') return true;
      
      // If they ARE ACTIVE, do they have approved payments?
      const hasApprovedPayment = u.tenantProfile.payments.some(p => p.status === 'APPROVED' || p.approvedAt);
      if (!hasApprovedPayment && u.tenantProfile.primaryTenantId == null) {
        // They are ACTIVE and have StayHistory, but NO approved payments, and not a sharer!
        // This means they got promoted prematurely!
        return true;
      }
      
      return false;
    });

    return NextResponse.json({ 
      problematicCount: problematicUsers.length,
      users: problematicUsers.map(u => ({
        id: u.id,
        email: u.email,
        status: u.status,
        stayHistoryCount: u.tenantProfile.stayHistory.length,
        payments: u.tenantProfile.payments.map(p => p.status),
        primaryTenantId: u.tenantProfile.primaryTenantId
      }))
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
