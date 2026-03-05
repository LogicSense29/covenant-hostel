import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";


export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const { id } = params;

    await prisma.billingRule.delete({
      where: { id }
    });

    return new NextResponse("Rule deleted successfully", { status: 200 });
  } catch (error) {
    console.error("Delete billing rule error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
