"use client";

import Link from "next/link";
import { MapPin, Building2, ChevronRight, Zap } from "lucide-react";

export default function PublicRoomCard({ room }) {
  const photo = room.photos?.length > 0 ? room.photos[0] : room.imageUrl;
  const isVideo = photo && /\.(mp4|mov|webm|ogg|avi)(\?|$)/i.test(photo);

  return (
    <Link 
      href={`/rooms/${room.id}`}
      className="group bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col overflow-hidden hover:-translate-y-2"
    >
      {/* Image/Media Container */}
      <div className="relative h-64 overflow-hidden bg-slate-100">
        {photo ? (
          isVideo ? (
            <video
              src={photo}
              muted
              playsInline
              loop
              autoPlay
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <img
              src={photo}
              alt={`Room ${room.roomNumber}`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-300">
            <Building2 size={40} strokeWidth={1.5} />
            <span className="text-[10px] font-bold uppercase tracking-widest mt-2">No Media Available</span>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
               <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Available</span>
            </div>
            {room.tenants?.length > 0 && (
                <div className="bg-blue-600 text-white px-3 py-1.5 rounded-full shadow-lg shadow-blue-500/20 text-[10px] font-black uppercase tracking-widest">
                    {room.capacity - room.tenants?.length} Beds Left
                </div>
            )}
        </div>

        <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      </div>

      {/* Content Section */}
      <div className="p-6 md:p-8 flex flex-col gap-5 flex-1 relative">
         
         <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Discovery Listing</span>
                <div className="flex items-center gap-1 text-amber-500 font-bold text-[10px] uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                    <Zap size={10} className="fill-amber-500" /> Premium
                </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Room {room.roomNumber}</h3>
         </div>

         <div className="space-y-3">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Building2 size={18} />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Building Block</p>
                    <p className="text-sm font-bold text-slate-700 leading-none">{room.block?.name || "Premium Block"}</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <MapPin size={18} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Location Address</p>
                    <p className="text-sm font-bold text-slate-700 truncate">{room.block?.address || "Main Campus Region"}</p>
                </div>
            </div>
         </div>

         {/* Price Section */}
         <div className="mt-auto pt-6 border-t border-slate-100 flex items-end justify-between gap-4">
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Starting From</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 tracking-tighter">₦{room.rentAmount.toLocaleString()}</span>
                    <span className="text-xs font-bold text-slate-400">/Year</span>
                </div>
            </div>
            
            <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 text-white group-hover:bg-blue-600 transition-all duration-300 shadow-xl shadow-slate-900/10 group-hover:shadow-blue-500/20 group-hover:-translate-x-1">
                <ChevronRight size={24} />
            </div>
         </div>

      </div>
    </Link>
  );
}
