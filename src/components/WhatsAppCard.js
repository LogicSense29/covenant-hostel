"use client";

import { MessageCircle } from "lucide-react";
import { toast } from "react-hot-toast";

const WHATSAPP_NUMBER = "+2348090791947"; // Management WhatsApp
const DISPLAY_NUMBER = "+234 809 079 1947";

export default function WhatsAppCard() {
  const handleClick = () => {
    // Format for WhatsApp deep link (remove + and spaces)
    const formattedNumber = WHATSAPP_NUMBER.replace(/[+\s]/g, "");
    const message = encodeURIComponent("Hello, I need assistance with my hostel accommodation.");
    
    // WhatsApp deep link works on both mobile and desktop
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${message}`;
    
    window.open(whatsappUrl, "_blank");
  };

  return (
    <button
      onClick={handleClick}
      className="group relative bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl p-5 flex flex-col justify-between overflow-hidden min-h-[140px] hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-600/30 transition-all duration-300 text-left w-full"
    >
      <MessageCircle
        size={72}
        className="absolute -bottom-3 -right-3 text-white/10 group-hover:text-white/20 transition-colors duration-500"
        strokeWidth={1.5}
      />
      <div className="relative z-10 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
        <p className="text-[9px] font-bold text-emerald-200 uppercase tracking-widest">WhatsApp</p>
      </div>
      <div className="relative z-10 mt-4">
        <p className="text-sm font-black text-white leading-tight">Chat with us</p>
        <p className="text-[10px] font-semibold text-emerald-100 mt-0.5">{DISPLAY_NUMBER}</p>
        <p className="text-[9px] text-emerald-200 mt-1.5 group-hover:text-white transition-colors">
          Tap to start conversation
        </p>
      </div>
    </button>
  );
}
