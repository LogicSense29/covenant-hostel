"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { 
  X, 
  Home, 
  UserPlus, 
  ChevronRight,
  RefreshCw,
  ArrowRight,
  AlertCircle
} from "lucide-react";

export default function AssignRoomActions({ tenantId, currentRoomId, rentExpiryDate, rentStartDate, availableRooms }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState("");

  // Carry-over prompt state
  const [showCarryOverPrompt, setShowCarryOverPrompt] = useState(false);
  const [pendingRoomId, setPendingRoomId] = useState(null);

  // Determine if tenant has an active unexpired rent cycle
  const hasActiveCycle = currentRoomId && rentExpiryDate && new Date(rentExpiryDate) > new Date();

  const handleAssignClick = () => {
    if (!selectedRoom) { toast.error("Please select a room."); return; }

    if (hasActiveCycle) {
      // Show carry-over prompt before submitting
      setPendingRoomId(selectedRoom);
      setIsOpen(false);
      setShowCarryOverPrompt(true);
    } else {
      confirmAssign(selectedRoom, false);
    }
  };

  const confirmAssign = async (roomId, carryOverBalance) => {
    setLoading(true);
    setShowCarryOverPrompt(false);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, carryOverBalance })
      });

      if (res.ok) {
        toast.success(carryOverBalance ? "Room changed. Remaining balance carried over." : "Room assigned successfully!");
        setIsOpen(false);
        setSelectedRoom("");
        router.refresh();
      } else {
        const text = await res.text();
        toast.error(text || "Failed to assign room.");
      }
    } catch (e) {
      toast.error("Error occurred while assigning room.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    if (!confirm("Are you sure you want to unassign this tenant?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/unassign`, { method: "PUT" });
      if (res.ok) {
        toast.success("Room unassigned successfully!");
        router.refresh();
      } else {
        toast.error("Failed to unassign room.");
      }
    } catch (e) {
      toast.error("Error occurred while unassigning room.");
    } finally {
      setLoading(false);
    }
  };

  const expiryFormatted = rentExpiryDate
    ? new Date(rentExpiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <>
      <div className="flex items-center gap-2">
        {currentRoomId ? (
          <>
            <button
              onClick={() => setIsOpen(true)}
              className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg border border-blue-100 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1.5"
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

      {/* ── Room Selection Modal ── */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Room Allocation</h3>
                <p className="text-xs text-slate-500 font-medium">Assign or change tenant's residence</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-colors shadow-sm">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Room Selection */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Choose Available Room</label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                  {availableRooms.map((room) => {
                    const isFull     = room.tenants?.length >= room.capacity;
                    const hasBilling = room.billingRules?.length > 0;
                    const isLocked   = isFull || !hasBilling;
                    const isSelected = selectedRoom === room.id;

                    return (
                      <button
                        key={room.id}
                        disabled={isLocked}
                        title={!hasBilling ? "No billing rule set up for this room. Add one in Room Management first." : undefined}
                        onClick={() => !isLocked && setSelectedRoom(room.id)}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-left group ${
                          isSelected
                            ? "bg-blue-50 border-blue-200 ring-2 ring-blue-500/10"
                            : isLocked
                              ? "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed"
                              : "bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl border ${isSelected ? "bg-blue-600 text-white border-blue-500" : "bg-white text-slate-400 border-slate-200 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors"}`}>
                            <Home size={16} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className={`text-sm font-bold ${isSelected ? "text-blue-900" : "text-slate-700"}`}>Room {room.roomNumber}</p>
                              {room.block && (
                                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 uppercase">
                                  {room.block.name}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-medium text-slate-500">
                              ₦{room.rentAmount.toLocaleString()} <span className="text-blue-600 font-bold ml-1">₦{(room.rentAmount / room.capacity).toLocaleString()}/Bed</span>
                            </p>
                            <p className="text-[10px] font-medium text-slate-400">{room.tenants?.length || 0}/{room.capacity} beds occupied</p>
                          </div>
                        </div>
                        {isSelected  && <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white"><ChevronRight size={14} strokeWidth={3} /></div>}
                        {isFull      && <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">FULL</span>}
                        {!hasBilling && <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">NO BILLING</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
              <button onClick={() => setIsOpen(false)} className="flex-1 px-4 py-3 bg-white text-slate-600 text-sm font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button
                onClick={handleAssignClick}
                disabled={loading || !selectedRoom}
                className="flex-[2] px-4 py-3 bg-blue-600 text-white text-sm font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 disabled:bg-blue-300 disabled:shadow-none transition-all flex items-center justify-center gap-2"
              >
                {loading ? "Allocating..." : "Finalize Allocation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Carry-Over Balance Prompt ── */}
      {showCarryOverPrompt && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              {/* Icon */}
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
                <AlertCircle size={24} className="text-amber-500" />
              </div>

              <h3 className="text-lg font-black text-slate-900">Active Rent Cycle Detected</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                This tenant has an active rent cycle expiring on <span className="font-bold text-slate-700">{expiryFormatted}</span>. What should happen to their remaining balance?
              </p>

              <div className="mt-5 space-y-3">
                {/* Carry over */}
                <button
                  onClick={() => confirmAssign(pendingRoomId, true)}
                  disabled={loading}
                  className="w-full text-left p-4 rounded-2xl border-2 border-blue-200 bg-blue-50 hover:border-blue-400 hover:bg-blue-100 transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-blue-900">Carry over remaining balance</p>
                      <p className="text-xs text-blue-600 mt-0.5">What they owe is credited to the new room. Expiry date stays the same.</p>
                    </div>
                    <ArrowRight size={16} className="text-blue-400 group-hover:text-blue-600 shrink-0 ml-3" />
                  </div>
                </button>

                {/* Fresh start */}
                <button
                  onClick={() => confirmAssign(pendingRoomId, false)}
                  disabled={loading}
                  className="w-full text-left p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Fresh start</p>
                      <p className="text-xs text-slate-500 mt-0.5">Previous balance is written off. New rent cycle begins from today.</p>
                    </div>
                    <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-600 shrink-0 ml-3" />
                  </div>
                </button>
              </div>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={() => { setShowCarryOverPrompt(false); setIsOpen(true); }}
                className="w-full py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              >
                ← Go back
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
