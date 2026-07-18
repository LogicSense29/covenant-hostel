import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !["LANDLORD", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  // Build the dynamic where clause
  let whereClause = {};

  if (search) {
    whereClause.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { phone: { contains: search } },
      { guarantorName: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
    const now = new Date();
    
    if (status === "EXPIRING_7") {
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      whereClause.rentExpiryDate = {
        gt: now,
        lte: sevenDaysFromNow,
      };
    } else if (status === "EXPIRING_14") {
      const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      whereClause.rentExpiryDate = {
        gt: now,
        lte: fourteenDaysFromNow,
      };
    } else if (status === "EXPIRING_30") {
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      whereClause.rentExpiryDate = {
        gt: now,
        lte: thirtyDaysFromNow,
      };
    } else if (status === "EXPIRED_TENANT") {
      whereClause.user = {
        ...(whereClause.user || {}),
        status: "EXPIRED"
      };
    } else {
      whereClause.user = {
        ...(whereClause.user || {}),
        status: status
      };
    }
  }

  const queryParams = {
    where: whereClause,
    take: limit + 1, // Fetch one extra to determine nextCursor
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      room: {
        include: { block: true }
      },
      stayHistory: {
        include: {
          room: {
            include: { block: true }
          }
        },
        orderBy: { startDate: "desc" }
      },
      payments: {
        orderBy: { createdAt: "desc" }
      },
      primaryTenant: { 
        include: { 
          user: true,
          room: { include: { block: true } }
        } 
      }
    }
  };

  if (cursor) {
    queryParams.cursor = { id: cursor };
    queryParams.skip = 1; // Skip the cursor itself
  }

  try {
    const tenants = await prisma.tenantProfile.findMany(queryParams);

    let nextCursor = null;
    if (tenants.length > limit) {
      const nextItem = tenants.pop(); // Remove the extra item
      nextCursor = nextItem.id;
    }

    return NextResponse.json({ data: tenants, nextCursor });
  } catch (error) {
    console.error("Error fetching tenants:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
