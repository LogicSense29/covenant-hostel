"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { 
  Plus, 
  Search, 
  ClipboardCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X,
  User,
  Home,
  FileText,
  Calendar
} from "lucide-react";

export default function InspectionManager({ initialInspections, tenants, rooms }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState("TENANT"); // "TENANT" or "GUEST"
  const [guestInspections, setGuestInspections] = useState([]);
  
  const [formData, setFormData] = useState({
    tenantId: "",
    roomId: "",
    date: new Date().toISOString().split('T')[0],
    notes: ""
  });

  // Fetch guest inspections
  useState(() => {
    fetch("/api/guest-inspections")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setGuestInspections(data);
      })
      .catch(console.error);
  }, []);

  const getMinDate = () => {
    const now = new Date();
    const hour = now.getHours();
    // If past 1pm, disable today — earliest is tomorrow
    if (hour >= 13) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    return now.toISOString().split('T')[0];
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.roomId) {
      toast.error("Selected tenant has no room assigned.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowAddModal(false);
        setFormData({ tenantId: "", roomId: "", date: new Date().toISOString().split('T')[0], notes: "" });
        toast.success("Inspection scheduled successfully!");
        router.refresh();
      } else {
        toast.error("Failed to schedule inspection.");
      }
    } catch (err) {
      toast.error("Error scheduling inspection");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/inspections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(`Inspection status updated to ${status}`);
        router.refresh();
      } else {
        toast.error("Failed to update status.");
      }
    } catch (err) {
      toast.error("Error updating status");
    } finally {
      setLoading(false);
    }
  };

  const updateGuestStatus = async (id, status) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/guest-inspections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(`Guest inspection ${status.toLowerCase()}`);
        // Refresh guest inspections
        const updatedData = await fetch("/api/guest-inspections").then(r => r.json());
        if (Array.isArray(updatedData)) setGuestInspections(updatedData);
      } else {
        toast.error("Failed to update status.");
      }
    } catch (err) {
      toast.error("Error updating status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Facility Inspections</h1>
          <p className="text-slate-500 mt-1">Schedule and manage move-in/move-out reports.</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ tenantId: "", roomId: "", date: getMinDate(), notes: "" });
            setShowAddModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:translate-y-px transition-all"
        >
          <Plus size={20} />
          Schedule Inspection
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 max-w-md flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 group focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by tenant or room..." 
            className="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>
        
        <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
          <button 
            onClick={() => setViewMode("TENANT")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === "TENANT" ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
          >
            Tenant Reports
          </button>
          <button 
            onClick={() => setViewMode("GUEST")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === "GUEST" ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
          >
            Guest Tours
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {viewMode === "TENANT" ? (
          initialInspections.length === 0 ? (
            <div className="py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
              <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <ClipboardCheck size={32} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No inspections scheduled</h3>
              <p className="text-slate-500 mt-1 max-w-xs mx-auto text-sm">Schedule your first inspection to start tracking facility status.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {initialInspections.map((insp) => (
                <div key={insp.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden p-6 flex flex-col md:flex-row md:items-center gap-6">
                   <div className={`p-4 rounded-xl shrink-0 ${
                     insp.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                     insp.status === 'PASSED' ? 'bg-green-50 text-green-600' :
                     'bg-red-50 text-red-600'
                   }`}>
                      <ClipboardCheck size={24} />
                   </div>
  
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${
                           insp.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                           insp.status === 'PASSED' ? 'bg-green-100 text-green-700' :
                           'bg-red-100 text-red-700'
                         }`}>
                           {insp.status}
                         </span>
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                           Report #{insp.id.slice(-6).toUpperCase()}
                         </span>
                      </div>
                      <div className="flex items-center gap-3 mb-1">
                         <h3 className="font-bold text-slate-900 text-lg">Room {insp.room?.roomNumber} - {insp.tenant?.user?.name}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                         <span className="flex items-center gap-1"><Calendar size={12} /> Scheduled: {new Date(insp.date).toLocaleDateString()}</span>
                         {insp.feePaid && <span className="flex items-center gap-1 text-green-600 font-bold"><CheckCircle2 size={12} /> Fee Paid</span>}
                      </div>
                      {insp.notes && <p className="text-sm text-slate-500 mt-2 line-clamp-1 italic">"{insp.notes}"</p>}
                   </div>
  
                   <div className="flex items-center gap-2 shrink-0 md:ml-auto">
                      {insp.status === 'PENDING' && (
                        <>
                          <button 
                            onClick={() => updateStatus(insp.id, 'PASSED')}
                            className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-all shadow-sm"
                          >
                            Mark Passed
                          </button>
                          <button 
                            onClick={() => updateStatus(insp.id, 'FAILED')}
                            className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all shadow-sm"
                          >
                            Mark Failed
                          </button>
                        </>
                      )}
                      <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                         <FileText size={20} />
                      </button>
                   </div>
                </div>
              ))}
            </div>
          )
        ) : (
          guestInspections.length === 0 ? (
            <div className="py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
              <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <User size={32} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No guest tours booked</h3>
              <p className="text-slate-500 mt-1 max-w-xs mx-auto text-sm">Prospective tenants booking via the public portal will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {guestInspections.map((guest) => (
                <div key={guest.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                  {/* Header with status badges */}
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                        <User size={18} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{guest.name}</h3>
                        <p className="text-xs text-slate-500 truncate max-w-[150px]">{guest.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                        guest.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                        guest.status === 'DONE' ? 'bg-green-100 text-green-700' :
                        guest.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {guest.status}
                      </div>
                      {guest.feePaid ? (
                        <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 size={10} /> ₦{Number(guest.amountPaid || 0).toLocaleString()} Paid
                        </div>
                      ) : (guest.amountPaid === 0 || guest.amountPaid === null) ? (
                        <div className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider">
                          Free
                        </div>
                      ) : null}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 space-y-3">
                    {/* Room Info - Compact inline style */}
                    {guest.roomNumber ? (
                      <div className="flex items-start gap-2 text-sm">
                        <Home size={14} className="text-blue-600 mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 text-sm">
                            Room {guest.roomNumber}
                            {guest.blockName && <span className="text-slate-500 font-normal"> · {guest.blockName}</span>}
                          </p>
                          {guest.address && <p className="text-xs text-slate-400 truncate">{guest.address}</p>}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Home size={14} className="shrink-0" />
                        <span className="text-xs italic">General inspection</span>
                      </div>
                    )}
                    
                    {/* Date and Phone */}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-900">{new Date(guest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    
                    {guest.phone && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="w-3.5"></span>
                        <span className="truncate">{guest.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {guest.status === 'PENDING' && (
                    <div className="p-4 pt-0 flex gap-2">
                      <button 
                        onClick={() => updateGuestStatus(guest.id, 'CONFIRMED')}
                        disabled={loading}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button 
                        onClick={() => updateGuestStatus(guest.id, 'FAILED')}
                        disabled={loading}
                        className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  
                  {guest.status === 'CONFIRMED' && (
                    <div className="p-4 pt-0">
                      <button 
                        onClick={() => updateGuestStatus(guest.id, 'PASSED')}
                        disabled={loading}
                        className="w-full px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-all disabled:opacity-50"
                      >
                        Mark Done
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">Schedule New Inspection</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="p-8 space-y-5">
              <div className="text-slate-500">
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 px-1">Tenant</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all"
                  value={formData.tenantId}
                  onChange={(e) => {
                    const t = tenants.find(t => t.id === e.target.value);
                    setFormData({...formData, tenantId: e.target.value, roomId: t?.roomId || ""});
                  }}
                >
                  <option value="">Select Tenant...</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.user.name} (Room {t.room?.roomNumber || "N/A"})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 px-1">Inspection Date</label>
                <input
                  type="date"
                  required
                  min={getMinDate()}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all text-slate-500"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 px-1">Internal Notes</label>
                <textarea
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all text-slate-500"
                  placeholder="Items to check, specific concerns..."
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all disabled:bg-slate-200"
                >
                  {loading ? "Scheduling..." : "Confirm Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
