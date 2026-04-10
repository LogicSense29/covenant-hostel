"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare,
  Star,
  XCircle,
  Loader2
} from "lucide-react";
import TicketChatDrawer from "@/components/TicketChatDrawer";

export default function MaintenanceManager({ initialTickets, currentUser, tenantProfileId, roomId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [issueDescription, setIssueDescription] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const handleCancel = async (ticketId) => {
    if (!confirm("Cancel this ticket? It will be marked as cancelled and cannot be reopened.")) return;
    setCancellingId(ticketId);
    try {
      const res = await fetch(`/api/maintenance/tickets/${ticketId}/cancel`, { method: "POST" });
      if (res.ok) {
        router.refresh();
      } else {
        const err = await res.text();
        alert(err || "Could not cancel ticket");
      }
    } catch {
      alert("An error occurred");
    } finally {
      setCancellingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/maintenance/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueDescription })
      });
      if (res.ok) {
        setIssueDescription("");
        setShowForm(false);
        router.refresh();
      }
    } catch (err) {
      alert("Error submitting ticket");
    } finally {
      setLoading(false);
    }
  };

  const openChat = (ticket) => {
    setSelectedTicket(ticket);
    setIsChatOpen(true);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Maintenance Support</h1>
          <p className="text-slate-500 mt-1">Report facility issues and track repair status.</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:translate-y-px transition-all"
          >
            <Plus size={20} />
            Report New Issue
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in slide-in-from-top-4 duration-500">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare size={20} className="text-blue-600" />
              Describe the Issue
            </h2>
            <button onClick={() => setShowForm(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">Cancel</button>
          </div>
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Detailed Description</label>
              <textarea
                required
                rows={4}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-300"
                placeholder="Please describe the problem as clearly as possible..."
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:translate-y-px transition-all disabled:bg-slate-200"
            >
              {loading ? "Submitting Request..." : "Submit Maintenance Ticket"}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Your Recent Tickets</h2>
        
        {initialTickets.length === 0 ? (
          <div className="py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
            <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <CheckCircle2 size={32} className="text-green-200" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">All Systems Normal</h3>
            <p className="text-slate-500 mt-1 max-w-xs mx-auto text-sm">You haven't reported any maintenance issues yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {initialTickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden p-6 flex flex-col md:flex-row md:items-center gap-6">
                 <div className={`p-4 rounded-xl shrink-0 ${
                   ticket.status === 'OPEN' ? 'bg-red-50 text-red-600 border border-red-100' :
                   ticket.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                   ticket.status === 'CANCELLED' ? 'bg-slate-100 text-slate-400 border border-slate-200' :
                   'bg-green-50 text-green-600 border border-green-100'
                 }`}>
                    <Wrench size={24} />
                 </div>

                 <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${
                         ticket.status === 'OPEN' ? 'bg-red-600 text-white' :
                         ticket.status === 'IN_PROGRESS' ? 'bg-amber-500 text-white' :
                         ticket.status === 'CANCELLED' ? 'bg-slate-300 text-slate-600' :
                         'bg-green-600 text-white'
                       }`}>
                         {ticket.status.replace("_", " ")}
                       </span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                         Ticket #{ticket.id.slice(-4)}
                       </span>
                       {ticket.status === 'RESOLVED' && ticket.tenantRating > 0 && (
                         <span className="flex items-center gap-0.5 text-amber-400">
                           {[1,2,3,4,5].map(s => (
                             <Star key={s} size={10} className={ticket.tenantRating >= s ? "fill-current" : "text-slate-200"} />
                           ))}
                         </span>
                       )}
                    </div>
                    <p className={`font-bold text-lg mb-1 leading-tight ${ticket.status === 'CANCELLED' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {ticket.issueDescription}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-400 font-medium flex-wrap">
                       <span className="flex items-center gap-1"><Clock size={12} /> Reported {new Date(ticket.createdAt).toLocaleDateString()}</span>
                       {ticket.provider && (
                         <span className="flex items-center gap-1 text-blue-600"><CheckCircle2 size={12} /> Assigned to {ticket.provider.user.name}</span>
                       )}
                    </div>
                 </div>

                 <div className="shrink-0 md:ml-auto flex items-center gap-2">
                    {/* Cancel button — only on OPEN unassigned tickets */}
                    {ticket.status === 'OPEN' && !ticket.providerId && (
                      <button
                        onClick={() => handleCancel(ticket.id)}
                        disabled={cancellingId === ticket.id}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all disabled:opacity-50"
                      >
                        {cancellingId === ticket.id
                          ? <Loader2 size={13} className="animate-spin" />
                          : <XCircle size={13} />
                        }
                        Cancel
                      </button>
                    )}

                    {ticket.status !== 'CANCELLED' && (
                      <button 
                        onClick={() => openChat(ticket)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all"
                      >
                        <MessageSquare size={14} />
                        {ticket.status === 'RESOLVED' ? 'View Chat' : 'Open Chat'}
                      </button>
                    )}
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TicketChatDrawer 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        ticket={selectedTicket} 
        currentUser={currentUser}
      />
    </div>
  );
}
