import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const blocks = await prisma.block.findMany({
      include: {
        rooms: {
          where: {
            status: "AVAILABLE"
          },
          select: {
            id: true,
            roomNumber: true,
            capacity: true,
            rentAmount: true,
            status: true
          },
          orderBy: { roomNumber: "asc" }
        }
      },
      orderBy: { name: "asc" }
    });
    return NextResponse.json(blocks);
  } catch (error) {
    console.error("List public blocks error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
