import { prisma } from "@/lib/prisma";
import LandingClient from "@/components/LandingClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Fetch available rooms (those with at least one free bed)
  const availableRooms = await prisma.room.findMany({
    where: {
      NOT: { status: "UNDER_MAINTENANCE" }
    },
    include: {
      block: true,
      tenants: {
        select: {
          id: true,
        }
      },
      billingRules: true,
      specificRules: true,
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  // Fetch all billing rules for resolving fallback precedence (block and global)
  const allBillingRules = await prisma.billingRule.findMany();

  const formattedRooms = availableRooms.map(room => {
    // Find all applicable rules for this room
    const applicableRules = allBillingRules.filter(r => 
      r.roomId === room.id || 
      room.billingRules.some(br => br.id === r.id) ||
      room.specificRules.some(sr => sr.id === r.id) ||
      (r.blockId === room.blockId && r.blockId !== null) ||
      r.isGlobal
    );

    // Sort by precedence: room-specific > block-level > global
    const sortedRules = [...applicableRules].sort((a, b) => {
      const aIsRoom = a.roomId === room.id || room.billingRules.some(br => br.id === a.id) || room.specificRules.some(sr => sr.id === a.id);
      const bIsRoom = b.roomId === room.id || room.billingRules.some(br => br.id === b.id) || room.specificRules.some(sr => sr.id === b.id);
      if (aIsRoom && !bIsRoom) return -1;
      if (!aIsRoom && bIsRoom) return 1;

      const aIsBlock = a.blockId === room.blockId;
      const bIsBlock = b.blockId === room.blockId;
      if (aIsBlock && !bIsBlock) return -1;
      if (!aIsBlock && bIsBlock) return 1;

      return 0;
    });

    const isBaseRent = (r) => {
      const t = String(r.type || "").toUpperCase().replace(/_/g, " ").trim();
      return t === "BASE RENT" || t === "RENT";
    };
    const baseRentRule = sortedRules.find(isBaseRent);
    
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
