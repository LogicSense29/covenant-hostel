"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Edit, Folder, Info, Camera, Loader2, Upload, X, Home } from "lucide-react";
import { toast } from "react-hot-toast";

export default function BlockManager({ initialBlocks }) {
  const router = useRouter();
  const [blocks, setBlocks] = useState(initialBlocks || []);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [formData, setFormData] = useState({ name: "", address: "", description: "", imageUrl: "", features: [] });
  const [uploading, setUploading] = useState(false);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [customFeature, setCustomFeature] = useState("");

  // Available features (same as rooms)
  const availableFeatures = [
    "WiFi", "Air Conditioning", "Heating", "Desk & Chair", "Wardrobe",
    "Private Bathroom", "Shared Bathroom", "Kitchen Access", "Laundry",
    "Security", "24/7 Security", "CCTV", "Generator/Backup Power", "Water Supply",
    "Parking Space", "Study Area", "Common Room", "Balcony", "Window View",
    "Ceiling Fan", "Reading Lamp", "Mattress Included", "Bedding Included",
    "Bin Disposal", "Close Proximity to University", "Block Cleaning Services"
  ];

  const handleEdit = (block) => {
    setEditingBlock(block);
    setFormData({ 
      name: block.name, 
      address: block.address || "",
      description: block.description || "",
      imageUrl: block.imageUrl || "",
      features: block.features || []
    });
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingBlock(null);
    setFormData({ name: "", address: "", description: "", imageUrl: "", features: [] });
  };

  const toggleFeature = (feature) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const addCustomFeature = () => {
    const trimmed = customFeature.trim();
    if (trimmed && !formData.features.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, trimmed]
      }));
      setCustomFeature("");
    }
  };

  const removeFeature = (feature) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
    }));
  };

  /* Commented out image upload for blocks as requested
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      if (res.ok) {
        const result = await res.json();
        setFormData(prev => ({ ...prev, imageUrl: result.fileUrl }));
        toast.success("Image uploaded!");
      } else {
        toast.error("Failed to upload image");
      }
    } catch (err) {
      toast.error("Upload error");
    } finally {
      setUploading(false);
    }
  };
  */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingBlock ? `/api/blocks/${editingBlock.id}` : "/api/blocks";
      const method = editingBlock ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success(editingBlock ? "Block updated!" : "Block created!");
        handleCancel();
        router.refresh();
        // Refresh local state by refetching or relying on router.refresh()
        const updatedRes = await fetch("/api/blocks");
        if (updatedRes.ok) {
          const updatedBlocks = await updatedRes.json();
          setBlocks(updatedBlocks);
        }
      } else {
        const error = await res.text();
        toast.error(error || "Failed to save block");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <p className="font-medium text-gray-900">Delete this block?</p>
        <p className="text-sm text-gray-600">This will not work if there are rooms assigned to it.</p>
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
      const res = await fetch(`/api/blocks/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Block deleted!");
        setBlocks(blocks.filter(b => b.id !== id));
        router.refresh();
      } else {
        const error = await res.text();
        toast.error(error || "Failed to delete block");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Room Blocks</h1>
          <p className="text-slate-500 mt-1 text-sm">Organize your rooms into manageable groups like "Block A", "Female Wing", etc.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <Plus size={20} />
          Create New Block
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Block List */}
        <div className="lg:col-span-2 space-y-4">
          {blocks.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
              <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Folder size={32} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No blocks yet</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">Create your first block to start organizing your rooms by floor, wing, or category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {blocks.map(block => (
                <div key={block.id} className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-xl hover:border-blue-200 transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center transition-all group-hover:bg-blue-600 ${block.imageUrl ? '' : 'bg-blue-50 text-blue-600'}`}>
                        {block.imageUrl ? (
                          <img src={block.imageUrl} className="w-full h-full object-cover" alt={block.name} />
                        ) : (
                          <Folder size={24} className="group-hover:text-white" />
                        )}
                      </div>
                      {block.imageUrl && (
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                          <Plus size={14} />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleEdit(block)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(block.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">{block.name}</h3>
                  {block.address && (
                    <p className="text-sm text-slate-600 font-medium mt-1">{block.address}</p>
                  )}
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                    {block._count?.rooms || 0} Rooms Assigned
                  </p>
                  {block.description && (
                    <p className="text-sm text-slate-500 mt-3 line-clamp-2 italic">"{block.description}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Panel (Add/Edit) */}
        <div className="lg:col-span-1">
          {isAdding ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sticky top-28 border-t-4 border-t-blue-600 animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                {editingBlock ? <Edit size={20} className="text-blue-600" /> : <Plus size={20} className="text-blue-600" />}
                {editingBlock ? "Edit Block" : "New Block"}
              </h3>
              
              {/* Commented out image upload for blocks as requested
              <div className="mb-6 bg-slate-50 rounded-2xl p-4 border-2 border-dashed border-slate-200 text-center relative overflow-hidden group">
                {formData.imageUrl ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden">
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer bg-white text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        <Camera size={14} />
                        Change
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer py-4 flex flex-col items-center">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-300 mb-2 group-hover:text-blue-500 transition-colors">
                      {uploading ? <Loader2 size={20} className="animate-spin text-blue-500" /> : <Camera size={20} />}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add Category Image</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
              */}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Block Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Block A, Female Wing..."
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Address</label>
                  <input 
                    type="text"
                    required
                    placeholder="Physical location of this block..."
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Description (Optional)</label>
                  <textarea 
                    placeholder="Brief details about this block..."
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-600 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all min-h-[100px] resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                {/* Block Features */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Block Features</label>
                    <button
                      type="button"
                      onClick={() => setShowFeaturesModal(true)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus size={12} />
                      Manage
                    </button>
                  </div>
                  {formData.features.length > 0 ? (
                    <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      {formData.features.map((feature) => (
                        <span
                          key={feature}
                          className="px-2 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1"
                        >
                          {feature}
                          <button
                            type="button"
                            onClick={() => removeFeature(feature)}
                            className="text-slate-400 hover:text-red-600"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-slate-200">No features set. Click Manage to add.</p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-[2] bg-blue-600 text-white py-3.5 rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                  >
                    {loading ? "Saving..." : editingBlock ? "Update Block" : "Create Block"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
              <Info size={32} className="mb-4 text-indigo-200" />
              <h3 className="text-xl font-bold mb-3">About Blocks</h3>
              <p className="text-indigo-100 text-sm leading-relaxed mb-6 opacity-90">
                Blocks allow you to organize your facility. For example, you can group rooms by:
              </p>
              <ul className="space-y-3 text-sm font-medium">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full"></div>
                  Building Floors (Floor 1, Floor 2)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full"></div>
                  Gender Wings (Male, Female)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full"></div>
                  Category (VIP, Budget, Shared)
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Features Modal */}
      {showFeaturesModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Manage Block Features</h2>
                <p className="text-sm text-slate-500 mt-1">Features will apply to all rooms in this block</p>
              </div>
              <button 
                onClick={() => setShowFeaturesModal(false)} 
                className="p-2 hover:bg-white rounded-xl text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {/* Common Features */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Common Features</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableFeatures.map((feature) => (
                    <label
                      key={feature}
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all group"
                    >
                      <input
                        type="checkbox"
                        checked={formData.features.includes(feature)}
                        onChange={() => toggleFeature(feature)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500/20"
                      />
                      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                        {feature}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Add Custom Feature */}
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Add Custom Feature</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customFeature}
                    onChange={(e) => setCustomFeature(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomFeature();
                      }
                    }}
                    placeholder="e.g., Smart TV, Mini Fridge..."
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={addCustomFeature}
                    disabled={!customFeature.trim()}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">Type a custom feature and press Enter or click Add</p>
              </div>

              {/* Selected Features Preview */}
              {formData.features.length > 0 && (
                <div className="border-t border-slate-200 pt-6 mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                      Selected Features ({formData.features.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, features: [] }))}
                      className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-2"
                      >
                        {feature}
                        <button
                          type="button"
                          onClick={() => removeFeature(feature)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setShowFeaturesModal(false)}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
