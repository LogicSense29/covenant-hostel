import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Landlord enables/disables partial payment for a tenant and sets installments
export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const { id } = params; // tenantProfile id

  try {
    const { allowPartialPayment, partialPaymentInstallments } = await req.json();

    if (allowPartialPayment && (!partialPaymentInstallments || partialPaymentInstallments < 1)) {
      return new NextResponse("Installments must be at least 1", { status: 400 });
    }

    const profile = await prisma.tenantProfile.update({
      where: { id },
      data: {
        allowPartialPayment: !!allowPartialPayment,
        partialPaymentInstallments: allowPartialPayment ? parseInt(partialPaymentInstallments) : null,
      },
      include: { user: true },
    });

    return NextResponse.json(profile);
  } catch (err) {
    console.error("Partial payment toggle error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
