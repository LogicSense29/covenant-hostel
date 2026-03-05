import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";


export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "LANDLORD" || "ADMIN" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const body = await req.json();
    const { description, amount, isGlobal, roomId } = body;

    if (!description || !amount) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    const rule = await prisma.billingRule.create({
      data: {
        description,
        amount: parseFloat(amount),
        isGlobal: !!isGlobal,
        roomId: isGlobal ? null : roomId
      }
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error("Create billing rule error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
