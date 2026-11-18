import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * POST /api/tenants/[id]/archive
 * Archive a tenant (landlord/admin only)
 */
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const { id } = params;

  try {
    const tenant = await prisma.tenantProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!tenant) {
      return new NextResponse("Tenant not found", { status: 404 });
    }

    if (tenant.user.status === "ARCHIVED") {
      return new NextResponse("Tenant is already archived", { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: tenant.userId },
        data: { status: "ARCHIVED" },
      });

      await tx.tenantProfile.update({
        where: { id },
        data: { archivedAt: new Date() },
      });

      await createNotification({
        userId: tenant.userId,
        title: "Tenancy Archived",
        message: "Your tenancy has been archived by management. Contact the office for details.",
        type: "SYSTEM",
      });
    });

    return NextResponse.json({ success: true, message: "Tenant archived successfully" });
  } catch (error) {
    console.error("Archive tenant error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

/**
 * DELETE /api/tenants/[id]/archive
 * Unarchive a tenant (landlord/admin only)
 */
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const { id } = params;

  try {
    const tenant = await prisma.tenantProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!tenant) {
      return new NextResponse("Tenant not found", { status: 404 });
    }

    if (tenant.user.status !== "ARCHIVED") {
      return new NextResponse("Tenant is not archived", { status: 400 });
    }

    // Determine the appropriate status to restore to
    let newStatus = "AWAITING_PAYMENT";
    
    if (tenant.rentExpiryDate) {
      const now = new Date();
      if (tenant.rentExpiryDate > now) {
        newStatus = "ACTIVE";
      } else {
        newStatus = "EXPIRED";
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: tenant.userId },
        data: { status: newStatus },
      });

      await tx.tenantProfile.update({
        where: { id },
        data: { archivedAt: null },
      });

      await createNotification({
        userId: tenant.userId,
        title: "Tenancy Restored",
        message: "Your tenancy has been restored from archive. You now have access to your account.",
        type: "SYSTEM",
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: "Tenant unarchived successfully",
      newStatus 
    });
  } catch (error) {
    console.error("Unarchive tenant error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
