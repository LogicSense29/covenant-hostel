import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    // Only update fields that were explicitly sent — don't overwrite existing data with undefined
    const data = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.feePaid !== undefined) data.feePaid = body.feePaid;

    const inspection = await prisma.inspection.update({
      where: { id },
      data,
      include: {
        tenant: { include: { user: true } },
        room: { include: { block: true } },
      },
    });

    return NextResponse.json(inspection);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update inspection" }, { status: 500 });
  }
}
