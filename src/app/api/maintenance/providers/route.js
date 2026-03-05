import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";


export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "LANDLORD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const providers = await prisma.serviceProviderProfile.findMany({
    include: {
      user: true
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(providers);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "LANDLORD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, email, phone, specialty, availability, password } = await req.json();

    // Create User first
    const hashedPassword = await bcrypt.hash(password || "Provider123!", 10);
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        role: "SERVICE_PROVIDER",
        serviceProviderProfile: {
          create: {
            phone,
            specialty,
            availability
          }
        }
      }
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create provider" }, { status: 500 });
  }
}
