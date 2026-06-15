"use client";

import { useState } from "react";
import { Home, Calendar } from "lucide-react";

export default function StayHistorySection({ stayHistory }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!stayHistory?.length) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Stay History</h2>
        </div>
        <div className="p-6">
          <p className="text-xs text-slate-400 text-center py-4">No stay history recorded.</p>
        </div>
      </div>
    );
  }

  const displayedStays = stayHistory.slice(0, 3);
  const hasMore = stayHistory.length > 3;

  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Stay History</h2>
        </div>
        <div className="p-6">
          <div className="space-y-3 pl-2 border-l-2 border-slate-100 ml-2">
            {displayedStays.map((stay) => (
              <div key={stay.id} className="relative pl-4">
                <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-white" />
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-800">
                    Room {stay.room?.roomNumber}{stay.room?.block?.name && ` · ${stay.room.block.name}`}
                  </p>
                  {(() => {
                    const isCompleted = stay.endDate && new Date(stay.endDate) < new Date();
                    const displayStatus = isCompleted ? "COMPLETED" : stay.status;
                    return (
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${
                        displayStatus === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                      }`}>{displayStatus}</span>
                    );
                  })()}
                </div>
                <p className="text-[10px] text-slate-400">
                  {new Date(stay.startDate).toLocaleDateString()} — {stay.endDate ? new Date(stay.endDate).toLocaleDateString() : "Present"}
                </p>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="pt-3 border-t border-slate-100 mt-4 text-center">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center justify-center gap-1 w-full"
              >
                View all Stay History
              </button>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase rounded-lg tracking-wider flex items-center gap-1">
                    <Home size={10} /> Stay History
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  All Room Assignments
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                  <Calendar size={12} />
                  Full timeline of tenant's room allocations
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-6 pl-2 border-l-2 border-slate-100 ml-2">
                {stayHistory.map((stay) => (
                  <div key={stay.id} className="relative pl-5">
                    <div className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white" />
                    
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          Room {stay.room?.roomNumber}
                        </h4>
                        {(() => {
                          const isCompleted = stay.endDate && new Date(stay.endDate) < new Date();
                          const displayStatus = isCompleted ? "COMPLETED" : stay.status;
                          return (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border ${
                              displayStatus === "ACTIVE" 
                                ? "bg-green-50 text-green-700 border-green-200" 
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}>{displayStatus}</span>
                          );
                        })()}
                      </div>
                      
                      {stay.room?.block && (
                        <p className="text-xs font-semibold text-slate-600 mb-3 flex items-center gap-1.5">
                           <Home size={12} className="text-slate-400"/>
                           {stay.room.block.name}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 border-t border-slate-200/60 pt-3 mt-3">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Move In</p>
                          <p className="text-xs font-bold text-slate-700">{new Date(stay.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                        </div>
                        <div className="w-px h-6 bg-slate-200/60"></div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Move Out</p>
                          <p className="text-xs font-bold text-slate-700">{stay.endDate ? new Date(stay.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Present"}</p>
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* Done Action */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm transition-all shadow-sm"
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
