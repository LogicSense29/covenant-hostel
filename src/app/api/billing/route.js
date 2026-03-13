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
    const rules = await prisma.billingRule.findMany({
      include: {
        room: true,
        block: true
      },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(rules);
  } catch (error) {
    console.error("Fetch billing rules error", error);
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
    const { description, amount, type, frequency, isGlobal, roomId, blockId } = body;

    if (!description || !amount) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    const ruleAmount = parseFloat(amount);
    const ruleType = type || "ADDITIONAL_CHARGE";

    const rule = await prisma.billingRule.create({
      data: {
        description,
        amount: ruleAmount,
        type: ruleType,
        frequency: frequency || "ONCE",
        isGlobal: !!isGlobal,
        roomId: isGlobal || !roomId || roomId === "" ? null : roomId,
        blockId: isGlobal || !blockId || blockId === "" ? null : blockId
      }
    });

    // Synchronize Room.rentAmount if this rule is a BASE_RENT
    if (ruleType === "BASE_RENT") {
      if (isGlobal) {
        await prisma.room.updateMany({
          data: { rentAmount: ruleAmount }
        });
      } else if (blockId) {
        await prisma.room.updateMany({
          where: { blockId },
          data: { rentAmount: ruleAmount }
        });
      } else if (roomId) {
        await prisma.room.update({
          where: { id: roomId },
          data: { rentAmount: ruleAmount }
        });
      }
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error("Create billing rule error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
