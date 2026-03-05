import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let inspections;
    if (session.user.role === "LANDLORD") {
      inspections = await prisma.inspection.findMany({
        include: {
          tenant: { include: { user: true } },
          room: true
        },
        orderBy: { date: "desc" }
      });
    } else {
      const profile = await prisma.tenantProfile.findUnique({
        where: { userId: session.user.id }
      });
      inspections = await prisma.inspection.findMany({
        where: { tenantId: profile.id },
        include: { room: true },
        orderBy: { date: "desc" }
      });
    }

    return NextResponse.json(inspections);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch inspections" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "LANDLORD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { tenantId, roomId, date, notes } = await req.json();

    const inspection = await prisma.inspection.create({
      data: {
        tenantId,
        roomId,
        date: new Date(date),
        notes,
        status: "PENDING"
      }
    });

    return NextResponse.json(inspection, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create inspection" }, { status: 500 });
  }
}
