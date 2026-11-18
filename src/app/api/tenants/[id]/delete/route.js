import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hardDeleteTenant } from "@/lib/deleteTenant";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/tenants/[id]/delete
 * Hard delete a tenant and all their data (ADMIN only)
 */
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const { id } = await params;

  try {
    const deleted = await hardDeleteTenant(id);

    if (!deleted) {
      return new NextResponse("Tenant not found", { status: 404 });
    }

    console.log(`[ADMIN DELETE] ${deleted.name} (${deleted.email}) deleted by ${session.user.email}`);

    return NextResponse.json({ success: true, message: "Tenant permanently deleted" });
  } catch (error) {
    console.error("Delete tenant error:", error.message);
    return new NextResponse(error.message || "Internal Server Error", { status: 500 });
  }
}
