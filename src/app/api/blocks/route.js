import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const blocks = await prisma.block.findMany({
      include: {
        _count: {
          select: { rooms: true }
        }
      },
      orderBy: { name: "asc" }
    });
    return NextResponse.json(blocks);
  } catch (error) {
    console.error("List blocks error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, description, imageUrl } = body;

    if (!name) {
      return new NextResponse("Missing block name", { status: 400 });
    }

    const block = await prisma.block.create({
      data: {
        name,
        description,
        imageUrl: imageUrl || null
      }
    });

    return NextResponse.json(block);
  } catch (error) {
    console.error("Create block error", error);
    if (error.code === 'P2002') {
      return new NextResponse("Block with this name already exists", { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
