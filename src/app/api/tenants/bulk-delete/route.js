import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hardDeleteTenant } from "@/lib/deleteTenant";

export const dynamic = "force-dynamic";

/**
 * POST /api/tenants/bulk-delete
 * Permanently delete multiple tenants (ADMIN only)
 */
export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const { tenantIds } = await req.json();

    if (!tenantIds || !Array.isArray(tenantIds) || tenantIds.length === 0) {
      return new NextResponse("tenantIds array is required", { status: 400 });
    }

    let deletedCount = 0;
    const errors = [];

    for (const tenantId of tenantIds) {
      try {
        const deleted = await hardDeleteTenant(tenantId);
        if (deleted) {
          deletedCount++;
          console.log(`[BULK DELETE] ${deleted.name} deleted by ${session.user.email}`);
        }
      } catch (err) {
        errors.push({ tenantId, reason: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} tenant(s)`,
      deletedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
