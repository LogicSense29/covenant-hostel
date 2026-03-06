"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { 
  X, 
  Home, 
  Calendar as CalendarIcon, 
  UserPlus, 
  ChevronRight,
  RefreshCw,
  Info
} from "lucide-react";

export default function AssignRoomActions({ tenantId, currentRoomId, availableRooms }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [rentExpiryDate, setRentExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });

  const handleAssign = async () => {
    if (!selectedRoom) {
      toast.error("Please select a room");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: selectedRoom, rentExpiryDate })
      });
      
      if (res.ok) {
        toast.success("Room assigned successfully!");
        setIsOpen(false);
        router.refresh();
      } else {
        const text = await res.text();
        toast.error(text || "Failed to assign room.");
      }
    } catch(e) {
      toast.error("Error occurred while assigning room.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    if (!confirm("Are you sure you want to unassign this tenant?")) return;
    
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {currentRoomId ? (
          <>
            <button 
              onClick={() => setIsOpen(true)}
              className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg border border-blue-100 hover:bg-blue-600 hover:text-white transition-all transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={12} />
               Change
            </button>
            <button 
              onClick={handleUnassign} 
              disabled={loading} 
              className="px-3 py-1.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-100 hover:bg-red-600 hover:text-white transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              Unassign
            </button>
          </>
        ) : (
          <button 
             onClick={() => setIsOpen(true)}
             className="px-4 py-2 bg-slate-900 text-white text-[10px] font-bold rounded-xl hover:bg-blue-600 transition-all flex items-center gap-2 shadow-lg shadow-slate-200 uppercase tracking-wider"
          >
             <UserPlus size={14} />
             Assign Room
          </button>
        )}
      </div>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Room Allocation</h3>
                <p className="text-xs text-slate-500 font-medium">Assign or change tenant's residence</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-colors shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Room Selection */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Choose Available Room</label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                  {availableRooms.map((room) => {
                    const isFull = room.tenants?.length >= room.capacity;
                    const isSelected = selectedRoom === room.id;
                    
                    return (
                      <button
                        key={room.id}
                        disabled={isFull}
                        onClick={() => setSelectedRoom(room.id)}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-left group ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500/10' 
                            : isFull 
                              ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed' 
                              : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl border ${isSelected ? 'bg-blue-600 text-white border-blue-500' : 'bg-white text-slate-400 border-slate-200 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors'}`}>
                            <Home size={16} />
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>Room {room.roomNumber}</p>
                            <p className="text-[10px] font-medium text-slate-500">
                              ₦{room.rentAmount.toLocaleString()} <span className="text-blue-600 font-bold ml-1">₦{(room.rentAmount / room.capacity).toLocaleString()}/Bed</span>
                            </p>
                            <p className="text-[10px] font-medium text-slate-400">{room.tenants?.length || 0}/{room.capacity} beds occupied</p>
                          </div>
                        </div>
                        {isSelected && <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white"><ChevronRight size={14} strokeWidth={3} /></div>}
                        {isFull && <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">FULL</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Expiry Date */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Rent Expiry Date</label>
                <div className="relative group">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                      <CalendarIcon size={18} />
                   </div>
                   <input 
                    type="date"
                    value={rentExpiryDate}
                    onChange={(e) => setRentExpiryDate(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-200 transition-all font-sans"
                  />
                </div>
                <div className="flex items-start gap-2 p-3 bg-blue-50/50 rounded-xl border border-blue-50">
                  <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-medium text-blue-600 leading-relaxed">
                    Default is set to 1 year from today. This date will trigger automated rent reminders for both the tenant and admin.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-3 bg-white text-slate-600 text-sm font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleAssign}
                disabled={loading || !selectedRoom}
                className="flex-[2] px-4 py-3 bg-blue-600 text-white text-sm font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 disabled:bg-blue-300 disabled:shadow-none transition-all flex items-center justify-center gap-2"
              >
                {loading ? "Allocating..." : "Finalize Allocation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
