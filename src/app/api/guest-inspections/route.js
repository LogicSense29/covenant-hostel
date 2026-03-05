import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";


export async function POST(request) {
  try {
    const data = await request.json();
    const { name, email, phone, date } = data;

    if (!name || !email || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const inspection = await prisma.guestInspection.create({
      data: {
        name,
        email,
        phone,
        date: new Date(date),
        status: "PENDING",
        feePaid: false,
      }
    });

    const feeSetting = await prisma.systemSetting.findUnique({
      where: { key: "INSPECTION_FEE" }
    });
    const feeAmount = feeSetting ? parseFloat(feeSetting.value) : 5000;

    return NextResponse.json({ success: true, inspection, feeAmount });
  } catch (error) {
    console.error("Error creating guest inspection:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const inspections = await prisma.guestInspection.findMany({
      orderBy: { createdAt: "desc" }
    });
    
    return NextResponse.json(inspections);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch guest inspections" }, { status: 500 });
  }
}
