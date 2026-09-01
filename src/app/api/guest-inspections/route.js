import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendGuestInspectionConfirmation, sendLandlordInspectionAlert } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const data = await request.json();
    const { name, email, phone, date, roomNumber, blockName, address, receiptUrl } = data;

    if (!name || !email || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check for duplicate booking - same email and date within 24 hours
    const existingBooking = await prisma.guestInspection.findFirst({
      where: {
        email: email.toLowerCase(),
        date: {
          gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(date).setHours(23, 59, 59, 999))
        }
      }
    });

    if (existingBooking) {
      return NextResponse.json({ 
        error: "You already have an inspection booked for this date. Please choose a different date or contact us to modify your booking." 
      }, { status: 400 });
    }

    // Rate limiting - check if email has booked more than 3 times in the last 7 days
    const recentBookings = await prisma.guestInspection.count({
      where: {
        email: email.toLowerCase(),
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        }
      }
    });

    if (recentBookings >= 3) {
      return NextResponse.json({ 
        error: "You have reached the maximum number of inspection bookings. Please contact us for assistance." 
      }, { status: 429 });
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
        email: email.toLowerCase(),
        phone,
        date: new Date(date),
        roomNumber: roomNumber || null,
        blockName: blockName || null,
        address: address || null,
        status: "PENDING",
        feePaid: false,
        amountPaid: feeAmount,
        receiptUrl: receiptUrl || null,
      }
    });

    // Send email notifications
    try {
      if (isFree) {
        // Free: Auto-confirm and send confirmation
        await sendGuestInspectionConfirmation({
          email,
          name,
          date,
          roomNumber,
          blockName,
          address,
          amount: feeAmount,
        });
      } else {
        // Paid: Send pending receipt email
        const { sendInspectionReceipt } = await import("@/lib/email");
        await sendInspectionReceipt({
          email,
          name,
          date,
          reference: "Manual Bank Transfer",
          isFree: false,
          amount: feeAmount,
        });
      }

      // Always send alert to landlord when a booking happens
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
