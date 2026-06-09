"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  X,
  Edit,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Settings,
  AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import RoomActions from "@/app/landlord/rooms/RoomActions";
import ManageBillingsModal from "./ManageBillingsModal";

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

export default function RoomDetailsSlideOver({ isOpen, onClose, room, displayStatus, statusColorClass }) {
  const router = useRouter();
  
  // Carousel states
  const photos = (room.photos?.length > 0) ? room.photos : (room.imageUrl ? [room.imageUrl] : []);
  const hasPhotos = photos.length > 0;
  const hasMultiple = photos.length > 1;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  // Modal states
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [savingBillings, setSavingBillings] = useState(false);
  const [showBillings, setShowBillings] = useState(false);

  const handleSaveBillings = async (newIds) => {
    setSavingBillings(true);
    try {
      const payload = {
        roomNumber: room.roomNumber,
        rentAmount: room.rentAmount,
        status: room.status,
        capacity: room.capacity,
        blockId: room.blockId,
        billingRuleIds: newIds,
      };

      const res = await fetch(`/api/rooms/${room.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Billing rules updated!");
        router.refresh();
      } else {
        const text = await res.text();
        toast.error(text || "Failed to update billing rules");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSavingBillings(false);
    }
  };

  const next = useCallback(() => setCurrentIndex(i => (i + 1) % photos.length), [photos.length]);
  const prev = useCallback(() => setCurrentIndex(i => (i - 1 + photos.length) % photos.length), [photos.length]);

  useEffect(() => {
    if (!isOpen || !hasMultiple || isPaused) return;
    intervalRef.current = setInterval(next, 3500);
    return () => clearInterval(intervalRef.current);
  }, [isOpen, hasMultiple, isPaused, next]);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  const allRules = room.allBillingRules || [];
  const additionalRules = allRules.filter(r => {
    const t = String(r.type || "").toUpperCase();
    return t !== "BASE_RENT" && t !== "BASE RENT";
  });
  const baseRentRule = allRules.find(r => {
    const t = String(r.type || "").toUpperCase();
    return t === "BASE_RENT" || t === "BASE RENT";
  });
  const rentDisplay = baseRentRule
    ? { amount: baseRentRule.amount, freq: freqLabel(baseRentRule.frequency) }
    : { amount: room.rentAmount, freq: "yr" };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <div className="relative w-full sm:max-w-md h-full bg-slate-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Header Actions Overlay */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <Link
            href={`/landlord/rooms/${room.id}/edit`}
            title="Edit Room"
            className="p-2.5 bg-white/80 backdrop-blur-md text-slate-600 hover:text-blue-600 hover:bg-white rounded-xl transition-colors shadow-sm"
          >
            <Edit size={16} />
          </Link>
          <button 
            onClick={onClose}
            className="p-2.5 bg-slate-900/80 backdrop-blur-md text-white hover:bg-slate-900 rounded-xl transition-colors shadow-sm"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── IMAGE CAROUSEL ── */}
        <div
          className="relative w-full h-64 bg-slate-100 overflow-hidden shrink-0"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {hasPhotos ? (
            <>
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
                    alt={`Room ${room.roomNumber} photo ${i + 1}`}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                      i === currentIndex ? "opacity-100" : "opacity-0"
                    }`}
                  />
                );
              })}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
              
              {hasMultiple && (
                <>
                  <button
                    onClick={() => { prev(); setIsPaused(true); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-all backdrop-blur-sm"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => { next(); setIsPaused(true); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-all backdrop-blur-sm"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => { setCurrentIndex(i); setIsPaused(true); }}
                        className={`rounded-full transition-all duration-300 ${
                          i === currentIndex ? "w-6 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100">
              <ImageOff size={32} className="text-slate-300 mb-2" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No Photos Available</span>
            </div>
          )}
          <span className={`absolute top-4 left-4 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border backdrop-blur-md bg-white/90 shadow-sm ${statusColorClass}`}>
            {displayStatus}
          </span>
        </div>

        {/* ── DETAILS BODY (Scrollable) ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Header Info */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold text-slate-900 text-2xl tracking-tight">Room {room.roomNumber}</h2>
                {room.block?.address && (
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                    <MapPin size={12} /> {room.block.address}
                  </span>
                )}
              </div>
              {room.block && (
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-100 shrink-0">
                  {room.block.name}
                </span>
              )}
            </div>
          </div>

          {/* Billing & Rules */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Financials</span>
              <button
                onClick={() => setIsBillingModalOpen(true)}
                disabled={savingBillings}
                className="text-[11px] font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors flex items-center gap-1.5"
              >
                <Settings size={12} /> {savingBillings ? "Saving..." : "Manage"}
              </button>
            </div>

            <div className="flex items-center justify-between py-2 px-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-sm font-semibold text-slate-600">Base Rent</span>
              <span className="text-sm font-black text-slate-900">
                ₦{rentDisplay.amount?.toLocaleString() || 0}
                <span className="text-slate-400 font-medium text-xs">/{rentDisplay.freq}</span>
              </span>
            </div>
            
            {additionalRules.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Additional Charges</p>
                {additionalRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between py-2 px-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-xs font-semibold text-slate-600 truncate mr-2 flex items-center gap-2">
                      {rule.title || rule.description}
                      {rule.isGlobal && (
                        <span className="text-[9px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded uppercase tracking-wider">Global</span>
                      )}
                    </span>
                    <span className="text-xs font-bold text-slate-900 shrink-0">
                      ₦{rule.amount?.toLocaleString()} <span className="text-slate-400 font-medium">/{freqLabel(rule.frequency)}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}

            {room.rentExpiryDate && (
              <div className="flex items-center justify-between text-xs py-2.5 px-4 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 mt-2">
                <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                  <Calendar size={14} /> Rent Expires
                </div>
                <span className="font-bold">{new Date(room.rentExpiryDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Occupants */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Current Occupants</span>
              {room.tenants.length > 0 && (
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {room.tenants.length}/{room.capacity}
                </span>
              )}
            </div>

            {room.tenants.length > 0 ? (
              <div className="space-y-3">
                {room.tenants.map((tenant) => {
                  const isReserved = tenant.user?.status === "AWAITING_PAYMENT" || tenant.user?.status === "PENDING";
                  const isPendingApproval = tenant.user?.status === "PAYMENT_MADE";
                  const isNotActive = isReserved || isPendingApproval;
                  
                  return (
                    <div
                      key={tenant.id}
                      className={`flex flex-col gap-2 p-4 rounded-2xl border bg-white shadow-sm ${
                        isNotActive ? "border-amber-200" : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 ${
                          isNotActive ? "bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/20" : "bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-indigo-500/20"
                        } shadow-md`}>
                          {tenant.user?.name?.[0]?.toUpperCase() || "T"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${isNotActive ? "text-amber-900" : "text-slate-900"}`}>
                            {tenant.user?.name}
                          </p>
                          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                            {tenant.phone || tenant.user?.email}
                          </p>
                        </div>
                        
                        {/* Status Badges */}
                        <div className="shrink-0 flex flex-col items-end gap-1.5">
                          {isReserved ? (
                            <span className="text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-lg border border-amber-200">
                              Reserved
                            </span>
                          ) : isPendingApproval ? (
                            <span className="text-[10px] font-bold px-2 py-1 bg-purple-100 text-purple-700 rounded-lg border border-purple-200">
                              Pending Approval
                            </span>
                          ) : tenant.rentExpiryDate && (
                            <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg border border-slate-200 flex items-center gap-1">
                              <Calendar size={10} /> {new Date(tenant.rentExpiryDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <AlertCircle size={24} className="text-slate-300 mb-2" />
                <span className="text-sm font-bold text-slate-500">Room is Vacant</span>
                <span className="text-xs text-slate-400 mt-1">No occupants assigned yet.</span>
              </div>
            )}
            
            {room.tenants.length > 0 && (
              <Link
                href={`/landlord/tenants?search=${room.tenants.map(t => t.user?.name).join(",")}`}
                className="flex items-center justify-center w-full py-3 mt-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
              >
                View Tenant Profiles
              </Link>
            )}
          </div>
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div className="p-5 bg-white border-t border-slate-200 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <RoomActions room={room} />
        </div>
      </div>

      {/* Keep modal decoupled from the slide-out stack flow if possible, but works fine here */}
      <ManageBillingsModal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
        initialSelectedIds={room.allBillingRules?.map(r => r.id) || []}
        onSave={handleSaveBillings}
        blockId={room.blockId}
        roomId={room.id}
      />
    </div>
  );
}
