import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LandlordMaintenanceManager from "./LandlordMaintenanceManager";

export const dynamic = "force-dynamic";

export default async function LandlordMaintenancePage() {
  const session = await getServerSession(authOptions);
  
  const tickets = await prisma.maintenanceTicket.findMany({
    include: {
      tenant: {
        include: { user: true }
      },
      provider: {
        include: { user: true }
      },
    },
    orderBy: { createdAt: "desc" }
  });

  // roomId on MaintenanceTicket is a plain string — no relation in schema.
  // Fetch rooms separately and map roomId → roomNumber.
  const roomIds = [...new Set(tickets.map(t => t.roomId).filter(Boolean))];
  const rooms = roomIds.length > 0
    ? await prisma.room.findMany({ where: { id: { in: roomIds } }, select: { id: true, roomNumber: true, block: { select: { name: true } } } })
    : [];
  const roomMap = Object.fromEntries(rooms.map(r => [r.id, { roomNumber: r.roomNumber, blockName: r.block?.name || null }]));

  const ticketsWithRoom = tickets.map(t => ({
    ...t,
    roomNumber: roomMap[t.roomId]?.roomNumber || t.roomId,
    blockName: roomMap[t.roomId]?.blockName || null,
  }));

  const providers = await prisma.serviceProviderProfile.findMany({
    include: { user: true }
  });

  return (
    <div className="max-w-7xl mx-auto">
      <LandlordMaintenanceManager 
        initialTickets={ticketsWithRoom} 
        providers={providers} 
        currentUser={session?.user}
      />
    </div>
  );
}
