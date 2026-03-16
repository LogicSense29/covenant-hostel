import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";


export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { roomNumber, rentAmount, status, capacity, rentExpiryDate, blockId, imageUrl, billingRuleIds = [] } = body;

    const existingRoom = await prisma.room.findUnique({ 
      where: { id },
      include: { billingRules: true }
    });
    if (!existingRoom) {
      return new NextResponse("Room not found", { status: 404 });
    }

    // Check for duplicate room number in the target block
    if (roomNumber !== existingRoom.roomNumber || blockId !== existingRoom.blockId) {
      const duplicate = await prisma.room.findFirst({
        where: {
          roomNumber,
          blockId: blockId || null,
          NOT: { id }
        }
      });
      if (duplicate) {
        return new NextResponse("Room number already exists in this block", { status: 400 });
      }
    }

    // Calculate billing rule changes
    const currentRuleIds = existingRoom.billingRules.map(r => r.id);
    const toDisconnect = currentRuleIds.filter(id => !billingRuleIds.includes(id));
    const toConnect = billingRuleIds.filter(id => !currentRuleIds.includes(id));

    const room = await prisma.room.update({
      where: { id },
      data: {
        roomNumber,
        rentAmount: rentAmount ? parseFloat(rentAmount) : existingRoom.rentAmount,
        status: status || existingRoom.status,
        capacity: capacity ? parseInt(capacity) : existingRoom.capacity,
        rentExpiryDate: rentExpiryDate ? new Date(rentExpiryDate) : null,
        blockId: blockId || null,
        imageUrl: imageUrl !== undefined ? imageUrl : existingRoom.imageUrl,
        billingRules: {
          disconnect: toDisconnect.map(id => ({ id })),
          connect: toConnect.map(id => ({ id }))
        }
      },
      include: {
        billingRules: true
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
      include: { tenants: true }
    });

    if (!room) {
      return new NextResponse("Room not found", { status: 404 });
    }

    if (room.tenants.length > 0 && room.status === "OCCUPIED") {
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
