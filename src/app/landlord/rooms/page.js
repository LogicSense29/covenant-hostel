import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Home, ExternalLink } from "lucide-react";
import RoomFilters from "./RoomFilters";
import RoomCard from "@/components/RoomCard";


export const dynamic = "force-dynamic";

export default async function RoomsPage({ searchParams }) {
  const params = await searchParams;
  const search = params.search || "";
  const status = params.status || "";
  const blockId = params.blockId || "";

  const where = {};
  
  if (status) {
    where.status = status;
  }

  if (blockId) {
    where.blockId = blockId;
  }

  if (search) {
    where.OR = [
      { roomNumber: { contains: search, mode: "insensitive" } },
      { tenants: { some: { user: { name: { contains: search, mode: "insensitive" } } } } }
    ];
  }

  const blocks = await prisma.block.findMany({
    orderBy: { name: "asc" }
  });

  const rooms = await prisma.room.findMany({
    where,
    include: {
      tenants: {
        where: {
          user: {
            status: { in: ["ACTIVE", "PAYMENT_MADE", "AWAITING_PAYMENT", "PENDING"] }
          }
        },
        include: { user: true }
      },
      block: true,
      billingRules: true,
      specificRules: true,
    },
    orderBy: { roomNumber: "asc" }
  });

  // For each room, also fetch global and block-level billing rules
  // and merge+deduplicate so the card has the full picture
  const globalAndBlockRules = await prisma.billingRule.findMany({
    where: {
      OR: [
        { isGlobal: true },
        { blockId: { in: rooms.map(r => r.blockId).filter(Boolean) } },
      ],
    },
  });

  const roomsWithAllRules = rooms.map(room => {
    const applicable = [
      ...globalAndBlockRules.filter(r =>
        r.isGlobal || r.blockId === room.blockId
      ),
      ...(room.billingRules || []),
      ...(room.specificRules || []),
    ];
    const seen = new Set();
    const allBillingRules = applicable.filter(r => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
    return { ...room, allBillingRules };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Room Management</h1>
          <p className="text-slate-500 mt-1">Manage your facility's rooms and occupancy.</p>
        </div>
        <Link 
          href="/landlord/rooms/new" 
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:translate-y-px transition-all"
        >
          <Plus size={20} />
          Add New Room
        </Link>
      </div>

      <RoomFilters blocks={blocks} />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {rooms.length === 0 ? (
          <div className="col-span-full py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
            <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Home size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No rooms found</h3>
            <p className="text-slate-500 mt-1 max-w-xs mx-auto text-sm">You haven't added any rooms yet. Start by creating your first room unit.</p>
            <Link href="/landlord/rooms/new" className="mt-6 inline-flex text-blue-600 font-bold items-center gap-1 hover:underline text-sm">
              Create a room <ExternalLink size={14} />
            </Link>
          </div>
        ) : (
          roomsWithAllRules.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))
        )}
      </div>
    </div>
  );
}
