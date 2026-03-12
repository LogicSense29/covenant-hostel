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
    capacity: initialData?.capacity || 4,
    rentExpiryDate: initialData?.rentExpiryDate ? new Date(initialData.rentExpiryDate).toISOString().split('T')[0] : "",
    blockId: initialData?.blockId || "",
    imageUrl: initialData?.imageUrl || "",
  });
  
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetchingBlocks, setFetchingBlocks] = useState(false);
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

  useEffect(() => {
    const fetchBlocks = async () => {
      setFetchingBlocks(true);
      try {
        const res = await fetch("/api/blocks");
        if (res.ok) {
          const data = await res.json();
          setBlocks(data);
        }
      } catch (err) {
        console.error("Error fetching blocks:", err);
      } finally {
        setFetchingBlocks(false);
      }
    };
    fetchBlocks();
  }, []);

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

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{isEditing ? "Edit Room" : "Add New Room"}</h2>

      <div className="mb-8 p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center relative overflow-hidden group">
        {formData.imageUrl ? (
          <div className="relative aspect-video rounded-2xl overflow-hidden mb-4">
             <img 
               src={formData.imageUrl} 
               alt="Room Preview" 
               className="w-full h-full object-cover"
             />
             <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                  <Camera size={18} />
                  Change Picture
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
             </div>
          </div>
        ) : (
          <label className="cursor-pointer flex flex-col items-center justify-center py-10 transition-all hover:bg-white rounded-2xl">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-300 mb-4 group-hover:text-blue-500 group-hover:scale-110 transition-all">
              {uploading ? <Loader2 size={32} className="animate-spin text-blue-500" /> : <Camera size={32} />}
            </div>
            <p className="text-sm font-bold text-slate-700">Add Room Picture (Optional)</p>
            <p className="text-xs text-slate-400 mt-1">PNG, JPG or WebP up to 5MB</p>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
          </label>
        )}
        
        {uploading && !formData.imageUrl && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
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
              disabled={fetchingBlocks}
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
            <label htmlFor="rentAmount" className={styles.label}>Rent Amount (₦)</label>
            <input
              id="rentAmount"
              name="rentAmount"
              type="number"
              step="0.01"
              min="0"
              required
              className={styles.input}
              placeholder="e.g. 1500.00"
              value={formData.rentAmount}
              onChange={handleChange}
            />
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
              placeholder="e.g. 4"
              value={formData.capacity || 4}
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
