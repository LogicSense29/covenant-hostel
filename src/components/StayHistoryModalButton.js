"use client";

import { useState } from "react";
import { History, X, MapPin } from "lucide-react";

export default function StayHistoryModalButton({ stayHistory, asCard = false }) {
  const [isOpen, setIsOpen] = useState(false);

  const hasHistory = stayHistory && stayHistory.length > 0;

  // ── Card variant — matches the 3 action cards in the dashboard row ──
  if (asCard) {
    return (
      <>
        <button
          onClick={() => hasHistory && setIsOpen(true)}
          disabled={!hasHistory}
          className="group relative bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-lg hover:border-violet-200 hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4 overflow-hidden text-left disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-sm"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 w-11 h-11 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-500 group-hover:bg-violet-500 group-hover:text-white transition-colors">
            <History size={20} />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-slate-800 group-hover:text-violet-700 transition-colors">Stay History</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              {hasHistory ? `${stayHistory.length} stay${stayHistory.length > 1 ? "s" : ""}` : "No history yet"}
            </p>
          </div>
        </button>

        {isOpen && <HistoryModal stayHistory={stayHistory} onClose={() => setIsOpen(false)} />}
      </>
    );
  }

  // ── Default inline button variant — styled as a pill to match the status row ──
  if (!hasHistory) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100 transition-colors"
      >
        <History size={11} />
        History
      </button>

      {isOpen && <HistoryModal stayHistory={stayHistory} onClose={() => setIsOpen(false)} />}
    </>
  );
}

function HistoryModal({ stayHistory, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History size={20} className="text-violet-500" />
            Stay History
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-4 pl-2 border-l-2 border-slate-100 ml-2">
            {stayHistory.map((stay) => (
              <div key={stay.id} className="relative pl-5">
                <div className={`absolute -left-[21px] top-1.5 w-3 h-3 rounded-full ring-4 ring-white ${
                  stay.status === "ACTIVE" ? "bg-emerald-400" : "bg-slate-300"
                }`} />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin size={11} className="text-slate-400 shrink-0" />
                    Room {stay.room?.roomNumber}
                    {stay.room?.block?.name && (
                      <span className="text-slate-400 font-normal">· {stay.room.block.name}</span>
                    )}
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                    stay.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    {stay.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 ml-4">
                  {new Date(stay.startDate).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })}
                  {" — "}
                  {stay.endDate
                    ? new Date(stay.endDate).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })
                    : "Present"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
