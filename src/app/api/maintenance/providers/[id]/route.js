import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  
  // Only Landlords and Admins can delete service providers
  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Provider ID is required" }, { status: 400 });
  }

  try {
    // We run this in a transaction to ensure data integrity
    await prisma.$transaction(async (tx) => {
      // 1. Find the provider to get the associated userId
      const provider = await tx.serviceProviderProfile.findUnique({
        where: { id }
      });

      if (!provider) {
        throw new Error("Provider not found");
      }

      // 2. Safely unassign this provider from any existing maintenance tickets
      // This prevents foreign key constraints from failing when the provider is deleted
      await tx.maintenanceTicket.updateMany({
        where: { providerId: id },
        data: { providerId: null }
      });

      // 3. Delete only the ServiceProviderProfile
      // We do NOT delete the User account because they might be a Tenant (Dual-Profile).
      // This safely revokes their provider access without destroying their identity.
      await tx.serviceProviderProfile.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true, message: "Service provider deleted successfully" });
  } catch (err) {
    console.error("Error deleting service provider:", err);
    if (err.message === "Provider not found") {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete service provider" }, { status: 500 });
  }
}
