import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rules = await prisma.billingRule.findMany({
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(rules, { status: 200 });
}
