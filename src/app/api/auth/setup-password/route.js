import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return new NextResponse("Missing token or password", { status: 400 });
    }

    if (password.length < 6) {
      return new NextResponse("Password must be at least 6 characters", { status: 400 });
    }

    const setupToken = await prisma.setupToken.findUnique({
      where: { token },
    });

    if (!setupToken) {
      return new NextResponse("Invalid token", { status: 400 });
    }

    if (new Date() > setupToken.expires) {
      await prisma.setupToken.delete({ where: { token } });
      return new NextResponse("Token expired", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: setupToken.userId },
        data: {
          hashedPassword,
          status: "ACTIVE"
        }
      }),
      prisma.setupToken.delete({
        where: { token }
      })
    ]);

    return NextResponse.json({ success: true, message: "Password set and account activated." });

  } catch (error) {
    console.error("SETUP_PASSWORD_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
