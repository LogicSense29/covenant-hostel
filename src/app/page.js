import { prisma } from "@/lib/prisma";
import LandingClient from "@/components/LandingClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Fetch available rooms (those with at least one free bed)
  const availableRooms = await prisma.room.findMany({
    where: { NOT: { status: "UNDER_MAINTENANCE" } },
    include: {
      block: true,
      tenants: { 
        where: { user: { status: { notIn: ["REJECTED", "EXPIRED"] } } },
        select: { id: true } 
      },
      billingRules: true,
    },
    orderBy: { createdAt: "desc" }
  });

  const formattedRooms = availableRooms.map(room => {
    const isBaseRent = (r) => {
      const t = String(r.type || "").toUpperCase().replace(/_/g, " ").trim();
      return t === "BASE RENT" || t === "RENT";
    };

    // Only look at rules explicitly ticked on this room (many-to-many billingRules).
    // This is the landlord's intentional selection — no global/block fallback merging.
    const baseRentRule = room.billingRules.find(isBaseRent) || null;

    // Merge features from both room and block
    const mergedFeatures = [
      ...new Set([
        ...(room.features || []),
        ...(room.block?.features || []),
      ])
    ];

    return {
      ...room,
      baseRentRule,
      features: mergedFeatures,
    };
  });

  // Filter to ensure only rooms with actual free beds are shown as primary discovery
  const filteredRooms = formattedRooms.filter(room => room.tenants.length < room.capacity);

  return <LandingClient initialRooms={filteredRooms} />;
}
