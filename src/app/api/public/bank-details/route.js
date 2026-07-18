import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Tenant-accessible endpoint — returns only the bank details keys
export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            "BANK_NAME",
            "ACCOUNT_NUMBER",
            "ACCOUNT_NAME",
            "INSPECTION_FEE",
            "INSPECTION_FEE_ENABLED",
          ],
        },
      },
    });

    const obj = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    return NextResponse.json(obj);
  } catch {
    return NextResponse.json({ error: "Failed to fetch bank details" }, { status: 500 });
  }
}
