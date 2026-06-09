"use client";

import { useState, useRef, useEffect } from "react";
import {
  MoreVertical,
  Mail,
  CheckCircle,
  XCircle,
  UserPlus,
  RefreshCw,
  UserMinus,
  Loader2,
  Send,
  Home,
  Calendar as CalendarIcon,
  ChevronRight,
  Info,
  X
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function TenantActionsMenu({
  profile,
  availableRooms,
  onEmail,
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef(null);

  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [rentExpiryDate, setRentExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split("T")[0];
  });

  const status = profile.user?.status || "ACTIVE";
  const hasUnverifiedPayment = (profile.payments || []).some(p => p.status === "PENDING");

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Action handlers ──

  const confirmAction = (message, onConfirm) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-slate-800">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={() => { toast.dismiss(t.id); onConfirm(); }}
            className="flex-1 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg"
          >Confirm</button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg"
          >Cancel</button>
        </div>
      </div>
    ), { duration: 10000 });
  };

  const handleApprove = () => {
    setOpen(false);
    confirmAction("Approve this tenant? An email with a setup link will be sent.", async () => {
      setLoading(true);
      const id = toast.loading("Approving tenant...");
      try {
        const res = await fetch("/api/landlord/approve-tenant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: profile.userId }),
        });
        if (res.ok) { toast.success("Tenant approved!", { id }); window.location.reload(); }
        else { toast.error(await res.text() || "Approval failed", { id }); }
      } catch { toast.error("Unexpected error", { id }); }
      finally { setLoading(false); }
    });
  };

  const handleActivate = () => {
    setOpen(false);
    confirmAction("Activate this tenancy? The start date will be set to today.", async () => {
      setLoading(true);
      const id = toast.loading("Activating tenancy...");
      try {
        const res = await fetch("/api/landlord/activate-tenancy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: profile.userId }),
        });
        if (res.ok) { toast.success("Tenancy activated!", { id }); window.location.reload(); }
        else { toast.error(await res.text() || "Activation failed", { id }); }
      } catch { toast.error("Unexpected error", { id }); }
      finally { setLoading(false); }
    });
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectNote.trim()) { toast.error("Please provide a rejection reason."); return; }
    setLoading(true);
    const id = toast.loading("Rejecting application...");
    try {
      const res = await fetch("/api/landlord/reject-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.userId, reason: rejectNote }),
      });
      if (res.ok) {
        toast.success("Application rejected and email sent.", { id });
        setShowRejectModal(false);
        window.location.reload();
      } else { toast.error(await res.text() || "Rejection failed", { id }); }
    } catch { toast.error("An error occurred", { id }); }
    finally { setLoading(false); }
  };

  const handleAssign = async () => {
    if (!selectedRoom) { toast.error("Please select a room."); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/tenants/${profile.id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: selectedRoom, rentExpiryDate }),
      });
      if (res.ok) {
        toast.success("Room assigned successfully!");
        setShowAssignModal(false);
        router.refresh();
      } else { toast.error(await res.text() || "Failed to assign room."); }
    } catch { toast.error("Error assigning room."); }
    finally { setLoading(false); }
  };

  const handleUnassign = () => {
    setOpen(false);
    confirmAction("Unassign this tenant from their room?", async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tenants/${profile.id}/unassign`, { method: "PUT" });
        if (res.ok) { toast.success("Room unassigned."); router.refresh(); }
        else { toast.error("Failed to unassign room."); }
      } catch { toast.error("Error unassigning room."); }
      finally { setLoading(false); }
    });
  };

  // ── Menu items by status ──
  const menuItems = [];

  // Email — always
  menuItems.push({
    label: "Send Email",
    icon: <Mail size={14} />,
    onClick: () => { setOpen(false); onEmail(profile); },
    color: "text-slate-700",
  });

  if (status === "PENDING") {
    menuItems.push({ label: "Approve", icon: <CheckCircle size={14} />, onClick: handleApprove, color: "text-emerald-700" });
    menuItems.push({ label: "Reject", icon: <XCircle size={14} />, onClick: () => { setOpen(false); setShowRejectModal(true); }, color: "text-red-600" });
  }

  if (status === "PAYMENT_MADE") {
    menuItems.push({
      label: "Verify & Activate",
      icon: <CheckCircle size={14} />,
      onClick: handleActivate,
      color: "text-blue-700",
      disabled: hasUnverifiedPayment,
      hint: hasUnverifiedPayment ? "Approve payment receipt first" : null,
    });
  }

  if (status !== "REJECTED") {
    if (profile.roomId) {
      menuItems.push({ label: "Change Room", icon: <RefreshCw size={14} />, onClick: () => { setOpen(false); setShowAssignModal(true); }, color: "text-blue-700" });
      menuItems.push({ label: "Unassign Room", icon: <UserMinus size={14} />, onClick: handleUnassign, color: "text-red-600" });
    } else {
      menuItems.push({ label: "Assign Room", icon: <UserPlus size={14} />, onClick: () => { setOpen(false); setShowAssignModal(true); }, color: "text-slate-700" });
    }
  }

  return (
    <>
      {/* Kebab trigger */}
      <div ref={menuRef} className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); setOpen(prev => !prev); }}
          disabled={loading}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all disabled:opacity-50"
          title="Actions"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <MoreVertical size={16} />}
        </button>

        {open && (
          <div
            className="absolute right-0 top-full mt-1 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {menuItems.map((item, i) => (
              <button
                key={i}
                onClick={item.disabled ? undefined : item.onClick}
                disabled={item.disabled}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-colors ${
                  item.disabled
                    ? "text-slate-300 cursor-not-allowed"
                    : `${item.color} hover:bg-slate-50`
                }`}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {item.hint && (
                  <span className="text-[9px] text-amber-500 font-bold">⚠</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Reject Modal ── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <XCircle size={20} className="text-red-600" /> Reject Application
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleReject} className="p-6 space-y-4">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                  Provide a reason — it will be emailed to the applicant.
                </p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Rejection Reason</label>
                <textarea
                  required rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-red-500/10 focus:bg-white focus:border-red-500 transition-all resize-none"
                  placeholder="e.g. ID document is not clear..."
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-[2] py-3 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:bg-slate-300 transition-all">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Send Rejection Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Assign Room Modal ── */}
      {showAssignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Room Allocation</h3>
                <p className="text-xs text-slate-500 font-medium">Assign or change tenant's residence</p>
              </div>
              <button onClick={() => setShowAssignModal(false)}
                className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-colors shadow-sm">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Choose Available Room</label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                  {availableRooms.map((room) => {
                    const isFull = room.tenants?.length >= room.capacity;
                    const isSelected = selectedRoom === room.id;
                    return (
                      <button key={room.id} disabled={isFull} onClick={() => setSelectedRoom(room.id)}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-left group ${
                          isSelected ? "bg-blue-50 border-blue-200 ring-2 ring-blue-500/10"
                          : isFull ? "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed"
                          : "bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl border ${isSelected ? "bg-blue-600 text-white border-blue-500" : "bg-white text-slate-400 border-slate-200"}`}>
                            <Home size={16} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className={`text-sm font-bold ${isSelected ? "text-blue-900" : "text-slate-700"}`}>Room {room.roomNumber}</p>
                              {room.block && (
                                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 uppercase">{room.block.name}</span>
                              )}
                            </div>
                            <p className="text-[10px] font-medium text-slate-400">{room.tenants?.length || 0}/{room.capacity} beds</p>
                          </div>
                        </div>
                        {isSelected && <ChevronRight size={14} className="text-blue-600" />}
                        {isFull && <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">FULL</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Rent Expiry Date</label>
                <div className="relative">
                  <CalendarIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="date" value={rentExpiryDate} onChange={(e) => setRentExpiryDate(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-200 transition-all" />
                </div>
                <div className="flex items-start gap-2 p-3 bg-blue-50/50 rounded-xl border border-blue-50">
                  <Info size={13} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-medium text-blue-600 leading-relaxed">Default is 1 year from today. This triggers automated rent reminders.</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-3 bg-white text-slate-600 text-sm font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button onClick={handleAssign} disabled={loading || !selectedRoom}
                className="flex-[2] px-4 py-3 bg-blue-600 text-white text-sm font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 disabled:bg-blue-300 disabled:shadow-none transition-all flex items-center justify-center gap-2">
                {loading ? "Allocating..." : "Finalize Allocation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
