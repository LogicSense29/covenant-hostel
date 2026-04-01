"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { 
  Plus, 
  Search, 
  Home, 
  User, 
  MoreVertical, 
  Trash2, 
  Edit,
  ExternalLink,
  Calendar,
  Camera,
  Upload,
  Loader2
} from "lucide-react";
import styles from "./RoomForm.module.css";

export default function RoomForm({ initialData }) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    roomNumber: initialData?.roomNumber || "",
    rentAmount: initialData?.rentAmount || "",
    status: initialData?.status || "AVAILABLE",
    capacity: initialData?.capacity || 1,
    rentExpiryDate: initialData?.rentExpiryDate ? new Date(initialData.rentExpiryDate).toISOString().split('T')[0] : "",
    blockId: initialData?.blockId || "",
    imageUrl: initialData?.imageUrl || "",
    photos: initialData?.photos || (initialData?.imageUrl ? [initialData.imageUrl] : []),
    billingRuleIds: initialData?.billingRules?.map(r => r.id) || [],
  });
  
  const [billingSearch, setBillingSearch] = useState("");
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [billingRules, setBillingRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState("");

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
        setFormData(prev => ({ 
           ...prev, 
           photos: [...prev.photos, result.fileUrl],
           // For backward compatibility until full transition
           imageUrl: prev.photos.length === 0 ? result.fileUrl : prev.imageUrl
        }));
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

  const removePhoto = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, index) => index !== indexToRemove),
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      setFetchingData(true);
      try {
        const [blocksRes, billingRes] = await Promise.all([
          fetch("/api/blocks"),
          fetch("/api/billing")
        ]);

        if (blocksRes.ok) {
          const data = await blocksRes.json();
          setBlocks(data);
        }
        
        if (billingRes.ok) {
          const data = await billingRes.json();
          setBillingRules(data);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setFetchingData(false);
      }
    };
    fetchData();
  }, []);


  // Update rent amount and auto-tick BASE_RENT rules
  useEffect(() => {
    if (fetchingData || billingRules.length === 0) return;
    
    // Find applicable base rent
    let suggestedAmount = null;
    let matchingRuleId = null;
    
    // 1. Try to find a rule specifically for this block
    if (formData.blockId) {
      const blockRule = billingRules.find(r => (r.type === "BASE_RENT" || r.type === "Base Rent") && r.blockId === formData.blockId);
      if (blockRule) {
        suggestedAmount = blockRule.amount;
        matchingRuleId = blockRule.id;
      }
    }
    
    // 2. Fallback to global rule if no block-specific rule found or no block selected
    if (suggestedAmount === null) {
      const globalRule = billingRules.find(r => (r.type === "BASE_RENT" || r.type === "Base Rent") && r.isGlobal);
      if (globalRule) {
        suggestedAmount = globalRule.amount;
        matchingRuleId = globalRule.id;
      }
    }

    // Aggressively update rentAmount if the current amount is NOT valid for the new block selection
    // OR if we are adding a new room.
    const validRules = billingRules.filter(r => (r.type === "BASE_RENT" || r.type === "Base Rent") && (r.isGlobal || r.blockId === formData.blockId));
    const isCurrentAmountValid = validRules.some(r => Number(r.amount) === Number(formData.rentAmount));

    if (suggestedAmount !== null && (!isCurrentAmountValid || !formData.rentAmount || !isEditing)) {
      setFormData(prev => ({ 
        ...prev, 
        rentAmount: suggestedAmount,
        // Auto-tick the rule if it's the one we're applying
        billingRuleIds: matchingRuleId && !prev.billingRuleIds.includes(matchingRuleId) 
          ? [...prev.billingRuleIds, matchingRuleId] 
          : prev.billingRuleIds
      }));
    } else if (formData.rentAmount && suggestedAmount !== null && Number(formData.rentAmount) === Number(suggestedAmount)) {
      // If rentAmount already matches suggested, ensure it's ticked
      if (matchingRuleId && !formData.billingRuleIds.includes(matchingRuleId)) {
        setFormData(prev => ({
          ...prev,
          billingRuleIds: [...prev.billingRuleIds, matchingRuleId]
        }));
      }
    }
  }, [formData.blockId, formData.rentAmount, billingRules, fetchingData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = isEditing ? `/api/rooms/${initialData.id}` : "/api/rooms";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push("/landlord/rooms");
        router.refresh();
      } else {
        const text = await res.text();
        setError(text || "Failed to save room.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedRent = () => {
    if (formData.blockId) {
      const blockRule = billingRules.find(r => r.type === "BASE_RENT" && r.blockId === formData.blockId);
      if (blockRule) return blockRule.amount;
    }
    const globalRule = billingRules.find(r => r.type === "BASE_RENT" && r.isGlobal);
    return globalRule ? globalRule.amount : null;
  };

  const suggestedRent = getSuggestedRent();

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{isEditing ? "Edit Room" : "Add New Room"}</h2>

      <div className="mb-8 p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center relative overflow-hidden group">
        
        {formData.photos.length > 0 ? (
          <div className="space-y-4">
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
               {formData.photos.map((url, index) => (
                 <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group/photo border border-slate-200 shadow-sm">
                   <img src={url} alt={`Room Preview ${index + 1}`} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        type="button" 
                        onClick={() => removePhoto(index)}
                        className="bg-white text-red-600 p-2.5 rounded-xl hover:bg-red-50 hover:scale-110 transition-all shadow-sm"
                        title="Remove photo"
                      >
                        <Trash2 size={18} />
                      </button>
                   </div>
                 </div>
               ))}
               
               {/* Add more button */}
               <label className="cursor-pointer flex flex-col items-center justify-center aspect-square transition-all hover:bg-white bg-slate-100/50 rounded-2xl border-2 border-dashed border-slate-300">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 mb-2 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                    {uploading ? <Loader2 size={24} className="animate-spin text-blue-500" /> : <Plus size={24} />}
                  </div>
                  <p className="text-[11px] font-bold text-slate-600">Add More</p>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
               </label>
             </div>
          </div>
        ) : (
          <label className="cursor-pointer flex flex-col items-center justify-center py-10 transition-all hover:bg-white rounded-2xl">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-300 mb-4 group-hover:text-blue-500 group-hover:scale-110 transition-all">
              {uploading ? <Loader2 size={32} className="animate-spin text-blue-500" /> : <Camera size={32} />}
            </div>
            <p className="text-sm font-bold text-slate-700">Add Room Pictures (Optional)</p>
            <p className="text-xs text-slate-400 mt-1">PNG, JPG or WebP up to 5MB</p>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
          </label>
        )}
        
        {uploading && formData.photos.length === 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
             <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-xl">
                <Loader2 size={20} className="animate-spin text-blue-600" />
                <span className="text-sm font-bold text-slate-700">Uploading...</span>
             </div>
          </div>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={styles.formGroup}>
            <label htmlFor="roomNumber" className={styles.label}>Room Number / Name</label>
            <input
              id="roomNumber"
              name="roomNumber"
              type="text"
              required
              className={styles.input}
              placeholder="e.g. 101, 102A"
              value={formData.roomNumber}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="blockId" className={styles.label}>Category / Block</label>
            <select
              id="blockId"
              name="blockId"
              className={styles.input}
              value={formData.blockId}
              onChange={handleChange}
              disabled={fetchingData}
            >
              <option value="">No Block (Standalone)</option>
              {blocks.map(block => (
                <option key={block.id} value={block.id}>{block.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={styles.formGroup}>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="rentAmount" className={styles.label + " !mb-0"}>Rent Amount (₦)</label>
              {suggestedRent && (
                <span className="text-[10px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-100">
                  Billing Suggestion: ₦{suggestedRent.toLocaleString()}
                </span>
              )}
            </div>
            {billingRules.filter(r => (r.type === "BASE_RENT" || r.type === "Base Rent") && (r.isGlobal || r.blockId === formData.blockId)).length > 0 ? (
              <select
                id="rentAmount"
                name="rentAmount"
                required
                className={styles.input}
                value={formData.rentAmount}
                onChange={(e) => setFormData({ ...formData, rentAmount: parseFloat(e.target.value) })}
              >
                <option value="">Select Rent Rate...</option>
                {billingRules
                  .filter(r => (r.type === "BASE_RENT" || r.type === "Base Rent") && (r.isGlobal || r.blockId === formData.blockId))
                  .map(rule => (
                    <option key={rule.id} value={rule.amount}>
                      ₦{rule.amount.toLocaleString()} ({rule.description})
                    </option>
                  ))}
              </select>
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  id="rentAmount"
                  name="rentAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className={styles.input + " bg-slate-100 cursor-not-allowed"}
                  placeholder="Set base rent in Billing first"
                  value={formData.rentAmount}
                  readOnly
                />
                <p className="text-[10px] text-red-500 font-bold px-1 italic">
                  No Base Rent rules found for this selection. Please add one in Billing & Rules.
                </p>
              </div>
            )}
          </div>


          <div className={styles.formGroup}>
            <label htmlFor="capacity" className={styles.label}>Capacity (Max Tenants)</label>
            <input
              id="capacity"
              name="capacity"
              type="number"
              min="1"
              required
              className={styles.input}
              placeholder="e.g. 1, 2, 4"
              value={formData.capacity || ""}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={styles.formGroup}>
            <label htmlFor="status" className={styles.label}>Room Status</label>
            <select
              id="status"
              name="status"
              className={styles.input}
              value={formData.status}
              onChange={handleChange}
              disabled={isEditing && initialData.status === "OCCUPIED" && formData.status !== "OCCUPIED"} // Logic prevention
            >
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED" disabled={!isEditing || initialData.status !== "OCCUPIED"}>Occupied (Assigned by system)</option>
              <option value="EXPIRED_RENT">Expired Rent</option>
              <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="rentExpiryDate" className={styles.label}>Rent Expiry Date (Optional)</label>
            <input
              id="rentExpiryDate"
              name="rentExpiryDate"
              type="date"
              className={styles.input}
              value={formData.rentExpiryDate}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Billing Rules Attachment Section */}
        <div className="mt-8 border-t border-slate-100 pt-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Plus size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recommended Billings</h3>
                <p className="text-[10px] text-slate-400 font-medium italic">Applicable to this block or global</p>
              </div>
            </div>

            <div className="relative w-full md:w-80" onMouseLeave={() => setShowSearchBox(false)}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search & Add Other Billing..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-300 transition-all placeholder:text-slate-400"
                  value={billingSearch}
                  onChange={(e) => {
                    setBillingSearch(e.target.value);
                    setShowSearchBox(true);
                  }}
                  onFocus={() => setShowSearchBox(true)}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Search size={14} />
                </div>
              </div>
              
              {showSearchBox && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-64 overflow-y-auto animate-in zoom-in-95 duration-200">
                  {billingRules
                    .filter(r => {
                      const type = String(r.type || "").toUpperCase();
                      const isNotBaseRent = type !== "BASE_RENT";
                      const isNotSelected = !formData.billingRuleIds.includes(r.id);
                      const matchesSearch = r.description.toLowerCase().includes(billingSearch.toLowerCase());
                      return isNotBaseRent && isNotSelected && matchesSearch;
                    })
                    .length === 0 ? (
                      <div className="p-4 text-center text-[10px] text-slate-400 italic">
                        No matching rules found.
                      </div>
                    ) : (
                      billingRules
                        .filter(r => {
                          const type = String(r.type || "").toUpperCase();
                          return type !== "BASE_RENT" && !formData.billingRuleIds.includes(r.id) && 
                                 r.description.toLowerCase().includes(billingSearch.toLowerCase());
                        })
                        .map(rule => (
                          <button
                            key={rule.id}
                            type="button"
                            className="w-full p-3 text-left hover:bg-slate-50 flex flex-col gap-0.5 transition-colors border-b border-slate-50 last:border-0"
                            onClick={() => {
                              setFormData(prev => ({ 
                                ...prev, 
                                billingRuleIds: [...prev.billingRuleIds, rule.id] 
                              }));
                              setBillingSearch("");
                              setShowSearchBox(false);
                              toast.success(`Added: ${rule.description}`);
                            }}
                          >
                            <span className="text-xs font-bold text-slate-900">{rule.description}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-blue-600">₦{rule.amount.toLocaleString()}</span>
                              <span className="text-[8px] font-medium text-slate-400 uppercase bg-slate-100 px-1 py-0.5 rounded">
                                {String(rule.type || "").replace(/_/g, ' ')}
                              </span>
                            </div>
                          </button>
                        ))
                    )
                  }
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-1 bg-slate-50/50 rounded-3xl border border-slate-100/50 p-4">
            {/* Show Selected Rules First (even if not 'recommended' for this block) */}
            {billingRules
              .filter(r => formData.billingRuleIds.includes(r.id))
              .map(rule => (
                <label 
                  key={rule.id} 
                  className="flex items-center gap-3 p-3 rounded-2xl border-2 border-blue-500 bg-blue-50/30 transition-all cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 transition-all cursor-pointer"
                    checked={true}
                    onChange={() => {
                      setFormData(prev => ({ 
                        ...prev, 
                        billingRuleIds: prev.billingRuleIds.filter(id => id !== rule.id) 
                      }));
                    }}
                  />
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="text-[11px] font-bold text-slate-900 truncate">{rule.description}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-blue-600">₦{rule.amount.toLocaleString()}</span>
                      <span className="text-[8px] font-medium text-slate-400 uppercase tracking-tighter bg-slate-100 px-1 py-0.5 rounded">
                        {String(rule.type || "").replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </label>
              ))
            }

            {/* Then show Recommended but NOT yet selected */}
            {billingRules
              .filter(r => {
                const type = String(r.type || "").toUpperCase();
                return type !== "BASE_RENT" && 
                       !formData.billingRuleIds.includes(r.id) && 
                       (r.isGlobal || r.blockId === formData.blockId || r.roomId === initialData?.id);
              })
              .map(rule => (
                <label 
                  key={rule.id} 
                  className="flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed border-slate-200 bg-white hover:border-blue-200 transition-all cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-slate-300 border-slate-300 focus:ring-blue-500 transition-all cursor-pointer"
                    checked={false}
                    onChange={() => {
                      setFormData(prev => ({ 
                        ...prev, 
                        billingRuleIds: [...prev.billingRuleIds, rule.id] 
                      }));
                    }}
                  />
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="text-[11px] font-bold text-slate-500 group-hover:text-blue-600 truncate">{rule.description}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-500">₦{rule.amount.toLocaleString()}</span>
                    </div>
                  </div>
                </label>
              ))
            }

            {formData.billingRuleIds.length === 0 && 
             billingRules.filter(r => r.type !== "BASE_RENT" && (r.isGlobal || r.blockId === formData.blockId || r.roomId === initialData?.id)).length === 0 && (
              <div className="col-span-full py-10 text-center">
                <p className="text-xs text-slate-400 font-medium italic">No rules selected yet.</p>
                <p className="text-[10px] text-slate-300 mt-1">Use the dropdown above to browse all rules.</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <Link href="/landlord/rooms" className={styles.cancelBtn}>
            Cancel
          </Link>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Saving..." : "Save Room"}
          </button>
        </div>
      </form>
    </div>
  );
}
