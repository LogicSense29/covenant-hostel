import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request, { params }) {
  try {
    const { id: ticketId } = await params;
    if (!ticketId) {
      return NextResponse.json({ error: "Missing ticket ID" }, { status: 400 });
    }

    const data = await request.json();
    const { rating, feedback } = data;

    if (rating === undefined) {
      return NextResponse.json({ error: "Missing rating" }, { status: 400 });
    }

    const updatedTicket = await prisma.maintenanceTicket.update({
      where: { id: ticketId },
      data: {
        tenantRating: rating,
        tenantFeedback: feedback || null
      }
    });

    return NextResponse.json(updatedTicket, { status: 200 });
  } catch (error) {
    console.error("Error submitting rating:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
