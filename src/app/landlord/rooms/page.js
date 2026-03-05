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
  ExternalLink
} from "lucide-react";
import RoomActions from "./RoomActions";


export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const rooms = await prisma.room.findMany({
    include: {
      tenant: {
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

      {/* Filters/Search placeholder */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 group focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search room number or tenant..." 
            className="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>
        <div className="flex gap-2">
          <select className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 text-sm font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all">
            <option>All Status</option>
            <option>Available</option>
            <option>Occupied</option>
            <option>Maintenance</option>
          </select>
        </div>
      </div>

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
                        room.status === 'OCCUPIED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        room.status === 'EXPIRED_RENT' ? 'bg-red-50 text-red-600 border-red-100' :
                        'bg-slate-50 text-slate-600 border-slate-100'
                      }`}>
                        {room.status.replace('_', ' ')}
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
                    <span className="text-slate-500 font-medium">Rent Amount</span>
                    <span className="text-slate-900 font-bold">₦{room.rentAmount.toLocaleString()} / yr</span>
                  </div>

                  {room.tenant ? (
                    <div className="pt-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Current Tenant</div>
                      <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                          {room.tenant.user?.name?.[0].toUpperCase() || "T"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-indigo-900 truncate">{room.tenant.user?.name}</p>
                          <p className="text-[11px] text-indigo-600 truncate">{room.tenant.phone}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2">
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Current Tenant</div>
                       <div className="flex items-center justify-center p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <span className="text-xs text-slate-400 font-medium">No active tenant</span>
                       </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-auto p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                 <Link 
                    href={room.tenant ? `/landlord/tenants?search=${room.tenant.user?.name}` : "/landlord/tenants"}
                    className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
                  >
                    View Details
                  </Link>
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
