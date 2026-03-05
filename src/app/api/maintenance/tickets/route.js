import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";


export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let tickets;
    if (session.user.role === "TENANT") {
      const profile = await prisma.tenantProfile.findUnique({
        where: { userId: session.user.id }
      });
      tickets = await prisma.maintenanceTicket.findMany({
        where: { tenantId: profile.id },
        orderBy: { createdAt: "desc" },
        include: { provider: { include: { user: true } } }
      });
    } else if (session.user.role === "LANDLORD") {
      tickets = await prisma.maintenanceTicket.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          tenant: { include: { user: true } },
          provider: { include: { user: true } }
        }
      });
    }

    return NextResponse.json(tickets);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { issueDescription, category } = await req.json();
    
    // Find Tenant Profile
    const profile = await prisma.tenantProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!profile || !profile.roomId) {
      return NextResponse.json({ error: "No room allocated" }, { status: 400 });
    }

    const ticket = await prisma.maintenanceTicket.create({
      data: {
        issueDescription,
        category: category || "MAINTENANCE",
        roomId: profile.roomId,
        tenantId: profile.id,
        status: "OPEN"
      }
    });

    return NextResponse.json(ticket, { status: 201 });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
