"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Home,
  Edit,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ImageOff
} from "lucide-react";
import RoomActions from "@/app/landlord/rooms/RoomActions";

export default function RoomCard({ room }) {
  // Build the photos list: prefer photos[], fall back to imageUrl
  const photos = (room.photos?.length > 0)
    ? room.photos
    : (room.imageUrl ? [room.imageUrl] : []);

  const hasPhotos = photos.length > 0;
  const hasMultiple = photos.length > 1;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  const next = useCallback(() => {
    setCurrentIndex(i => (i + 1) % photos.length);
  }, [photos.length]);

  const prev = useCallback(() => {
    setCurrentIndex(i => (i - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Auto-advance every 3.5s, pause on hover
  useEffect(() => {
    if (!hasMultiple || isPaused) return;
    intervalRef.current = setInterval(next, 3500);
    return () => clearInterval(intervalRef.current);
  }, [hasMultiple, isPaused, next]);

  const statusColors = {
    AVAILABLE: "bg-green-50 text-green-700 border-green-100",
    OCCUPIED: "bg-blue-50 text-blue-700 border-blue-100",
    EXPIRED_RENT: "bg-red-50 text-red-700 border-red-100",
    UNDER_MAINTENANCE: "bg-slate-50 text-slate-600 border-slate-100",
  };

  // Split tenants by status for display
  const activeTenants = room.tenants.filter(t =>
    t.user?.status === "ACTIVE" || t.user?.status === "PAYMENT_MADE"
  );
  const pendingTenants = room.tenants.filter(t =>
    t.user?.status === "AWAITING_PAYMENT" || t.user?.status === "PENDING"
  );
  const allTenants = room.tenants;

  const displayStatus = allTenants.length >= room.capacity
    ? "FULL"
    : activeTenants.length > 0
    ? `${activeTenants.length}/${room.capacity} Beds`
    : pendingTenants.length > 0
    ? `${pendingTenants.length} Reserved`
    : room.status.replace("_", " ");

  const statusColorClass = allTenants.length >= room.capacity
    ? "bg-amber-50 text-amber-700 border-amber-100"
    : pendingTenants.length > 0 && activeTenants.length === 0
    ? "bg-amber-50 text-amber-700 border-amber-100"
    : statusColors[room.status] || "bg-slate-50 text-slate-600 border-slate-100";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col overflow-hidden">

      {/* ── IMAGE CAROUSEL ── */}
      <div
        className="relative w-full h-52 bg-slate-100 overflow-hidden shrink-0"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {hasPhotos ? (
          <>
            {/* Slides */}
            {photos.map((src, i) => {
              const isVideo = /\.(mp4|mov|webm|ogg|avi)(\?|$)/i.test(src) || src.includes('video');
              return isVideo ? (
                <video
                  key={i}
                  src={src}
                  muted
                  playsInline
                  loop
                  autoPlay={i === currentIndex}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                    i === currentIndex ? "opacity-100" : "opacity-0"
                  }`}
                />
              ) : (
                <img
                  key={i}
                  src={src}
                  alt={`Room ${room.roomNumber} – photo ${i + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                    i === currentIndex ? "opacity-100" : "opacity-0"
                  }`}
                />
              );
            })}

            {/* Gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

            {/* Status badge floating top-left */}
            <span className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border backdrop-blur-sm bg-white/80 ${statusColorClass}`}>
              {displayStatus}
            </span>

            {/* Edit button floating top-right */}
            <Link
              href={`/landlord/rooms/${room.id}/edit`}
              title="Edit Room"
              className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors border border-white/50 shadow-sm"
            >
              <Edit size={15} />
            </Link>

            {/* Prev / Next arrows — only if multiple */}
            {hasMultiple && (
              <>
                <button
                  onClick={() => { prev(); setIsPaused(true); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => { next(); setIsPaused(true); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}

            {/* Dot indicators */}
            {hasMultiple && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrentIndex(i); setIsPaused(true); }}
                    className={`rounded-full transition-all duration-300 ${
                      i === currentIndex
                        ? "w-5 h-1.5 bg-white"
                        : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Photo count badge */}
            {hasMultiple && (
              <span className="absolute bottom-3 right-3 text-[10px] font-bold text-white/80 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">
                {currentIndex + 1} / {photos.length}
              </span>
            )}
          </>
        ) : (
          /* No photo fallback */
          <div className={`w-full h-full flex flex-col items-center justify-center gap-2 ${
            room.status === 'AVAILABLE' ? 'bg-green-50' :
            room.status === 'OCCUPIED'  ? 'bg-blue-50'  :
            room.status === 'EXPIRED_RENT' ? 'bg-red-50' : 'bg-slate-50'
          }`}>
            <ImageOff size={28} className="text-slate-300" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No Photos</span>
            {/* Status + Edit still shown */}
            <span className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${statusColorClass}`}>
              {displayStatus}
            </span>
            <Link
              href={`/landlord/rooms/${room.id}/edit`}
              title="Edit Room"
              className="absolute top-3 right-3 p-2 bg-white/80 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors border border-slate-100 shadow-sm"
            >
              <Edit size={15} />
            </Link>
          </div>
        )}
      </div>

      {/* ── CARD BODY ── */}
      <div className="p-5 flex-1 flex flex-col gap-4">

        {/* Room name + block */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-lg leading-tight">Room {room.roomNumber}</h3>
            {room.block && (
              <div className="flex flex-col gap-0.5 mt-1">
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 w-fit">
                  {room.block.name}
                </span>
                {room.block.address && (
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <MapPin size={9} /> {room.block.address}
                  </span>
                )}
              </div>
            )}
          </div>
          {/* Rent */}
          <div className="text-right shrink-0">
            <span className="text-slate-900 font-bold block leading-none">₦{room.rentAmount.toLocaleString()}</span>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">
              ₦{(room.rentAmount / room.capacity).toLocaleString()}/Bed • {room.capacity} beds
            </span>
          </div>
        </div>

        {/* Expiry */}
        {room.rentExpiryDate && (
          <div className="flex items-center justify-between text-[11px] py-1.5 px-3 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <Calendar size={11} /> Rent Expires
            </div>
            <span className="font-bold">{new Date(room.rentExpiryDate).toLocaleDateString()}</span>
          </div>
        )}

        {/* Occupants */}
        <div className="flex-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Current Occupants</div>
          {room.tenants.length > 0 ? (
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {room.tenants.map((tenant) => {
                const isPending = tenant.user?.status === "AWAITING_PAYMENT" || tenant.user?.status === "PENDING";
                return (
                  <div
                    key={tenant.id}
                    className={`flex flex-col gap-1 p-2 rounded-xl border ${
                      isPending
                        ? "bg-amber-50/60 border-amber-100"
                        : "bg-indigo-50/50 border-indigo-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0 ${
                        isPending ? "bg-amber-500" : "bg-indigo-600"
                      }`}>
                        {tenant.user?.name?.[0]?.toUpperCase() || "T"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${isPending ? "text-amber-900" : "text-indigo-900"}`}>
                          {tenant.user?.name}
                        </p>
                        <p className={`text-[10px] truncate ${isPending ? "text-amber-500" : "text-indigo-500"}`}>
                          {isPending ? (
                            tenant.user?.status === "PENDING" ? "Pending approval" : "Awaiting payment"
                          ) : tenant.phone}
                        </p>
                      </div>
                      {isPending && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full border border-amber-200 shrink-0">
                          Reserved
                        </span>
                      )}
                    </div>
                    {!isPending && tenant.rentExpiryDate && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-white/60 rounded-md border border-indigo-100/50 w-fit">
                        <Calendar size={9} className="text-indigo-400" />
                        <span className="text-[9px] font-bold text-indigo-500">Expires: {new Date(tenant.rentExpiryDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <span className="text-xs text-slate-400 font-medium italic">Room is currently vacant</span>
            </div>
          )}
        </div>
      </div>

      {/* ── CARD FOOTER ── */}
      <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
        {room.tenants.length > 0 ? (
          <Link
            href={`/landlord/tenants?search=${room.tenants.map(t => t.user?.name).join(",")}`}
            className="text-xs font-bold text-blue-600 hover:underline transition-all"
          >
            All Occupants ({room.tenants.length})
          </Link>
        ) : (
          <span className="text-xs font-bold text-slate-400 italic">No occupants</span>
        )}
        <RoomActions room={room} />
      </div>
    </div>
  );
}
