import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Adjust based on your prisma setup

export const dynamic = "force-dynamic";


export async function GET(request) {
  try {
    const feeSetting = await prisma.systemSetting.findUnique({
      where: { key: "INSPECTION_FEE" },
    });

    return NextResponse.json({
      INSPECTION_FEE: feeSetting ? feeSetting.value : "5000"
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { key, value, description } = await request.json();

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description }
    });

    return NextResponse.json({ success: true, setting });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save setting" }, { status: 500 });
  }
}
