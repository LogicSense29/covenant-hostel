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
  const block = searchParams.get("block") || "";
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const isArchivedFilter = status === "ARCHIVED";

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
      whereClause.rentExpiryDate = { gt: now, lte: sevenDaysFromNow };
    } else if (status === "EXPIRING_14") {
      const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      whereClause.rentExpiryDate = { gt: now, lte: fourteenDaysFromNow };
    } else if (status === "EXPIRING_30") {
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      whereClause.rentExpiryDate = { gt: now, lte: thirtyDaysFromNow };
    } else if (status === "EXPIRED_TENANT") {
      whereClause.user = { ...(whereClause.user || {}), status: "EXPIRED" };
    } else if (status === "INSTALLMENTS") {
      whereClause.allowPartialPayment = true;
    } else if (status === "ARCHIVED") {
      // handled below via archivedAt filter
    } else {
      whereClause.user = { ...(whereClause.user || {}), status: status };
    }
  }

  // Filter by block
  if (block) {
    whereClause.room = {
      ...(whereClause.room || {}),
      block: { name: { equals: block, mode: "insensitive" } },
    };
  }

  const buildQueryParams = (includeArchivedFilter) => ({
    where: {
      ...whereClause,
      // Only add archivedAt filter when the column exists (post-migration)
      ...(includeArchivedFilter
        ? isArchivedFilter
          ? { archivedAt: { not: null } }
          : { archivedAt: null }
        : {}),
    },
    take: limit + 1,
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      room: { include: { block: true } },
      stayHistory: {
        include: { room: { include: { block: true } } },
        orderBy: { startDate: "desc" },
      },
      payments: { orderBy: { createdAt: "desc" } },
      primaryTenant: {
        include: {
          user: true,
          room: { include: { block: true } },
        },
      },
      recurringCharges: {
        where: { billingRuleId: "__system_rent_installment__" },
        orderBy: { dueDate: "asc" },
      },
    },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  try {
    // Try with archivedAt filter first (works once db push has run)
    let tenants;
    try {
      tenants = await prisma.tenantProfile.findMany(buildQueryParams(true));
    } catch (migrationErr) {
      // archivedAt column doesn't exist yet — fall back to query without it
      console.warn("[tenants] archivedAt column missing, running without archive filter:", migrationErr?.message);
      tenants = await prisma.tenantProfile.findMany(buildQueryParams(false));
    }

    let nextCursor = null;
    if (tenants.length > limit) {
      const nextItem = tenants.pop();
      nextCursor = nextItem.id;
    }

    return NextResponse.json({ data: tenants, nextCursor });
  } catch (error) {
    console.error("Error fetching tenants:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
