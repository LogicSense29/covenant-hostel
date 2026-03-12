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
    const { name, description, imageUrl } = body;

    if (!name) {
      return new NextResponse("Missing block name", { status: 400 });
    }

    const block = await prisma.block.update({
      where: { id },
      data: {
        name,
        description,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined
      }
    });

    return NextResponse.json(block);
  } catch (error) {
    console.error("Update block error", error);
    if (error.code === 'P2002') {
      return new NextResponse("Block with this name already exists", { status: 400 });
    }
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

    // Check if block has rooms
    const roomCount = await prisma.room.count({
      where: { blockId: id }
    });

    if (roomCount > 0) {
      return new NextResponse("Cannot delete block with associated rooms. Please move or delete the rooms first.", { status: 400 });
    }

    await prisma.block.delete({
      where: { id }
    });

    return new NextResponse("Block deleted", { status: 200 });
  } catch (error) {
    console.error("Delete block error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
