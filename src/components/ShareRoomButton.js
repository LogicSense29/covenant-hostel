"use client";

import { Share2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ShareRoomButton({ roomId, profileId }) {
  const handleCopy = () => {
    const link = `${window.location.origin}/register?roomId=${roomId}&sharedBy=${profileId}`;
    navigator.clipboard.writeText(link)
      .then(() => toast.success("Share link copied! Send it to your room mate."))
      .catch(() => toast.error("Could not copy link."));
  };

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
