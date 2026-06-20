"use client";

import { useState } from "react";
import { History, X } from "lucide-react";

export default function StayHistoryModalButton({ stayHistory }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!stayHistory || stayHistory.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"
      >
        <History size={16} className="text-slate-500" />
        View Stay History
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <History size={20} className="text-slate-600" />
                Stay History
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4 pl-2 border-l-2 border-slate-100 ml-2">
                {stayHistory.map((stay) => (
                  <div key={stay.id} className="relative pl-5">
                    <div
                      className={`absolute -left-[21px] top-1.5 w-3 h-3 rounded-full ring-4 ring-white ${
                        stay.status === "ACTIVE" ? "bg-green-500" : "bg-slate-300"
                      }`}
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-800">
                        Room {stay.room?.roomNumber}
                        {stay.room?.block?.name && (
                          <span className="text-slate-500 font-normal">
                            {" "}
                            · {stay.room.block.name}
                          </span>
                        )}
                      </p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          stay.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {stay.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(stay.startDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {" — "}
                      {stay.endDate
                        ? new Date(stay.endDate).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Present"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
