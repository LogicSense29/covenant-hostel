"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Info, CheckCircle2, Edit3, X } from "lucide-react";
import { toast } from "react-hot-toast";

export default function BillingRulesManager({ defaultRules, rooms, blocks = [] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    type: "Additional Charge",
    frequency: "ONCE",
    applyScope: "GLOBAL",
    roomId: "",
    blockId: ""
  });

  const handleEdit = (rule) => {
    setIsEditing(true);
    setEditingId(rule.id);
    setFormData({
      title: rule.title || "",
      description: rule.description,
      amount: rule.amount.toString(),
      type: rule.type || "Additional Charge",
      frequency: rule.frequency || "ONCE",
      applyScope: rule.isGlobal ? "GLOBAL" : rule.blockId ? "BLOCK" : "ROOM",
      roomId: rule.roomId || "",
      blockId: rule.blockId || ""
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      title: "",
      description: "",
      amount: "",
      type: "Additional Charge",
      frequency: "ONCE",
      applyScope: "GLOBAL",
      roomId: "",
      blockId: ""
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        isGlobal: formData.applyScope === "GLOBAL",
        roomId: formData.applyScope === "ROOM" ? formData.roomId : null,
        blockId: formData.applyScope === "BLOCK" ? formData.blockId : null
      };

      if (payload.isGlobal) {
        payload.roomId = null;
        payload.blockId = null;
      }

      const url = isEditing ? `/api/billing/${editingId}` : "/api/billing";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        cancelEdit();
        toast.success(isEditing ? "Billing rule updated!" : "Billing rule created!");
        router.refresh();
      } else {
        const errorText = await res.text();
        toast.error(errorText || "Failed to save rule");
      }
    } catch (err) {
      toast.error("An error occurred while saving rule");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <p className="font-medium text-gray-900">Delete this billing rule?</p>
        <p className="text-sm text-gray-600">This action cannot be undone.</p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              confirmDelete(id);
            }}
            className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium transition-colors"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
      position: 'top-center',
    });
  };

  const confirmDelete = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/billing/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        if (editingId === id) cancelEdit();
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
                      <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {rule.title || rule.description}
                        <span className="text-blue-600 text-xs font-bold ml-2 uppercase tracking-tight">[{String(rule.type || "Additional Charge").replace(/_/g, ' ')}]</span>
                        <span className="text-blue-500 text-[10px] font-bold uppercase ml-3 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">
                          {rule.frequency?.replace(/_/g, ' ') || "ONCE"}
                        </span>
                      </span>
                      {rule.title && rule.description && (
                        <span className="text-xs text-slate-500 ml-0">{rule.description}</span>
                      )}
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                          rule.isGlobal 
                          ? "bg-blue-50 text-blue-600 border-blue-100" 
                          : rule.blockId 
                            ? "bg-purple-50 text-purple-600 border-purple-100"
                            : "bg-indigo-50 text-indigo-600 border-indigo-100"
                        }`}>
                          {rule.isGlobal ? "Global Charge" : rule.blockId ? `Block: ${rule.block?.name || "Unknown"}` : `Room ${rule.room?.roomNumber}`}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-slate-900">₦{rule.amount.toLocaleString()}</span>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleEdit(rule)}
                          disabled={loading}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="Edit Rule"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(rule.id)}
                          disabled={loading}
                          className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete Rule"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
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
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              {isEditing ? <Edit3 size={20} className="text-blue-600" /> : <Plus size={20} className="text-blue-600" />}
              {isEditing ? "Edit Billing Rule" : "Add New Rule"}
            </h2>
            {isEditing && (
              <button 
                onClick={cancelEdit}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                title="Cancel Edit"
              >
                <X size={18} />
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Bill Title *</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-300"
                placeholder="e.g. Electricity Bill, Water Bill"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Bill Type *</label>
              <div className="relative group/type">
                <input
                  list="rule-types"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-300"
                  placeholder="Select or type type..."
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                />
                <datalist id="rule-types">
                  <option value="Additional Charge" />
                  <option value="Base Rent" />
                  <option value="Security Deposit" />
                  <option value="Utility Fee" />
                  <option value="Maintenance Fee" />
                  <option value="Tax" />
                </datalist>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-500 opacity-0 group-focus-within/type:opacity-100 transition-opacity">
                  Type custom...
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Billing Frequency</label>
              <select
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                value={formData.frequency}
                onChange={(e) => setFormData({...formData, frequency: e.target.value})}
              >
                <option value="ONCE">Once (One-time)</option>
                <option value="DAILY">Daily</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
                <option value="PER_SEMESTER">Per Semester</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Description (Optional)</label>
              <textarea
                rows="2"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-300 resize-none"
                placeholder="Additional details about this charge..."
                value={formData.description}
                onChange={(e) => {
                  setFormData({...formData, description: e.target.value});
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Amount (₦)</label>
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
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-xl">
                 <button 
                  type="button"
                  onClick={() => setFormData({...formData, applyScope: "GLOBAL"})}
                  className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                    formData.applyScope === "GLOBAL" ? 'bg-white shadow-sm text-blue-600 border border-slate-100' : 'text-slate-500'
                  }`}
                 >
                   Global
                 </button>
                 <button 
                  type="button"
                  onClick={() => setFormData({...formData, applyScope: "BLOCK"})}
                  className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                    formData.applyScope === "BLOCK" ? 'bg-white shadow-sm text-blue-600 border border-slate-100' : 'text-slate-500'
                  }`}
                 >
                   Block
                 </button>
                 <button 
                  type="button"
                  onClick={() => setFormData({...formData, applyScope: "ROOM"})}
                  className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                    formData.applyScope === "ROOM" ? 'bg-white shadow-sm text-blue-600 border border-slate-100' : 'text-slate-500'
                  }`}
                 >
                   Specific Room
                 </button>
              </div>
            </div>

            {formData.applyScope === "BLOCK" && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Block Selection</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                  value={formData.blockId}
                  onChange={(e) => setFormData({...formData, blockId: e.target.value})}
                >
                  <option value="">Select Block...</option>
                  {blocks.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            {formData.applyScope === "ROOM" && (
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
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber}{r.block ? ` — ${r.block.name}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button 
                type="submit" 
                disabled={loading} 
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:translate-y-px transition-all disabled:bg-slate-200 disabled:shadow-none"
              >
                {loading ? "Processing..." : isEditing ? "Update Billing Rule" : "Create Billing Rule"}
              </button>
              {isEditing && (
                <button 
                  type="button"
                  onClick={cancelEdit}
                  disabled={loading}
                  className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
