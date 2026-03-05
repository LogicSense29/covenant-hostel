import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { roomNumber, rentAmount, status } = body;

    const existingId = await prisma.room.findUnique({ where: { id } });
    if (!existingId) {
      return new NextResponse("Room not found", { status: 404 });
    }

    if (roomNumber !== existingId.roomNumber) {
      const existingNum = await prisma.room.findUnique({ where: { roomNumber } });
      if (existingNum) {
        return new NextResponse("Room number already exists", { status: 400 });
      }
    }

    const room = await prisma.room.update({
      where: { id },
      data: {
        roomNumber,
        rentAmount: rentAmount ? parseFloat(rentAmount) : existingId.rentAmount,
        status: status || existingId.status
      }
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error("Update room error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const { id } = await params;

    const room = await prisma.room.findUnique({
      where: { id },
      include: { tenant: true }
    });

    if (!room) {
      return new NextResponse("Room not found", { status: 404 });
    }

    if (room.tenant && room.status === "OCCUPIED") {
       return new NextResponse("Cannot delete an occupied room", { status: 400 });
    }

    await prisma.room.delete({
      where: { id }
    });

    return new NextResponse("Room deleted successfully", { status: 200 });
  } catch (error) {
    console.error("Delete room error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
