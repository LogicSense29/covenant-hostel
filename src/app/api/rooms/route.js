import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const body = await req.json();
    const { roomNumber, rentAmount, status } = body;

    if (!roomNumber || !rentAmount) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    const existing = await prisma.room.findUnique({
      where: { roomNumber }
    });

    if (existing) {
      return new NextResponse("Room number already exists", { status: 400 });
    }

    const room = await prisma.room.create({
      data: {
        roomNumber,
        rentAmount: parseFloat(rentAmount),
        status: status || "AVAILABLE"
      }
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error("Create room error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
