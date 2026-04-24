import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return new NextResponse("Status is required", { status: 400 });
    }

    const guestInspection = await prisma.guestInspection.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json(guestInspection);
  } catch (error) {
    console.error("Update guest inspection error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const { id } = await params;

    await prisma.guestInspection.delete({
      where: { id }
    });

    return new NextResponse("Guest inspection deleted successfully", { status: 200 });
  } catch (error) {
    console.error("Delete guest inspection error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
