import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendInspectionReceipt, sendAdminInspectionAlert } from "@/lib/email";


export async function POST(request) {
  try {
    const { reference, inspectionId, amount } = await request.json();

    if (!reference || !inspectionId) {
      return NextResponse.json({ error: "Missing reference or inspection ID" }, { status: 400 });
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.error("CRITICAL ERROR: PAYSTACK_SECRET_KEY is missing from environment variables.");
      return NextResponse.json({ error: "System configuration error. Please contact the administrator." }, { status: 500 });
    }

    console.log(`Verifying Paystack reference: ${reference}`);

    // Create a controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    // Verify transaction via Paystack
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);



    const paystackData = await paystackRes.json();
    console.log(`Paystack verification response status:`, paystackData.status);

    if (paystackData.status && paystackData.data.status === "success") {
      console.log("Paystack reported success. Updating DB...");
      // Find the pending inspection
      const pendingInspection = await prisma.guestInspection.findUnique({
         where: { id: inspectionId }
      });

      if (!pendingInspection) {
         console.error(`DB Error: Inspection record with ID ${inspectionId} not found.`);
         return NextResponse.json({ error: "Inspection record not found" }, { status: 404 });
      }

      // Update the database record
      const updatedInspection = await prisma.guestInspection.update({
        where: { id: inspectionId },
        data: {
          feePaid: true,
          paymentRef: reference,
          amountPaid: amount,
        },
      });
      console.log("DB Update Success:", updatedInspection.id);

      // Send guest receipt and admin notification asynchronously
      sendInspectionReceipt({
        email: updatedInspection.email,
        name: updatedInspection.name,
        date: updatedInspection.date,
        reference: reference,
        amount: amount,
      }).then(() => console.log("Guest receipt sent"))
        .catch(err => console.error("Guest receipt failed:", err));

      sendAdminInspectionAlert({
        name: updatedInspection.name,
        email: updatedInspection.email,
        phone: updatedInspection.phone,
        date: updatedInspection.date,
        reference: reference,
        amount: amount,
      }).then(() => console.log("Admin alert sent"))
        .catch(err => console.error("Admin alert failed:", err));

      return NextResponse.json({ success: true, message: "Payment verified successfully" });

    } else {
      console.error("Paystack verification failed. Data:", JSON.stringify(paystackData, null, 2));
      return NextResponse.json({ error: "Payment verification failed or was declined." }, { status: 400 });
    }
  } catch (error) {
    console.error("CRITICAL EXCEPTION during verification:", error);
    return NextResponse.json({ error: "Internal Server Error during verification" }, { status: 500 });
  }

}
