import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — fetch all recurring charges for the logged-in tenant
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.tenantProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const charges = await prisma.recurringCharge.findMany({
    where: { tenantId: profile.id },
    include: { billingRule: true, payment: true },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(charges);
}
