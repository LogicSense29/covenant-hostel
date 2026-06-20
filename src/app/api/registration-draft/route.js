import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/registration-draft?email=xxx — retrieve draft by email
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) return NextResponse.json(null);

  try {
    const draft = await prisma.registrationDraft.findUnique({ where: { email } });
    return NextResponse.json(draft);
  } catch {
    return NextResponse.json(null);
  }
}

// POST /api/registration-draft — upsert draft
export async function POST(req) {
  try {
    const { email, data, step } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const draft = await prisma.registrationDraft.upsert({
      where: { email },
      update: { data, step, updatedAt: new Date() },
      create: { email, data, step },
    });

    return NextResponse.json(draft);
  } catch (err) {
    console.error("Draft save error:", err);
    return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
  }
}

// DELETE /api/registration-draft?email=xxx — clean up after successful submission
export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) return NextResponse.json({ ok: true });

  try {
    await prisma.registrationDraft.deleteMany({ where: { email } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // non-fatal
  }
}
