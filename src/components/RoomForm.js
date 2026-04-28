"use client";

import { useState, useEffect, useRef } from "react";
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
  Loader2,
  X
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
    features: initialData?.features || [],
  });
  
  const [billingSearch, setBillingSearch] = useState("");
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  
  const [blocks, setBlocks] = useState([]);
  const [billingRules, setBillingRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState("");
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [customFeature, setCustomFeature] = useState("");

  const billingSearchRef = useRef(null);

  // Available room features
  const availableFeatures = [
    "WiFi", "Air Conditioning", "Heating", "Desk & Chair", "Wardrobe",
    "Private Bathroom", "Shared Bathroom", "Kitchen Access", "Laundry",
    "Security", "24/7 Security", "CCTV", "Generator/Backup Power", "Water Supply",
    "Parking Space", "Study Area", "Common Room", "Balcony", "Window View",
    "Ceiling Fan", "Reading Lamp", "Mattress Included", "Bedding Included",
    "Bin Disposal", "Close Proximity to University", "Room Cleaning Services"
  ];

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

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error("Invalid file type. Please upload an image (JPG, PNG, WebP) or a video (MP4, MOV, WebM).");
      e.target.value = "";
      return;
    }

    if (isImage && file.size > 5 * 1024 * 1024) {
      toast.error("Image is too large. Maximum size is 5MB.");
      e.target.value = "";
      return;
    }

    if (isVideo && file.size > 10 * 1024 * 1024) {
      toast.error("Video is too large. Maximum size is 10MB.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("folder", "rooms");

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
           imageUrl: prev.photos.length === 0 ? result.fileUrl : prev.imageUrl
        }));
        toast.success(isVideo ? "Video uploaded!" : "Image uploaded!");
      } else {
        toast.error(`Failed to upload ${isVideo ? "video" : "image"}.`);
      }
    } catch (err) {
      toast.error("Upload error. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removePhoto = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, index) => index !== indexToRemove),
    }));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (billingSearchRef.current && !billingSearchRef.current.contains(event.target)) {
        setShowSearchBox(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Auto-tick global and block-specific billing rules (but allow unticking)
  useEffect(() => {
    if (fetchingData || billingRules.length === 0) return;

    // Find rules that should be auto-ticked: global (non-BASE_RENT) + block-specific
    const autoTickRules = billingRules.filter(r => {
      const type = String(r.type || "").toUpperCase();
      if (type === "BASE_RENT") return false; // BASE_RENT handled separately
      return r.isGlobal || r.blockId === formData.blockId;
    });

    const autoTickIds = autoTickRules.map(r => r.id);
    const missingIds = autoTickIds.filter(id => !formData.billingRuleIds.includes(id));

    if (missingIds.length > 0) {
      setFormData(prev => ({
        ...prev,
        billingRuleIds: [...prev.billingRuleIds, ...missingIds]
      }));
    }
  }, [billingRules, formData.blockId, fetchingData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If changing block, merge block features with existing room features
    if (name === 'blockId' && value) {
      const selectedBlock = blocks.find(b => b.id === value);
      if (selectedBlock && selectedBlock.features) {
        // Merge block features with existing room features (avoid duplicates)
        const mergedFeatures = [...new Set([...formData.features, ...selectedBlock.features])];
        setFormData({ ...formData, [name]: value, features: mergedFeatures });
        return;
      }
    }
    
    setFormData({ ...formData, [name]: value });
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
               {formData.photos.map((url, index) => {
                 const isVideo = url.match(/\.(mp4|mov|webm|ogg|avi)$/i) || url.includes('/video/');
                 return (
                 <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group/photo border border-slate-200 shadow-sm">
                   {isVideo ? (
                     <video src={url} className="w-full h-full object-cover" muted playsInline />
                   ) : (
                     <img src={url} alt={`Room Preview ${index + 1}`} className="w-full h-full object-cover" />
                   )}
                   <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        type="button" 
                        onClick={() => removePhoto(index)}
                        className="bg-white text-red-600 p-2.5 rounded-xl hover:bg-red-50 hover:scale-110 transition-all shadow-sm"
                        title="Remove"
                      >
                        <Trash2 size={18} />
                      </button>
                   </div>
                 </div>
                 );
               })}
               
               {/* Add more button */}
               <label className="cursor-pointer flex flex-col items-center justify-center aspect-square transition-all hover:bg-white bg-slate-100/50 rounded-2xl border-2 border-dashed border-slate-300">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 mb-2 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                    {uploading ? <Loader2 size={24} className="animate-spin text-blue-500" /> : <Plus size={24} />}
                  </div>
                  <p className="text-[11px] font-bold text-slate-600">Add More</p>
                  <input type="file" accept="image/*,video/mp4,video/mov,video/webm" className="hidden" onChange={handleMediaUpload} disabled={uploading} />
               </label>
             </div>
          </div>
        ) : (
          <label className="cursor-pointer flex flex-col items-center justify-center py-10 transition-all hover:bg-white rounded-2xl">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-300 mb-4 group-hover:text-blue-500 group-hover:scale-110 transition-all">
              {uploading ? <Loader2 size={32} className="animate-spin text-blue-500" /> : <Camera size={32} />}
            </div>
            <p className="text-sm font-bold text-slate-700">Add Room Photos or Videos (Optional)</p>
            <p className="text-xs text-slate-400 mt-1">Images up to 5MB • Videos (MP4, MOV, WebM) up to 10MB</p>
            <input type="file" accept="image/*,video/mp4,video/mov,video/webm" className="hidden" onChange={handleMediaUpload} disabled={uploading} />
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

        {/* Room Features Section */}
        <div className="mt-6 p-6 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Home size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Room Features</h3>
                <p className="text-xs text-slate-500">Amenities available in this room</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowFeaturesModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              <Plus size={16} />
              Manage Features
            </button>
          </div>
          
          {formData.features.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {formData.features.map((feature) => (
                <span
                  key={feature}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium flex items-center gap-2 group hover:border-red-200 transition-colors"
                >
                  {feature}
                  <button
                    type="button"
                    onClick={() => removeFeature(feature)}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No features selected. Click "Manage Features" to add.</p>
          )}
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

        {/* Billing Rules Section */}
        <div className="mt-8 border-t border-slate-100 pt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">Additional Billing Rules</label>
              <p className="text-xs text-slate-500">Select applicable charges for this room</p>
            </div>
            <button
              type="button"
              onClick={() => setIsBillingModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm"
            >
              <Plus size={16} />
              Manage Billings
            </button>
          </div>

          {/* Selected Billing Rules Display */}
          {(() => {
            const selectedRules = billingRules.filter(r => formData.billingRuleIds.includes(r.id));
            const visible = selectedRules.slice(0, 4);
            const remaining = selectedRules.length - 4;
            return (
              <div className="flex flex-wrap gap-2 items-center">
                {selectedRules.length === 0 ? (
                  <p className="text-sm text-slate-400 italic py-2">No billing rules selected</p>
                ) : (
                  <>
                    {visible.map(rule => (
                      <div
                        key={rule.id}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl text-sm"
                      >
                        <span className="font-semibold text-slate-900">{rule.description}</span>
                        <span className="text-xs font-bold text-blue-600">₦{rule.amount.toLocaleString()}</span>
                        {rule.isGlobal && (
                          <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase">Global</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            billingRuleIds: prev.billingRuleIds.filter(id => id !== rule.id)
                          }))}
                          className="ml-1 p-1 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <X size={14} className="text-slate-500" />
                        </button>
                      </div>
                    ))}
                    {remaining > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsBillingModalOpen(true)}
                        className="text-xs font-semibold text-blue-500 hover:text-blue-700 hover:underline transition-colors py-2 px-1"
                      >
                        +{remaining} more
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })()}
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

      {/* Billing Rules Modal */}
      {isBillingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Manage Billing Rules</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {formData.billingRuleIds.length} selected · {billingRules.filter(r => r.type !== "BASE_RENT").length} available
                </p>
              </div>
              <button onClick={() => setIsBillingModalOpen(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
              {billingRules
                .filter(r => {
                  const type = String(r.type || "").toUpperCase();
                  return type !== "BASE_RENT" &&
                    r.description.toLowerCase().includes(billingSearch.toLowerCase());
                })
                .map(rule => {
                  const isSelected = formData.billingRuleIds.includes(rule.id);
                  const isRecommended = rule.isGlobal || rule.blockId === formData.blockId || rule.roomId === initialData?.id;
                  return (
                    <label
                      key={rule.id}
                      className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${isSelected ? "border-blue-500 bg-blue-50/30" : "border-slate-200 hover:border-slate-300"}`}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 shrink-0"
                        checked={isSelected}
                        onChange={() => {
                          setFormData(prev => ({
                            ...prev,
                            billingRuleIds: isSelected
                              ? prev.billingRuleIds.filter(id => id !== rule.id)
                              : [...prev.billingRuleIds, rule.id]
                          }));
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-bold truncate ${isSelected ? "text-slate-900" : "text-slate-700"}`}>
                            {rule.description}
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
                          <span className="text-xs font-bold text-blue-600">₦{rule.amount.toLocaleString()}</span>
                          <span className="text-[10px] font-medium text-slate-400 border-l border-slate-200 pl-2">
                            {String(rule.type || "").replace(/_/g, ' ')}
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
                onClick={() => setIsBillingModalOpen(false)}
                className="w-full py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Features Modal */}
      {showFeaturesModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Manage Room Features</h2>
                <p className="text-sm text-slate-500 mt-1">Select from common features or add custom ones</p>
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
