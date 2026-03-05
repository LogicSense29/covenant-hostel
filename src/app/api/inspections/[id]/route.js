import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";


export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "LANDLORD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;
    const { status, notes, feePaid } = await req.json();

    const inspection = await prisma.inspection.update({
      where: { id },
      data: {
        status,
        notes,
        feePaid
      }
    });

    return NextResponse.json(inspection);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update inspection" }, { status: 500 });
  }
}
