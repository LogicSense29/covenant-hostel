import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MaintenanceStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = params;

  try {
    const ticket = await prisma.maintenanceTicket.findUnique({ where: { id } });

    if (!ticket) return new NextResponse("Ticket not found", { status: 404 });

    const profile = await prisma.tenantProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile || ticket.tenantId !== profile.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (ticket.status !== MaintenanceStatus.OPEN) {
      return new NextResponse("Only open tickets can be cancelled", { status: 400 });
    }
    if (ticket.providerId) {
      return new NextResponse("Ticket already assigned — contact management to cancel", { status: 400 });
    }

    const updated = await prisma.maintenanceTicket.update({
      where: { id },
      data: { status: MaintenanceStatus.CANCELLED },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Cancel ticket error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
