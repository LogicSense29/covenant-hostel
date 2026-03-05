"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function AssignRoomActions({ tenantId, currentRoomId, availableRooms }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState("");

  const handleAssign = async () => {
    if (!selectedRoom) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: selectedRoom })
      });
      
      if (res.ok) {
        setSelectedRoom("");
        toast.success("Room assigned successfully!");
        router.refresh();
      } else {
        toast.error("Failed to assign room.");
      }
    } catch(e) {
      toast.error("Error occurred while assigning room.");
    }
    setLoading(false);
  };

  const handleUnassign = async () => {
    if (!confirm("Are you sure you want to unassign this tenant from their room?")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/unassign`, {
        method: "PUT"
      });
      
      if (res.ok) {
        toast.success("Room unassigned successfully!");
        router.refresh();
      } else {
        toast.error("Failed to unassign room.");
      }
    } catch(e) {
      toast.error("Error occurred while unassigning room.");
    }
    setLoading(false);
  };

  if (currentRoomId) {
    return (
      <button 
        onClick={handleUnassign} 
        disabled={loading} 
        className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
      >
        {loading ? "..." : "Unassign Room"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select 
        value={selectedRoom} 
        onChange={(e) => setSelectedRoom(e.target.value)}
        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
      >
        <option value="">Select Room...</option>
        {availableRooms.map(r => (
          <option key={r.id} value={r.id}>Room {r.roomNumber}</option>
        ))}
      </select>
      <button 
        onClick={handleAssign} 
        disabled={loading || !selectedRoom} 
        className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-all font-sans tracking-wide uppercase"
      >
        {loading ? "..." : "Assign"}
      </button>
    </div>
  );
}
