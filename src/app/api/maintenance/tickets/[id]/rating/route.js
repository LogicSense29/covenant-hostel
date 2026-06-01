import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TENANT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: ticketId } = await params;
    if (!ticketId) {
      return NextResponse.json({ error: "Missing ticket ID" }, { status: 400 });
    }

    const { rating, feedback } = await request.json();

    if (rating === undefined) {
      return NextResponse.json({ error: "Missing rating" }, { status: 400 });
    }

    // Ensure the ticket belongs to this tenant
    const profile = await prisma.tenantProfile.findUnique({
      where: { userId: session.user.id }
    });
    const ticket = await prisma.maintenanceTicket.findUnique({ where: { id: ticketId } });

    if (!ticket || !profile || ticket.tenantId !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedTicket = await prisma.maintenanceTicket.update({
      where: { id: ticketId },
      data: { tenantRating: rating, tenantFeedback: feedback || null }
    });

    return NextResponse.json(updatedTicket, { status: 200 });
  } catch (error) {
    console.error("Error submitting rating:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
