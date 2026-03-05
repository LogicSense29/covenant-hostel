import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const { 
      name, 
      email, 
      password, 
      phone, 
      role, 
      guarantorName, 
      guarantorPhone, 
      guarantorAddress 
    } = body;

    // Basic validation
    if (!name || !email || !role) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const validRoles = ["TENANT", "LANDLORD", "SERVICE_PROVIDER", "ADMIN"];
    const userRole = validRoles.includes(role) ? role : "TENANT";

    // Role-specific validation
    if (userRole === "TENANT") {
      if (!phone || !guarantorName || !guarantorPhone || !guarantorAddress) {
        return NextResponse.json({ message: "Guarantor details and phone are mandatory for tenants" }, { status: 400 });
      }
    } else {
      if (!password) {
        return NextResponse.json({ message: "Password is required for this role" }, { status: 400 });
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: "Email already exists" }, { status: 400 });
    }
    
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const userStatus = userRole === "TENANT" ? "PENDING" : "ACTIVE";

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          hashedPassword,
          role: userRole,
          status: userStatus,
        },
      });

      if (userRole === "TENANT") {
        await tx.tenantProfile.create({
          data: {
            userId: user.id,
            phone,
            guarantorName,
            guarantorPhone,
            guarantorAddress,
            guarantorIdUrl: body.guarantorIdUrl,
          }
        });
      }

      return user;
    });

    // Send email notification (outside transaction to avoid rolling back on SMTP errors)
    if (userStatus === "PENDING") {
      try {
        const { sendApplicationReceivedEmail } = await import("@/lib/email");
        await sendApplicationReceivedEmail({ email: newUser.email, name: newUser.name });
      } catch (emailError) {
        console.error("Non-fatal: Registration email failed:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: userStatus === "PENDING" ? "Application received. Awaiting approval." : "Account created successfully.",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      }
    });

  } catch (error) {
    console.error("Register API Error Details:", error);
    
    // Check for Prisma unique constraint errors
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || "field";
      return NextResponse.json({ message: `A user with this ${field} already exists.` }, { status: 400 });
    }

    return NextResponse.json({ message: error.message || "Error creating account" }, { status: 500 });
  }
}
