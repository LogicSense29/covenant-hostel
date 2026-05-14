"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { usePaystackPayment } from "react-paystack";
import { toast } from "react-hot-toast";

export default function RecurringChargePaymentForm({ charge, tenantEmail, tenantId }) {
  const router = useRouter();
  const [mode, setMode] = useState("paystack");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  // Generate a fresh reference each time — stored in state so it's stable per mount
  const [paystackRef] = useState(() => `rc_${charge.id}_${Date.now()}`);

  const config = {
    reference: paystackRef,
    email: tenantEmail,
    amount: Math.round(charge.amount * 100),
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder",
  };

  const initializePayment = usePaystackPayment(config);

  const onPaystackSuccess = async (reference) => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: reference.reference,
          amount: charge.amount,
          recurringChargeId: charge.id,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => { setSuccess(false); router.refresh(); }, 3000);
      } else {
        const errText = await res.text();
        toast.error(errText || "Payment verification failed. Please contact support.");
      }
    } catch {
      toast.error("An error occurred during verification. Please contact support.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaystackClick = (e) => {
    e.preventDefault();
    initializePayment({
      onSuccess: onPaystackSuccess,
      onClose: () => setLoading(false),
    });
  };

  const handleReceiptUpload = async (e) => {
    e.preventDefault();
    if (!receiptFile) return toast.error("Please select a receipt file.");

    setUploadProgress(true);
    try {
      const formData = new FormData();
      formData.append("file", receiptFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { fileUrl } = await uploadRes.json();
      if (!fileUrl) throw new Error("No file URL returned");

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: charge.amount,
          receiptUrl: fileUrl,
          paymentType: "RECURRING",
          recurringChargeId: charge.id,
          tenantId,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => { setSuccess(false); router.refresh(); }, 3000);
      } else {
        toast.error("Failed to submit receipt. Please try again.");
      }
    } catch {
      toast.error("An error occurred during upload.");
    } finally {
      setUploadProgress(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 rounded-2xl p-6 border border-green-200 text-center">
        <CheckCircle2 size={24} className="text-green-600 mx-auto mb-2" />
        <p className="text-sm font-bold text-green-900">
          {mode === "receipt" ? "Receipt Submitted!" : "Payment Successful!"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-bold text-slate-900">{charge.billingRule.title || charge.billingRule.description}</p>
          <p className="text-xs text-slate-400">Due: {new Date(charge.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
        </div>
        <p className="text-lg font-black text-slate-900">₦{charge.amount.toLocaleString()}</p>
      </div>

      {/* Payment mode tabs */}
      <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => setMode("paystack")}
          className={`py-2 text-xs font-bold rounded-md transition-all ${mode === "paystack" ? "bg-white shadow text-blue-600" : "text-slate-500"}`}
        >
          Paystack
        </button>
        <button
          type="button"
          onClick={() => setMode("receipt")}
          className={`py-2 text-xs font-bold rounded-md transition-all ${mode === "receipt" ? "bg-white shadow text-blue-600" : "text-slate-500"}`}
        >
          Upload Receipt
        </button>
      </div>

      {mode === "receipt" && (
        <div className="space-y-3">
          <div
            className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
            onClick={() => document.getElementById(`receipt-input-${charge.id}`).click()}
          >
            <Upload size={20} className="text-slate-300 mx-auto mb-1" />
            <p className="text-xs font-semibold text-slate-600">
              {receiptFile ? receiptFile.name : "Click to upload receipt"}
            </p>
            <input
              id={`receipt-input-${charge.id}`}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => setReceiptFile(e.target.files[0])}
            />
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-2 flex items-start gap-2">
            <AlertCircle size={12} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 font-medium">
              Receipt uploads require landlord approval.
            </p>
          </div>
        </div>
      )}

      {mode === "paystack" ? (
        <button
          onClick={handlePaystackClick}
          disabled={loading}
          className="w-full py-3 bg-[#0b69ff] text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:translate-y-px transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : `Pay ₦${charge.amount.toLocaleString()}`}
        </button>
      ) : (
        <button
          onClick={handleReceiptUpload}
          disabled={uploadProgress || !receiptFile}
          className="w-full py-3 bg-[#102a43] text-white rounded-xl text-sm font-bold hover:bg-slate-800 active:translate-y-px transition-all disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center gap-2"
        >
          {uploadProgress ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : "Submit Receipt"}
        </button>
      )}
    </div>
  );
}
