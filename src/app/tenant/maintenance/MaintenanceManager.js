"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  MessageSquare
} from "lucide-react";

export default function MaintenanceManager({ initialTickets }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [issueDescription, setIssueDescription] = useState("");

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
                placeholder="Please describe the problem as clearly as possible (e.g. Broken pipe in bathroom, Flickering light in kitchen...)"
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
            <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100 italic">
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
                   'bg-green-50 text-green-600 border border-green-100'
                 }`}>
                    <Wrench size={24} />
                 </div>

                 <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${
                         ticket.status === 'OPEN' ? 'bg-red-600 text-white' :
                         ticket.status === 'IN_PROGRESS' ? 'bg-amber-500 text-white' :
                         'bg-green-600 text-white'
                       }`}>
                         {ticket.status}
                       </span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                         Ticket #{ticket.id.slice(-4)}
                       </span>
                    </div>
                    <p className="text-slate-900 font-bold text-lg mb-1 leading-tight">{ticket.issueDescription}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                       <span className="flex items-center gap-1"><Clock size={12} /> Reported {new Date(ticket.createdAt).toLocaleDateString()}</span>
                       {ticket.provider && (
                         <span className="flex items-center gap-1 text-blue-600"><CheckCircle2 size={12} /> Assigned to {ticket.provider.user.name}</span>
                       )}
                    </div>
                 </div>

                 <div className="flex items-center gap-2 shrink-0 md:ml-auto">
                    <button className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">Details</button>
                    <ChevronRight size={18} className="text-slate-300" />
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
