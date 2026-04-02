import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Adjust based on your prisma setup

export const dynamic = "force-dynamic";


export async function GET(request) {
  try {
    const settings = await prisma.systemSetting.findMany();
    
    // Convert array to object { KEY: value }
    const settingsObj = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    // Ensure defaults
    if (settingsObj.INSPECTION_FEE_ENABLED === undefined) {
      settingsObj.INSPECTION_FEE_ENABLED = "true";
    }
    if (settingsObj.INSPECTION_FEE === undefined) {
      settingsObj.INSPECTION_FEE = "5000";
    }

    return NextResponse.json(settingsObj);
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
    console.error("Settings POST error:", error);
    return NextResponse.json({ error: "Failed to save setting" }, { status: 500 });
  }
}
