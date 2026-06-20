import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const { amount, type, description, frequency, isGlobal, isOptional, roomId, blockId } = await req.json();
    const ruleAmount = parseFloat(amount);
    const ruleType = type || "ADDITIONAL_CHARGE";

    // Duplicate check (excluding current rule)
    const existingRule = await prisma.billingRule.findFirst({
      where: {
        id: { not: id },
        description,
        amount: ruleAmount,
        isGlobal: !!isGlobal,
        roomId: isGlobal || !roomId || roomId === "" ? null : roomId,
        blockId: isGlobal || !blockId || blockId === "" ? null : blockId
      }
    });

    if (existingRule) {
      return new NextResponse("Another billing rule with this description, amount and scope already exists.", { status: 400 });
    }

    const rule = await prisma.billingRule.update({
      where: { id },
      data: {
        description,
        amount: ruleAmount,
        type: ruleType,
        frequency: frequency || "ONCE",
        isGlobal: !!isGlobal,
        isOptional: !!isOptional,
        roomId: isGlobal || !roomId || roomId === "" ? null : roomId,
        blockId: isGlobal || !blockId || blockId === "" ? null : blockId
      }
    });

    // Synchronize Room.rentAmount if this rule is a BASE_RENT
    if (ruleType === "BASE_RENT" || ruleType === "Base Rent") {
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
    console.error("Update billing rule error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    await prisma.billingRule.delete({
      where: { id }
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Delete billing rule error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
