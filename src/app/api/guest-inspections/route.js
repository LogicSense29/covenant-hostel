import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";


export async function POST(request) {
  try {
    const data = await request.json();
    const { name, email, phone, date, roomNumber, blockName, address } = data;

    if (!name || !email || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: ["INSPECTION_FEE", "INSPECTION_FEE_ENABLED"] } }
    });

    const settingsObj = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    const isEnabled = settingsObj.INSPECTION_FEE_ENABLED !== "false";
    const feeAmount = isEnabled ? parseFloat(settingsObj.INSPECTION_FEE || "5000") : 0;
    const isFree = feeAmount === 0;

    const inspection = await prisma.guestInspection.create({
      data: {
        name,
        email,
        phone,
        date: new Date(date),
        roomNumber: roomNumber || null,
        blockName: blockName || null,
        address: address || null,
        status: isFree ? "CONFIRMED" : "PENDING",
        feePaid: isFree ? true : false,
      }
    });

    // Send email notifications
    try {
      const { sendGuestInspectionConfirmation, sendLandlordInspectionAlert } = await import("@/lib/email");
      
      // Send confirmation to guest
      await sendGuestInspectionConfirmation({
        email,
        name,
        date,
        roomNumber,
        blockName,
        address,
        amount: feeAmount,
      });

      // Send alert to landlord
      await sendLandlordInspectionAlert({
        name,
        email,
        phone,
        date,
        roomNumber,
        blockName,
        address,
        amount: feeAmount,
      });
    } catch (emailError) {
      console.error("Non-fatal: Inspection email failed:", emailError);
    }

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
