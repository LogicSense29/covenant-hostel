"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

// Reusable confirmation toast component
const ConfirmationToast = ({ title, message, onConfirm, onCancel, confirmText = "Confirm", confirmColor = "blue" }) => {
  const colorClasses = {
    red: "bg-red-600 hover:bg-red-700",
    blue: "bg-blue-600 hover:bg-blue-700",
    amber: "bg-amber-600 hover:bg-amber-700"
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="font-medium text-gray-900">{title}</p>
      {message && <p className="text-sm text-gray-600">{message}</p>}
      <div className="flex gap-2 mt-2">
        <button
          onClick={onConfirm}
          className={`px-3 py-1.5 ${colorClasses[confirmColor]} text-white rounded text-sm font-medium transition-colors`}
        >
          {confirmText}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default function RoomActions({ room }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const confirmDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${room.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Room deleted successfully!");
        router.refresh();
      } else {
        const errorText = await res.text();
        if (res.status === 400) {
          // Show specific error message from backend
          toast.error(errorText || "Failed to delete room.");
        } else {
          toast.error("Failed to delete room.");
        }
      }
    } catch (e) {
      toast.error("Error occurred while deleting room.");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    // Check if room is occupied before showing confirmation
    if (room.status === "OCCUPIED") {
      toast.error("Cannot delete occupied room. Please unassign tenants first.");
      return;
    }

    // Show confirmation toast
    toast((t) => (
      <ConfirmationToast
        title={`Delete Room ${room.roomNumber}?`}
        message="This action cannot be undone."
        confirmText="Delete"
        confirmColor="red"
        onConfirm={() => {
          toast.dismiss(t.id);
          confirmDelete();
        }}
        onCancel={() => toast.dismiss(t.id)}
      />
    ), {
      duration: 10000,
      position: 'top-center',
    });
  };

  const confirmMarkAvailable = async () => {
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

  const handleMarkAvailable = async () => {
    toast((t) => (
      <ConfirmationToast
        title={`Mark Room ${room.roomNumber} as Available?`}
        message="This will unlink any expired tenant."
        confirmText="Confirm"
        confirmColor="blue"
        onConfirm={() => {
          toast.dismiss(t.id);
          confirmMarkAvailable();
        }}
        onCancel={() => toast.dismiss(t.id)}
      />
    ), {
      duration: 10000,
      position: 'top-center',
    });
  };

  const confirmMarkExpired = async () => {
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

  const handleMarkExpired = async () => {
    toast((t) => (
      <ConfirmationToast
        title={`Mark Room ${room.roomNumber} as Expired?`}
        confirmText="Confirm"
        confirmColor="amber"
        onConfirm={() => {
          toast.dismiss(t.id);
          confirmMarkExpired();
        }}
        onCancel={() => toast.dismiss(t.id)}
      />
    ), {
      duration: 10000,
      position: 'top-center',
    });
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
