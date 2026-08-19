import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const settings = await prisma.systemSetting.findMany();
    
    // Convert array to object { KEY: value }
    const settingsObj = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    // Ensure defaults
    if (settingsObj.INSPECTION_FEE_ENABLED === undefined) settingsObj.INSPECTION_FEE_ENABLED = "true";
    if (settingsObj.INSPECTION_FEE === undefined) settingsObj.INSPECTION_FEE = "5000";
    if (settingsObj.WHATSAPP_REMINDERS_ENABLED === undefined) settingsObj.WHATSAPP_REMINDERS_ENABLED = "false";
    if (settingsObj.GLOBAL_PARTIAL_PAYMENT_ENABLED === undefined) settingsObj.GLOBAL_PARTIAL_PAYMENT_ENABLED = "false";
    if (settingsObj.GLOBAL_PARTIAL_PAYMENT_INSTALLMENTS === undefined) settingsObj.GLOBAL_PARTIAL_PAYMENT_INSTALLMENTS = "3";

    return NextResponse.json(settingsObj);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const { key, value, description } = await request.json();

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value), ...(description !== undefined && { description }) },
      create: { key, value: String(value), description: description || null }
    });

    return NextResponse.json({ success: true, setting });
  } catch (error) {
    console.error("Settings POST error:", error);
    return NextResponse.json({ error: "Failed to save setting" }, { status: 500 });
  }
}
