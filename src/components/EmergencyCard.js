"use client";

import { Phone } from "lucide-react";
import { toast } from "react-hot-toast";

const EMERGENCY_NUMBER = "+2348090791947"; // tel: format — no spaces
const DISPLAY_NUMBER   = "+234 800-SOS";
// +2348005678767

export default function EmergencyCard() {
  const handleClick = () => {
    // Mobile/touch: open dialer. Desktop: copy to clipboard.
    const isMobile = window.matchMedia("(pointer: coarse)").matches;

    if (isMobile) {
      window.location.href = `tel:${EMERGENCY_NUMBER}`;
    } else {
      navigator.clipboard
        .writeText(EMERGENCY_NUMBER)
        .then(() => toast.success("Emergency number copied!"))
        .catch(() => toast.error("Could not copy number."));
    }
  };

  return (
    <button
      onClick={handleClick}
      className="group relative bg-slate-900 rounded-3xl p-5 flex flex-col justify-between overflow-hidden min-h-[140px] hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/30 transition-all duration-300 text-left w-full"
    >
      <Phone
        size={72}
        className="absolute -bottom-3 -right-3 text-white/5 group-hover:text-white/10 transition-colors duration-500"
        strokeWidth={1.5}
      />
      <div className="relative z-10 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse" />
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">24/7</p>
      </div>
      <div className="relative z-10 mt-4">
        <p className="text-sm font-black text-white leading-tight">SOS Line.</p>
        <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{DISPLAY_NUMBER}</p>
        <p className="text-[9px] text-slate-600 mt-1.5 group-hover:text-slate-500 transition-colors">
          {/* hint text — shown on hover */}
          <span className="hidden sm:inline">Click to copy</span>
          <span className="sm:hidden">Tap to call</span>
        </p>
      </div>
    </button>
  );
}
