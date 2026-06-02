"use client";

import { useState, useRef } from "react";
import { Send, Loader2, AlertCircle, ShieldAlert, ImageIcon, X } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ComplaintForm({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [issueDescription, setIssueDescription] = useState("");
  const [pendingImage, setPendingImage] = useState(null); // { file, previewUrl }
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef(null);

  const handleImageSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Only image files are supported."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB."); return; }
    if (pendingImage?.previewUrl) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage({ file, previewUrl: URL.createObjectURL(file) });
    e.target.value = "";
  };

  const removePendingImage = () => {
    if (pendingImage?.previewUrl) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create the ticket
      const res = await fetch("/api/maintenance/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueDescription, category: "COMPLAINT" }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to submit complaint.");
        return;
      }

      const newTicket = await res.json();

      // 2. If an image was attached, upload it and send as first message
      if (pendingImage) {
        setUploadingImage(true);
        try {
          const formData = new FormData();
          formData.append("file", pendingImage.file);
          formData.append("folder", "ticket-attachments");
          const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
          if (uploadRes.ok) {
            const { fileUrl } = await uploadRes.json();
            await fetch(`/api/maintenance/tickets/${newTicket.id}/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                senderId: newTicket.tenantId,
                senderRole: "TENANT",
                content: "📎 Image attached with complaint",
                imageUrl: fileUrl,
              }),
            });
          }
        } catch {
          // Image upload failure is non-fatal — complaint is already submitted
          toast.error("Complaint submitted but image failed to upload.");
        } finally {
          setUploadingImage(false);
          if (pendingImage?.previewUrl) URL.revokeObjectURL(pendingImage.previewUrl);
          setPendingImage(null);
        }
      }

      toast.success("Complaint submitted successfully!");
      setIssueDescription("");
      onSuccess?.(newTicket);
      onClose?.();
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-red-600 p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-2xl font-bold flex items-center gap-3">
            <ShieldAlert className="text-red-100" />
            File a Complaint
          </h3>
          <p className="text-red-100/80 mt-2 font-medium">
            Describe your issue clearly for immediate review.
          </p>
        </div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {/* Description */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Complaint Details
          </label>
          <textarea
            required
            rows={5}
            placeholder="Please provide details about the noise, dispute, or issue you're facing..."
            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium outline-none focus:ring-4 focus:ring-red-500/10 focus:bg-white focus:border-red-500 transition-all resize-none"
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
          />
        </div>

        {/* Image attachment */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Attach Evidence (Optional)
          </label>

          {pendingImage ? (
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <img
                src={pendingImage.previewUrl}
                alt="Preview"
                className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 truncate">{pendingImage.file.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {(pendingImage.file.size / 1024).toFixed(0)} KB · Will be sent with your complaint
                </p>
              </div>
              <button
                type="button"
                onClick={removePendingImage}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:border-slate-400 transition-all"
            >
              <ImageIcon size={18} />
              Add a photo or screenshot
            </button>
          )}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelected}
          />
        </div>

        {/* Warning */}
        <div className="bg-amber-50 p-4 rounded-2xl flex items-start gap-3 border border-amber-100">
          <AlertCircle className="text-amber-600 mt-0.5 shrink-0" size={18} />
          <p className="text-xs text-amber-700 leading-relaxed font-medium">
            Complaints are officially logged and visible to the hostel administrator for mediation and resolution.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 shadow-xl shadow-red-500/20 active:translate-y-px transition-all disabled:bg-slate-200 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {loading || uploadingImage ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {uploadingImage ? "Uploading image..." : "Submitting..."}
              </>
            ) : (
              <>
                <Send size={18} />
                Submit Complaint
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
