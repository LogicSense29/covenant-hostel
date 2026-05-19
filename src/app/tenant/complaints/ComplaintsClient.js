"use client";

import { useState } from "react";
import { Plus, Clock, ShieldAlert, MessageSquare, X } from "lucide-react";
import ComplaintForm from "./ComplaintForm";
import TicketChatDrawer from "@/components/TicketChatDrawer";

export default function ComplaintsClient({ complaints, currentUser }) {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openChat = (ticket) => {
    setSelectedTicket(ticket);
    setIsChatOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Complaint Center</h1>
          <p className="text-slate-500 mt-2 font-medium">Report non-facility issues, noise complaints, or general disputes.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-500/20 active:translate-y-px transition-all shrink-0"
        >
          <Plus size={20} />
          New Complaint
        </button>
      </div>

      {/* Complaint List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Complaints</h2>
            <p className="text-xs text-slate-500 mt-0.5">Track the status of your reported grievances.</p>
          </div>
          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-100 uppercase tracking-widest">
            Official Record
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {complaints.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert size={28} className="text-slate-200" />
              </div>
              <p className="text-sm font-bold text-slate-400">No complaints recorded</p>
              <p className="text-xs text-slate-400 mt-1">Click &quot;New Complaint&quot; to report an issue.</p>
            </div>
          ) : (
            complaints.map((ticket) => (
              <div key={ticket.id} className="p-6 hover:bg-slate-50 transition-colors group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    {/* ID badge */}
                    <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center text-xs font-black ${
                      ticket.status === "OPEN" ? "bg-amber-50 text-amber-600" :
                      ticket.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-600" :
                      "bg-green-50 text-green-600"
                    }`}>
                      #{ticket.id.slice(-4).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                        {ticket.issueDescription}
                      </p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest ${
                          ticket.status === "OPEN" ? "bg-amber-100 text-amber-700" :
                          ticket.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {ticket.status.replace("_", " ")}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(ticket.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Chat button */}
                  <button
                    onClick={() => openChat(ticket)}
                    className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-100 text-slate-600 rounded-xl text-xs font-bold transition-all"
                  >
                    <MessageSquare size={14} />
                    Chat
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── New Complaint Modal ── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
        >
          <div className="w-full max-w-lg animate-in slide-in-from-bottom-4 duration-300">
            {/* Close button */}
            <div className="flex justify-end mb-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg text-slate-500 hover:text-slate-800 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <ComplaintForm onClose={() => setIsModalOpen(false)} />
          </div>
        </div>
      )}

      <TicketChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        ticket={selectedTicket}
        currentUser={currentUser}
      />
    </div>
  );
}
