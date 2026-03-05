"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Info, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function BillingRulesManager({ defaultRules, rooms }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    isGlobal: true,
    roomId: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        isGlobal: formData.isGlobal === true || formData.isGlobal === "true"
      };

      if (payload.isGlobal) {
        payload.roomId = null;
      }

      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setFormData({ description: "", amount: "", isGlobal: true, roomId: "" });
        toast.success("Billing rule created successfully!");
        router.refresh();
      } else {
        toast.error("Failed to create rule");
      }
    } catch (err) {
      toast.error("An error occurred while creating rule");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this billing rule?")) return;
    setLoading(true);
    try {
      if (res.ok) {
        toast.success("Billing rule deleted successfully!");
        router.refresh();
      } else {
        toast.error("Failed to delete rule");
      }
    } catch (err) {
      toast.error("Error deleting rule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      
      {/* Existing Rules List */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-green-600" />
              Active Billing Rules
            </h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-2 py-1 rounded border border-slate-100">
              {defaultRules.length} Total
            </span>
          </div>
          
          <div className="p-0">
            {defaultRules.length === 0 ? (
              <div className="p-12 text-center">
                <div className="bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Info size={24} className="text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-500">No specific billing rules configured.</p>
                <p className="text-xs text-slate-400 mt-1">Rules added here will be applied to tenant rent invoices.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {defaultRules.map(rule => (
                  <div key={rule.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{rule.description}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                          rule.isGlobal 
                          ? "bg-blue-50 text-blue-600 border-blue-100" 
                          : "bg-indigo-50 text-indigo-600 border-indigo-100"
                        }`}>
                          {rule.isGlobal ? "Global Charge" : `Room ${rule.room?.roomNumber}`}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <span className="text-lg font-bold text-slate-900">+${rule.amount.toLocaleString()}</span>
                      <button 
                        onClick={() => handleDelete(rule.id)}
                        disabled={loading}
                        className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Rule"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add New Rule Form */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden sticky top-28 border-l-4 border-l-blue-600">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Plus size={20} className="text-blue-600" />
              Add New Rule
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Description</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-300"
                placeholder="e.g. Utility Charge, Tax"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-300"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
              />
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Apply Scope</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl">
                 <button 
                  type="button"
                  onClick={() => setFormData({...formData, isGlobal: true})}
                  className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                    formData.isGlobal ? 'bg-white shadow-sm text-blue-600 border border-slate-100' : 'text-slate-500'
                  }`}
                 >
                   Global
                 </button>
                 <button 
                  type="button"
                  onClick={() => setFormData({...formData, isGlobal: false})}
                  className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                    !formData.isGlobal ? 'bg-white shadow-sm text-blue-600 border border-slate-100' : 'text-slate-500'
                  }`}
                 >
                   Specific Room
                 </button>
              </div>
            </div>

            {!formData.isGlobal && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Room Selection</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                  value={formData.roomId}
                  onChange={(e) => setFormData({...formData, roomId: e.target.value})}
                >
                  <option value="">Select Room...</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>Room {r.roomNumber}</option>
                  ))}
                </select>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-4 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:translate-y-px transition-all mt-4 disabled:bg-slate-200 disabled:shadow-none"
            >
              {loading ? "Processing..." : "Create Billing Rule"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
