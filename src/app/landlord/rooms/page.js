import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Home, 
  User, 
  MoreVertical, 
  Trash2, 
  Edit,
  ExternalLink,
  Calendar
} from "lucide-react";
import RoomActions from "./RoomActions";
import RoomFilters from "./RoomFilters";


export const dynamic = "force-dynamic";

export default async function RoomsPage({ searchParams }) {
  const params = await searchParams;
  const search = params.search || "";
  const status = params.status || "";

  const where = {};
  
  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { roomNumber: { contains: search, mode: "insensitive" } },
      { tenants: { some: { user: { name: { contains: search, mode: "insensitive" } } } } }
    ];
  }

  const rooms = await prisma.room.findMany({
    where,
    include: {
      tenants: {
        include: { user: true }
      }
    },
    orderBy: { roomNumber: "asc" }
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

      <RoomFilters />

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
          rooms.map((room) => (
            <div key={room.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                      room.status === 'AVAILABLE' ? 'bg-green-50 text-green-600' :
                      room.status === 'OCCUPIED' ? 'bg-blue-50 text-blue-600' :
                      room.status === 'EXPIRED_RENT' ? 'bg-red-50 text-red-600' :
                      'bg-slate-50 text-slate-600'
                    }`}>
                      {room.roomNumber}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Room {room.roomNumber}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                        room.status === 'AVAILABLE' ? 'bg-green-50 text-green-600 border-green-100' :
                        room.tenants.length >= room.capacity ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        room.status === 'OCCUPIED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        room.status === 'EXPIRED_RENT' ? 'bg-red-50 text-red-600 border-red-100' :
                        'bg-slate-50 text-slate-600 border-slate-100'
                      }`}>
                        {room.tenants.length >= room.capacity ? 'FULL' : 
                         room.tenants.length > 0 ? `OCCUPIED (${room.tenants.length}/${room.capacity})` : 
                         room.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Link 
                      href={`/landlord/rooms/${room.id}/edit`}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Room"
                    >
                      <Edit size={18} />
                    </Link>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm py-2 px-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-500 font-medium">Rent & Capacity</span>
                    <div className="text-right">
                      <span className="text-slate-900 font-bold block leading-none">₦{room.rentAmount.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">
                        ₦{(room.rentAmount / room.capacity).toLocaleString()}/Bed • {room.capacity} beds
                      </span>
                    </div>
                  </div>

                  {room.rentExpiryDate && (
                    <div className="flex items-center justify-between text-[11px] py-1.5 px-3 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                      <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                        <Calendar size={12} />
                        Rent Expires
                      </div>
                      <span className="font-bold">{new Date(room.rentExpiryDate).toLocaleDateString()}</span>
                    </div>
                  )}

                  {room.tenants.length > 0 ? (
                    <div className="pt-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Current Occupants</div>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {room.tenants.map((tenant) => (
                          <div key={tenant.id} className="flex flex-col gap-1.5 p-2 bg-indigo-50/50 rounded-xl border border-indigo-100">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-[10px]">
                                {tenant.user?.name?.[0].toUpperCase() || "T"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-indigo-900 truncate">{tenant.user?.name}</p>
                                <p className="text-[10px] text-indigo-600 truncate">{tenant.phone}</p>
                              </div>
                            </div>
                            {tenant.rentExpiryDate && (
                              <div className="flex items-center gap-1 mt-1 px-2 py-0.5 bg-white/50 rounded-md border border-indigo-100/50 w-fit">
                                <Calendar size={10} className="text-indigo-400" />
                                <span className="text-[10px] font-bold text-indigo-500">Expires: {new Date(tenant.rentExpiryDate).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2">
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Current Occupants</div>
                       <div className="flex items-center justify-center p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <span className="text-xs text-slate-400 font-medium italic">Room is currently vacant</span>
                       </div>
                    </div>
                  )}
                </div>
              </div>
              
               <div className="mt-auto p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                  {room.tenants.length > 0 ? (
                    <Link 
                      href={`/landlord/tenants?search=${room.tenants.map(t => t.user?.name).join(',')}`}
                      className="text-xs font-bold text-blue-600 hover:underline transition-all"
                    >
                      View All Occupants ({room.tenants.length})
                    </Link>
                  ) : (
                    <span className="text-xs font-bold text-slate-400 italic">No occupants</span>
                  )}
                  <div className="flex items-center gap-2">
                    <RoomActions room={room} />
                  </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
