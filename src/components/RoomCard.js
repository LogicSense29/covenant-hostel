"use client";

import { useState } from "react";
import Link from "next/link";
import { ImageOff, MapPin, CheckCircle2, AlertCircle, Edit } from "lucide-react";
import RoomDetailsSlideOver from "./RoomDetailsSlideOver";

// Frequency label shorthand
function freqLabel(frequency) {
  const map = {
    ONCE: "once",
    DAILY: "day",
    MONTHLY: "mo",
    QUARTERLY: "qtr",
    YEARLY: "yr",
    PER_SEMESTER: "sem",
  };
  return map[frequency] || frequency?.toLowerCase() || "yr";
}

export default function RoomCard({ room }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Split tenants by status for display
  const activeTenants = room.tenants.filter(t => t.user?.status === "ACTIVE");
  const pendingApprovalTenants = room.tenants.filter(t => t.user?.status === "PAYMENT_MADE");
  const pendingTenants = room.tenants.filter(t => t.user?.status === "AWAITING_PAYMENT" || t.user?.status === "PENDING");
  const allTenants = room.tenants;

  const displayStatus = allTenants.length >= room.capacity
    ? "FULL"
    : activeTenants.length > 0
    ? `${activeTenants.length}/${room.capacity}`
    : pendingApprovalTenants.length > 0
    ? `${pendingApprovalTenants.length} Pending Approval`
    : pendingTenants.length > 0
    ? `${pendingTenants.length} Reserved`
    : room.status.replace("_", " ");

  const statusColors = {
    AVAILABLE: "bg-green-50 text-green-700 border-green-100",
    OCCUPIED: "bg-blue-50 text-blue-700 border-blue-100",
    EXPIRED_RENT: "bg-red-50 text-red-700 border-red-100",
    UNDER_MAINTENANCE: "bg-slate-50 text-slate-600 border-slate-100",
  };

  const statusColorClass = allTenants.length >= room.capacity
    ? "bg-amber-50 text-amber-700 border-amber-100"
    : pendingApprovalTenants.length > 0 && activeTenants.length === 0
    ? "bg-purple-50 text-purple-700 border-purple-100"
    : pendingTenants.length > 0 && activeTenants.length === 0
    ? "bg-amber-50 text-amber-700 border-amber-100"
    : statusColors[room.status] || "bg-slate-50 text-slate-600 border-slate-100";

  // Base image
  const primaryImage = (room.photos?.length > 0) ? room.photos[0] : (room.imageUrl || null);
  const isVideo = primaryImage && (/\.(mp4|mov|webm|ogg|avi)(\?|$)/i.test(primaryImage) || primaryImage.includes('video'));

  // Base Rent
  const allRules = room.allBillingRules || [];
  const baseRentRule = allRules.find(r => {
    const t = String(r.type || "").toUpperCase();
    return t === "BASE_RENT" || t === "BASE RENT";
  });
  const rentDisplay = baseRentRule
    ? { amount: baseRentRule.amount, freq: freqLabel(baseRentRule.frequency) }
    : { amount: room.rentAmount, freq: "yr" };

  return (
    <>
      <div 
        onClick={() => setIsDrawerOpen(true)}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col overflow-hidden cursor-pointer "
      >
        {/* ── CARD HEADER (Image) ── */}
        <div className="relative w-full h-44 bg-slate-100 overflow-hidden shrink-0">
          {primaryImage ? (
            isVideo ? (
              <video
                src={primaryImage}
                muted
                playsInline
                loop
                autoPlay
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <img
                src={primaryImage}
                alt={`Room ${room.roomNumber}`}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            )
          ) : (
            <div className={`w-full h-full flex flex-col items-center justify-center gap-2 ${
              room.status === 'AVAILABLE' ? 'bg-green-50' :
              room.status === 'OCCUPIED'  ? 'bg-blue-50'  :
              room.status === 'EXPIRED_RENT' ? 'bg-red-50' : 'bg-slate-50'
            }`}>
              <ImageOff size={28} className="text-slate-300" />
            </div>
          )}

          {/* Dark gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent pointer-events-none z-0" />

          {/* Status Badge */}
          <span className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border backdrop-blur-md bg-white/90 shadow-sm ${statusColorClass}`}>
            {displayStatus}
          </span>
          
          {/* Edit button floating top-right */}
          <Link
            href={`/landlord/rooms/${room.id}/edit`}
            title="Edit Room"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors shadow-sm z-10"
          >
            <Edit size={15} />
          </Link>

          {/* Quick Stats on bottom of image */}
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between z-10">
            <div className="text-white">
              <h3 className="font-bold text-xl leading-tight tracking-tight drop-shadow-md">Room {room.roomNumber}</h3>
              {room.block && (
                <span className="text-[10px] font-semibold flex items-center gap-1 opacity-90 drop-shadow-md">
                  <MapPin size={10} /> {room.block.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── CARD BODY (Minimal) ── */}
        <div className="p-4 flex flex-col gap-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base Rent</span>
              <span className="font-bold text-slate-900 text-lg leading-none mt-1">
                ₦{rentDisplay.amount?.toLocaleString() || 0}
                <span className="text-slate-400 font-medium text-xs ml-0.5">/{rentDisplay.freq}</span>
              </span>
            </div>
            
            <div className="flex -space-x-2">
              {room.tenants.length > 0 ? (
                room.tenants.slice(0, 3).map((t, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm">
                    {t.user?.name?.[0]?.toUpperCase() || "T"}
                  </div>
                ))
              ) : (
                <div className="text-[10px] font-bold text-slate-400 italic px-2 py-1 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  Vacant
                </div>
              )}
              {room.tenants.length > 3 && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">
                  +{room.tenants.length - 3}
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full flex items-center justify-center py-2.5 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-600 rounded-xl transition-colors border border-slate-100">
            View Details
          </div>
        </div>
      </div>

      {/* Slide-out Drawer Component */}
      <RoomDetailsSlideOver 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        room={room}
        displayStatus={displayStatus}
        statusColorClass={statusColorClass}
      />
    </>
  );
}
