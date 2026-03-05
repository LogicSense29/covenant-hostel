"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Home, 
  ExternalLink,
  Filter
} from "lucide-react";

export default function LandlordMaintenanceManager({ initialTickets, providers }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("ALL");

  const handleAssign = async (ticketId, providerId) => {
    if (!providerId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/maintenance/tickets/${ticketId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId })
      });
      if (res.ok) {
        toast.success("Ticket assigned successfully!");
        router.refresh();
      } else {
        toast.error("Failed to assign ticket.");
      }
    } catch (err) {
      toast.error("Error assigning ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (ticketId, status) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/maintenance/tickets/${ticketId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(`Ticket status updated to ${status}`);
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

  const filteredTickets = filter === "ALL" ? initialTickets : initialTickets.filter(t => t.status === filter);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Maintenance Dashboard</h1>
          <p className="text-slate-500 mt-1">Monitor issues, assign providers, and manage repairs.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
          {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                filter === s 
                ? "bg-slate-900 text-white shadow-lg" 
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredTickets.length === 0 ? (
          <div className="py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
            <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <CheckCircle2 size={32} className="text-green-200" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No tickets found</h3>
            <p className="text-slate-500 mt-1 max-w-xs mx-auto text-sm">Everything seems to be in order based on your current filters.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                <div className="p-8 flex flex-col lg:flex-row gap-8">
                   {/* Left Side: Ticket Info */}
                   <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                         <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tighter ${
                           ticket.status === 'OPEN' ? 'bg-red-50 text-red-600 border border-red-100' :
                           ticket.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                           'bg-green-50 text-green-600 border border-green-100'
                         }`}>
                           {ticket.status.replace("_", " ")}
                         </span>
                         <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tighter flex items-center gap-1 ${
                           ticket.category === 'COMPLAINT' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                         }`}>
                           {ticket.category === 'COMPLAINT' ? <AlertCircle size={10} /> : <Wrench size={10} />}
                           {ticket.category}
                         </span>
                         <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                           Ticket #{ticket.id.slice(-6).toUpperCase()}
                         </span>

                      </div>
                      <h3 className="text-xl font-bold text-slate-900 leading-snug">{ticket.issueDescription}</h3>
                      
                      <div className="flex flex-wrap items-center gap-6 pt-2">
                         <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                               <Home size={16} />
                            </div>
                            <div>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</p>
                               <p className="text-sm font-bold text-slate-700">Room {ticket.roomId}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                               <User size={16} />
                            </div>
                            <div>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reporter</p>
                               <p className="text-sm font-bold text-slate-700">{ticket.tenant?.user?.name || "Tenant"}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                               <Clock size={16} />
                            </div>
                            <div>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reported</p>
                               <p className="text-sm font-bold text-slate-700">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Right Side: Assignment/Action */}
                   <div className="w-full lg:w-80 space-y-4">
                      {ticket.status === 'RESOLVED' ? (
                        <div className="bg-green-50 p-6 rounded-2xl border border-green-100 flex items-center justify-center flex-col text-center">
                           <CheckCircle2 size={32} className="text-green-600 mb-2" />
                           <p className="text-sm font-bold text-green-900">Task Completed</p>
                           <p className="text-[10px] text-green-700 font-medium">Issue marked as resolved</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-1">Assign Service Provider</label>
                           <select 
                             className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all cursor-pointer"
                             value={ticket.providerId || ""}
                             onChange={(e) => handleAssign(ticket.id, e.target.value)}
                             disabled={loading}
                           >
                             <option value="">Unassigned</option>
                             {providers.map(p => (
                               <option key={p.id} value={p.id}>{p.user.name} ({p.specialty})</option>
                             ))}
                           </select>

                           {ticket.status === 'IN_PROGRESS' && (
                             <button 
                               onClick={() => handleStatusUpdate(ticket.id, 'RESOLVED')}
                               disabled={loading}
                               className="w-full py-4 bg-green-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-green-700 shadow-lg shadow-green-500/20 transition-all font-sans"
                             >
                               Mark as Resolved
                             </button>
                           )}
                        </div>
                      )}
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
