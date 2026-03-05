import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";


export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { amount, receiptUrl, isPartial, tenantId } = body;

    if (!amount || !tenantId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Verify the user is the tenant or an admin/landlord
    const tenant = await prisma.tenantProfile.findUnique({
      where: { id: tenantId },
      include: { user: true }
    });

    if (session.user.id !== tenant.userId && session.user.role !== "LANDLORD" && session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const payment = await prisma.payment.create({
      data: {
        amount,
        receiptUrl,
        isPartial: !!isPartial,
        tenantId
      }
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Payment error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(req) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const payments = await prisma.payment.findMany({
      include: {
        tenant: {
          include: { user: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Fetch payments error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
