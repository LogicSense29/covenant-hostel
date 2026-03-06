"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function RoomActions({ room }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete Room ${room.roomNumber}?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${room.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Room deleted successfully!");
        router.refresh();
      } else {
        toast.error("Failed to delete room.");
      }
    } catch (e) {
      toast.error("Error occurred while deleting room.");
    }
    setLoading(false);
  };

  const handleMarkAvailable = async () => {
    if (!confirm(`Mark Room ${room.roomNumber} as available? This will unlink any expired tenant.`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${room.id}/status`, { 
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "AVAILABLE" })
      });
      if (res.ok) {
        toast.success("Room status updated successfully!");
        router.refresh();
      } else {
        toast.error("Failed to update status.");
      }
    } catch (e) {
      toast.error("Error occurred while updating status.");
    }
    setLoading(false);
  };

  const handleMarkExpired = async () => {
    if (!confirm(`Mark Room ${room.roomNumber} as expired?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${room.id}/status`, { 
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "EXPIRED_RENT" })
      });
      if (res.ok) {
        toast.success("Room marked as expired!");
        router.refresh();
      } else {
        toast.error("Failed to update status.");
      }
    } catch (e) {
      toast.error("Error occurred while updating status.");
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-2">
      {room.status === "EXPIRED_RENT" ? (
        <button 
          onClick={handleMarkAvailable} 
          disabled={loading} 
          className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50"
        >
          {loading ? "..." : "Mark Available"}
        </button>
      ) : room.status !== "UNDER_MAINTENANCE" && (
        <button 
          onClick={handleMarkExpired} 
          disabled={loading} 
          className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition-all disabled:opacity-50"
        >
          {loading ? "..." : "Mark Expired"}
        </button>
      )}
      <button 
        onClick={handleDelete} 
        disabled={loading} 
        className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
      >
        {loading ? "..." : "Delete"}
      </button>
    </div>
  );
}
