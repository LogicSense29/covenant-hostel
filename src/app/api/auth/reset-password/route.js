import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createRateLimiter, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// 10 attempts per 15 minutes per IP
const limiter = createRateLimiter({ maxAttempts: 10, windowMs: 15 * 60 * 1_000, keyPrefix: "reset-pw" });

export async function POST(req) {
  const ip = getClientIp(req);
  const { allowed, retryAfterSeconds } = limiter.check(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Please try again in ${retryAfterSeconds} seconds.` },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  try {
    const { token, password } = await req.json();

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
      return new NextResponse("Invalid or expired token", { status: 400 });
    }

    if (new Date() > setupToken.expires) {
      await prisma.setupToken.delete({ where: { token } });
      return new NextResponse("Token expired", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: setupToken.userId },
        data: { hashedPassword },
      }),
      prisma.setupToken.delete({ where: { token } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("RESET_PASSWORD_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
