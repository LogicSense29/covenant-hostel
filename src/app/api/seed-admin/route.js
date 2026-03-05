import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";


export async function GET(request) {
  try {
    const email = "superadmin@covenanthostel.com";
    const password = "superadmin@covenanthostel.com";
    
    // Check if this specific user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: email }
    });

    if (existingAdmin) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { email: email },
        data: {
          hashedPassword: hashedPassword,
          role: 'ADMIN',
        }
      });
      return NextResponse.json({ success: true, message: "Password updated and role ensured to be ADMIN for existing super admin." });
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          name: "Super Admin",
          email: email,
          hashedPassword: hashedPassword,
          role: 'ADMIN',
        }
      });
      return NextResponse.json({ success: true, message: "Created new Super Admin user." });
    }
  } catch (error) {
    console.error("Error creating super admin:", error);
    return NextResponse.json({ error: "Failed to create super admin" }, { status: 500 });
  }
}
