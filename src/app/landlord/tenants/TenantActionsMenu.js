"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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
  X,
  Search,
  Archive,
  ArchiveRestore,
  Trash2
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function TenantActionsMenu({
  profile,
  availableRooms,
  onEmail,
  userRole,
  onTenantUpdate, // (updatedProfile) => void — called after status changes
  onTenantRemove, // (tenantId) => void — called after delete/archive
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef(null);

  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [activateStartDate, setActivateStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [rentExpiryDate, setRentExpiryDate] = useState("");
  const [roomSearch, setRoomSearch] = useState("");
  const [showCarryOverPrompt, setShowCarryOverPrompt] = useState(false);

  // Is this a room *change* (tenant already has a room) vs a fresh assignment?
  const isRoomChange = Boolean(profile.roomId);

  // Compute expiry date from the selected room's BASE_RENT billing rule frequency
  const computeExpiryFromFrequency = (room) => {
    const baseRule = room?.billingRules?.find(
      (r) => r.type === "BASE_RENT" || r.type === "Base Rent"
    );
    const frequency = baseRule?.frequency || "YEARLY";
    const now = new Date();
    switch (frequency) {
      case "DAILY":        now.setDate(now.getDate() + 1);         break;
      case "MONTHLY":      now.setMonth(now.getMonth() + 1);        break;
      case "QUARTERLY":    now.setMonth(now.getMonth() + 3);        break;
      case "PER_SEMESTER": now.setMonth(now.getMonth() + 6);        break;
      case "YEARLY":       now.setFullYear(now.getFullYear() + 1);  break;
      case "ONCE":
      default:             now.setFullYear(now.getFullYear() + 1);  break;
    }
    return now.toISOString().split("T")[0];
  };

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
        if (res.ok) {
          toast.success("Tenant approved!", { id, duration: 3000 });
          onTenantUpdate?.({ ...profile, user: { ...profile.user, status: "AWAITING_PAYMENT" } });
        } else { toast.error(await res.text() || "Approval failed", { id }); }
      } catch { toast.error("Unexpected error", { id }); }
      finally { setLoading(false); }
    });
  };

  const handleActivate = () => {
    setOpen(false);
    setShowActivateModal(true);
  };

  const confirmActivate = async () => {
    setShowActivateModal(false);
    setLoading(true);
    const id = toast.loading("Activating tenancy...");
    try {
      let now = new Date();
      if (activateStartDate) {
        const parsed = new Date(activateStartDate);
        if (!isNaN(parsed.getTime())) now = parsed;
      }
      const res = await fetch("/api/landlord/activate-tenancy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.userId, startDate: now.toISOString() }),
      });
      if (res.ok) {
        toast.success("Tenancy activated!", { id, duration: 3000 });
        onTenantUpdate?.({ ...profile, user: { ...profile.user, status: "ACTIVE" } });
      } else { toast.error(await res.text() || "Activation failed", { id }); }
    } catch { toast.error("Unexpected error", { id }); }
    finally { setLoading(false); }
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
        toast.success("Application rejected and email sent.", { id, duration: 3000 });
        setShowRejectModal(false);
        onTenantUpdate?.({ ...profile, user: { ...profile.user, status: "REJECTED" } });
      } else { toast.error(await res.text() || "Rejection failed", { id }); }
    } catch { toast.error("An error occurred", { id }); }
    finally { setLoading(false); }
  };

  const handleAssign = async () => {
    if (!selectedRoom) { toast.error("Please select a room."); return; }
    const hasActiveCycle = profile.roomId && profile.rentExpiryDate && new Date(profile.rentExpiryDate) > new Date();
    if (hasActiveCycle) {
      setShowAssignModal(false);
      setShowCarryOverPrompt(true);
    } else {
      confirmAssign(selectedRoom, false);
    }
  };

  const confirmAssign = async (roomId, carryOverBalance) => {
    setShowCarryOverPrompt(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/tenants/${profile.id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, rentExpiryDate, carryOverBalance }),
      });
      if (res.ok) {
        const updatedRoom = availableRooms.find(r => r.id === roomId);
        toast.success(carryOverBalance ? "Room changed. Remaining balance carried over." : "Room assigned successfully!", { duration: 3000 });
        setShowAssignModal(false);
        onTenantUpdate?.({ ...profile, roomId, room: updatedRoom || profile.room });
      } else { toast.error(await res.text() || "Failed to assign room."); }
    } catch { toast.error("Error assigning room."); }
    finally { setLoading(false); }
  };

  const handleUnassign = (force = false) => {
    setOpen(false);
    confirmAction(
      force 
        ? "WARNING: Force ending tenancy will evict the tenant despite outstanding balances. Proceed?" 
        : "End this tenancy and unassign the room?", 
      async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tenants/${profile.id}/unassign`, { 
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ force })
        });
        if (res.ok) { 
          toast.success("Tenancy ended successfully.", { duration: 3000 }); 
          onTenantUpdate?.({ ...profile, roomId: null, room: null, user: { ...profile.user, status: "AWAITING_PAYMENT" } });
        } else { 
          const errorMsg = await res.text();
          if (errorMsg.includes("Force eviction required")) {
            toast.error("Outstanding payments detected.", { duration: 4000 });
            setTimeout(() => {
              confirmAction("Tenant owes money. Force End Tenancy anyway?", () => handleUnassign(true));
            }, 500);
          } else {
            toast.error(errorMsg || "Failed to end tenancy."); 
          }
        }
      } catch { toast.error("Error ending tenancy."); }
      finally { setLoading(false); }
    });
  };

  const handleArchive = () => {
    setOpen(false);
    confirmAction("Archive this tenant? They will be moved to the archived list and access locked.", async () => {
      setLoading(true);
      const id = toast.loading("Archiving tenant...");
      try {
        const res = await fetch(`/api/tenants/${profile.id}/archive`, { method: "POST" });
        if (res.ok) {
          toast.success("Tenant archived!", { id, duration: 3000 });
          onTenantRemove?.(profile.id);
        } else { toast.error(await res.text() || "Archiving failed", { id }); }
      } catch { toast.error("Unexpected error", { id }); }
      finally { setLoading(false); }
    });
  };

  const handleUnarchive = () => {
    setOpen(false);
    confirmAction("Restore this tenant from archive?", async () => {
      setLoading(true);
      const id = toast.loading("Restoring tenant...");
      try {
        const res = await fetch(`/api/tenants/${profile.id}/archive`, { method: "DELETE" });
        if (res.ok) {
          toast.success("Tenant restored!", { id, duration: 3000 });
          onTenantRemove?.(profile.id);
        } else { toast.error(await res.text() || "Restore failed", { id }); }
      } catch { toast.error("Unexpected error", { id }); }
      finally { setLoading(false); }
    });
  };

  const handleDelete = () => {
    setOpen(false);
    confirmAction(
      "⚠️ PERMANENT DELETE: This will permanently delete this tenant and all their data. This CANNOT be undone. Are you absolutely sure?",
      async () => {
        setLoading(true);
        const id = toast.loading("Deleting tenant permanently...");
        try {
          const res = await fetch(`/api/tenants/${profile.id}/delete`, { method: "DELETE" });
          if (res.ok) { 
            toast.success("Tenant permanently deleted", { id, duration: 3000 });
            onTenantRemove?.(profile.id);
          } else { 
            toast.error(await res.text() || "Delete failed", { id }); 
          }
        } catch { 
          toast.error("Unexpected error", { id }); 
        } finally { 
          setLoading(false); 
        }
      }
    );
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
      label: "Activate Tenancy",
      icon: <CheckCircle size={14} />,
      onClick: handleActivate,
      color: "text-blue-700",
      hint: hasUnverifiedPayment ? "Needs payment approval first" : null,
      disabled: hasUnverifiedPayment,
    });
  }

  if (status !== "REJECTED") {
    if (profile.roomId) {
      menuItems.push({
        label: "Change Room",
        icon: <RefreshCw size={14} />,
        onClick: () => {
          setOpen(false);
          // Seed expiry from existing value — tenant already paid, preserve their cycle
          const existing = profile.rentExpiryDate
            ? new Date(profile.rentExpiryDate).toISOString().split("T")[0]
            : "";
          setRentExpiryDate(existing);
          setShowAssignModal(true);
        },
        color: "text-blue-700",
      });
      menuItems.push({ label: "End Tenancy", icon: <UserMinus size={14} />, onClick: () => handleUnassign(false), color: "text-red-600" });
    } else {
      menuItems.push({
        label: "Assign Room",
        icon: <UserPlus size={14} />,
        onClick: () => {
          setOpen(false);
          setRentExpiryDate(""); // will be computed when room is selected
          setShowAssignModal(true);
        },
        color: "text-slate-700",
      });
    }
  }

  // Archive/Unarchive
  if (status === "ARCHIVED") {
    menuItems.push({ label: "Restore from Archive", icon: <ArchiveRestore size={14} />, onClick: handleUnarchive, color: "text-blue-700" });
  } else {
    menuItems.push({ label: "Archive", icon: <Archive size={14} />, onClick: handleArchive, color: "text-slate-500" });
  }

  // Delete (ADMIN only, dangerous)
  if (userRole === "ADMIN") {
    menuItems.push({ 
      label: "Delete Permanently", 
      icon: <Trash2 size={14} />, 
      onClick: handleDelete, 
      color: "text-red-600" 
    });
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
                <p className="text-center text-xs text-amber-700 font-medium leading-relaxed">
                  Provide a reason — it will be emailed to the applicant.
                </p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Rejection Reason</label>
                <textarea
                  required rows={4}
                  className="text-gray-800 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-red-500/10 focus:bg-white focus:border-red-500 transition-all resize-none"
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

      {/* ── Activate Modal ── */}
      {showActivateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle size={20} className="text-blue-600" /> Activate Tenancy
              </h3>
              <p className="text-xs text-slate-500 mt-1">Set the tenancy start date. Expiry is calculated automatically from the rent frequency.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tenancy Start Date</label>
                <input type="date" value={activateStartDate}
                  onChange={(e) => setActivateStartDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-300 transition-all"
                />
                <p className="text-[10px] text-slate-400 mt-1.5">Defaults to today. Adjust for backdated tenancy.</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowActivateModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all">
                  Cancel
                </button>
                <button type="button" onClick={confirmActivate} disabled={loading || !activateStartDate}
                  className="flex-[2] py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:bg-slate-300 transition-all">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  Confirm & Activate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Room Modal ── */}
      {showAssignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="self-start">
                <h3 className="text-lg font-bold text-slate-900 text-left">Room Allocation</h3>
                <p className="text-xs text-slate-500 font-medium">Assign or change tenant's residence</p>
              </div>
              <button onClick={() => setShowAssignModal(false)}
                className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-colors shadow-sm">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by room number or block…"
                    value={roomSearch}
                    onChange={(e) => setRoomSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-300 transition-all"
                  />
                </div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Choose Available Room</label>
                <div className="grid grid-cols-1 gap-2 max-h-44 overflow-y-auto pr-1">
                  {availableRooms
                    .filter((room) => {
                      const q = roomSearch.toLowerCase().trim();
                      if (!q) return true;
                      const roomNum  = String(room.roomNumber).toLowerCase();
                      const block    = (room.block?.name || "").toLowerCase();
                      // Individual field matches
                      if (roomNum.includes(q) || block.includes(q)) return true;
                      // Combined format: "room 1 block a" OR "block a room 1"
                      const combo1 = `room ${roomNum} ${block}`.trim();
                      const combo2 = `${block} room ${roomNum}`.trim();
                      return combo1.includes(q) || combo2.includes(q);
                    })
                    .map((room) => {
                      const isFull     = room.tenants?.length >= room.capacity;
                      const hasBilling = room.billingRules?.length > 0;
                      const isLocked   = isFull || !hasBilling;
                      const isSelected = selectedRoom === room.id;
                      return (
                        <button key={room.id} disabled={isLocked}
                          title={!hasBilling ? "No billing rule set up for this room. Add one in Room Management first." : isFull ? "This room is at full capacity." : undefined}
                          onClick={() => {
                            if (isLocked) return;
                            setSelectedRoom(room.id);
                            // Only auto-set expiry for fresh assignments.
                            // Room changes keep the tenant's existing payment cycle.
                            if (!isRoomChange) {
                              setRentExpiryDate(computeExpiryFromFrequency(room));
                            }
                          }}
                          className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-left group ${
                            isSelected ? "bg-blue-50 border-blue-200 ring-2 ring-blue-500/10"
                            : isLocked ? "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed"
                            : "bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* <div className={`p-2 rounded-xl border ${isSelected ? "bg-blue-600 text-white border-blue-500" : "bg-white text-slate-400 border-slate-200"}`}>
                              <Home size={16} />
                            </div> */}
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
                          {isSelected  && <ChevronRight size={14} className="text-blue-600" />}
                          {isFull      && <span className="text-[9px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">FULL</span>}
                          {!hasBilling && <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">NO BILLING</span>}
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
                <div className={`flex items-start gap-2 p-3 rounded-xl border ${
                  isRoomChange ? "bg-amber-50/60 border-amber-100" : "bg-blue-50/50 border-blue-50"
                }`}>
                  <Info size={13} className={`shrink-0 mt-0.5 ${isRoomChange ? "text-amber-500" : "text-blue-500"}`} />
                  <p className={`text-[10px] font-medium leading-relaxed ${isRoomChange ? "text-amber-700" : "text-blue-600"}`}>
                    {isRoomChange
                      ? "Existing rent period preserved — the tenant already paid for this cycle. Only change this if you intend to start a new billing cycle."
                      : selectedRoom
                        ? "Auto-set from the room's billing frequency. Adjust if needed."
                        : "Select a room — expiry will be set from its billing frequency."}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
              <button onClick={() => { setShowAssignModal(false); setRoomSearch(""); }}
                className="flex-1 px-4 py-3 bg-white text-slate-600 text-sm font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all">
                Cancel
              </button>
              {(() => {
                const selRoom = availableRooms.find(r => r.id === selectedRoom);
                const isFull = selRoom ? selRoom.tenants?.length >= selRoom.capacity : false;
                const isDisabled = loading || !selectedRoom || isFull;
                return (
                  <button
                    onClick={handleAssign}
                    disabled={isDisabled}
                    title={isFull ? "Selected room is at full capacity" : undefined}
                    className={`flex-[2] px-4 py-3 text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-2 ${
                      isFull
                        ? "bg-red-100 text-red-400 cursor-not-allowed shadow-none"
                        : isDisabled
                        ? "bg-blue-300 text-white shadow-none cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-500/20"
                    }`}
                  >
                    {loading ? <><Loader2 size={16} className="animate-spin" /> Allocating...</> : isFull ? "Room is Full" : "Finalize Allocation"}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── Carry-Over Balance Prompt ── */}
      {showCarryOverPrompt && (() => {
        const expiryFormatted = profile.rentExpiryDate
          ? new Date(profile.rentExpiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
          : null;
        return (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
                  <Info size={24} className="text-amber-500" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Active Rent Cycle Detected</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  This tenant has an active rent cycle expiring on <span className="font-bold text-slate-700">{expiryFormatted}</span>. What should happen to their remaining balance?
                </p>
                <div className="mt-5 space-y-3">
                  <button
                    onClick={() => confirmAssign(selectedRoom, true)}
                    disabled={loading}
                    className="w-full text-left p-4 rounded-2xl border-2 border-blue-200 bg-blue-50 hover:border-blue-400 hover:bg-blue-100 transition-all group disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-blue-900">Carry over remaining balance</p>
                        <p className="text-xs text-blue-600 mt-0.5">What they owe is credited to the new room. Expiry date stays the same.</p>
                      </div>
                      <ChevronRight size={16} className="text-blue-400 group-hover:text-blue-600 shrink-0 ml-3" />
                    </div>
                  </button>
                  <button
                    onClick={() => confirmAssign(selectedRoom, false)}
                    disabled={loading}
                    className="w-full text-left p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 transition-all group disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800">Fresh start</p>
                        <p className="text-xs text-slate-500 mt-0.5">Previous balance is written off. New rent cycle begins from today.</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600 shrink-0 ml-3" />
                    </div>
                  </button>
                </div>
              </div>
              <div className="px-6 pb-6">
                <button
                  onClick={() => { setShowCarryOverPrompt(false); setShowAssignModal(true); }}
                  className="w-full py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  ← Go back
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
