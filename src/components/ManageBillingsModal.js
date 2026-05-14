"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";

export default function ManageBillingsModal({
  isOpen,
  onClose,
  billingRules,
  initialSelectedIds,
  onSave,
  blockId,
  roomId,
}) {
  const [billingSearch, setBillingSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [fetchedRules, setFetchedRules] = useState([]);
  const [loading, setLoading] = useState(false);

  const rulesToUse = billingRules || fetchedRules;

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(initialSelectedIds || []);
      setBillingSearch("");
      
      if (!billingRules) {
        const fetchRules = async () => {
          setLoading(true);
          try {
            const res = await fetch("/api/billing");
            if (res.ok) {
              const data = await res.json();
              setFetchedRules(data);
            }
          } catch (error) {
            console.error("Failed to fetch billing rules", error);
          } finally {
            setLoading(false);
          }
        };
        fetchRules();
      }
    }
  }, [isOpen, initialSelectedIds, billingRules]);

  if (!isOpen) return null;

  const handleToggle = (ruleId) => {
    setSelectedIds((prev) =>
      prev.includes(ruleId)
        ? prev.filter((id) => id !== ruleId)
        : [...prev, ruleId]
    );
  };

  const handleDone = () => {
    onSave(selectedIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Manage Billing Rules
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {selectedIds.length} selected ·{" "}
              {
                rulesToUse.filter((r) => {
                  const type = String(r.type || "").toUpperCase();
                  return type !== "BASE_RENT" || (r.blockId === blockId && !!blockId);
                }).length
              }{" "}
              available
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search billing rules..."
              value={billingSearch}
              onChange={(e) => setBillingSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Rules List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {loading ? (
            <div className="text-center text-sm text-slate-500 py-4">Loading rules...</div>
          ) : rulesToUse
            .filter((r) => {
              const searchMatch = (r.title || r.description || "")
                .toLowerCase()
                .includes(billingSearch.toLowerCase());
              if (!searchMatch) return false;
              const type = String(r.type || "").toUpperCase();
              // Include BASE_RENT only if it belongs to the selected block
              if (type === "BASE_RENT") return r.blockId === blockId && !!blockId;
              return true;
            })
            .sort((a, b) => {
              const typeA = String(a.type || "").toUpperCase();
              const typeB = String(b.type || "").toUpperCase();

              // 1. Block BASE_RENT first
              if (typeA === "BASE_RENT" && a.blockId === blockId) return -1;
              if (typeB === "BASE_RENT" && b.blockId === blockId) return 1;

              // 2. Other block-specific rules next
              if (a.blockId === blockId && b.blockId !== blockId) return -1;
              if (b.blockId === blockId && a.blockId !== blockId) return 1;

              // 3. Global rules next
              if (a.isGlobal && !b.isGlobal) return -1;
              if (b.isGlobal && !a.isGlobal) return 1;

              // 4. Rest alphabetically
              return (a.title || a.description || "").localeCompare(
                b.title || b.description || ""
              );
            })
            .map((rule) => {
              const isSelected = selectedIds.includes(rule.id);
              const isRecommended =
                rule.isGlobal || rule.blockId === blockId || rule.roomId === roomId;
              return (
                <label
                  key={rule.id}
                  className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/30"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 shrink-0"
                    checked={isSelected}
                    onChange={() => handleToggle(rule.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-sm font-bold truncate ${
                          isSelected ? "text-slate-900" : "text-slate-700"
                        }`}
                      >
                        {rule.title || rule.description}
                      </span>
                      {rule.isGlobal && (
                        <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md border border-blue-100 uppercase">
                          Global
                        </span>
                      )}
                      {!rule.isGlobal && isRecommended && (
                        <span className="text-[9px] font-bold bg-green-50 text-green-600 px-1.5 py-0.5 rounded-md border border-green-100 uppercase">
                          Recommended
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-600">
                        ₦{rule.amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 border-l border-slate-200 pl-2">
                        {String(rule.type || "").replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                </label>
              );
            })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-white">
          <button
            onClick={handleDone}
            className="w-full py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
