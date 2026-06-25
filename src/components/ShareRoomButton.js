"use client";

import { Share2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ShareRoomButton({ roomId, profileId, fullWidth = false }) {
  const handleCopy = () => {
    const link = `${window.location.origin}/register?roomId=${roomId}&sharedBy=${profileId}`;
    navigator.clipboard.writeText(link)
      .then(() => toast.success("Share link copied! Send it to your room mate."))
      .catch(() => toast.error("Could not copy link."));
  };

  if (fullWidth) {
    return (
      <button
        onClick={handleCopy}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 text-slate-700 text-xs font-bold rounded-2xl hover:bg-[#203090] hover:text-white transition-all border border-slate-100"
        title="Copy room share link for a room mate"
      >
        <Share2 size={14} /> Share Room Link
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      className="p-3 bg-slate-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
      title="Copy room share link for a room mate"
    >
      <Share2 size={20} />
    </button>
  );
}
