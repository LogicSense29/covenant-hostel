"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CreditCard, CheckCircle2, AlertCircle, Loader2, Upload, Calendar, ChevronDown, ChevronUp, Lock } from "lucide-react";
import { usePaystackPayment } from "react-paystack";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

export default function PaymentForm({
  totalDue,
  canPayPartial,
  partialPaymentInstallments,
  tenantEmail,
  tenantId,
  rentStartDate,
  existingPayments = [],
  recurringChargeIds = [],
  isRentSelected = true,
  rentFrequencyShorthand = "yr",
  breakdown = [],
  isRecurringOnly = false,
  charge = null,
  isSharer = false,
  primaryName = "",
}) {
  const router = useRouter();
  const { data: session } = useSession();

  const [mode, setMode] = useState("receipt"); // "paystack" | "receipt"
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [signature, setSignature] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [bankDetails, setBankDetails] = useState(null);

  useEffect(() => {
    fetch("/api/public/bank-details")
      .then(res => res.json())
      .then(data => {
        if (data.BANK_NAME || data.ACCOUNT_NUMBER || data.ACCOUNT_NAME) {
          setBankDetails({
            bankName: data.BANK_NAME || "N/A",
            accountNumber: data.ACCOUNT_NUMBER || "N/A",
            accountName: data.ACCOUNT_NAME || "N/A",
          });
        }
      })
      .catch(err => console.error("Error fetching bank details setting:", err));
  }, []);

  // Compute installment schedule
  const installments = useMemo(() => {
    if (!canPayPartial || !partialPaymentInstallments) return [];
    const installmentAmount = totalDue / partialPaymentInstallments;
    const start = rentStartDate ? new Date(rentStartDate) : new Date();
    return Array.from({ length: partialPaymentInstallments }, (_, i) => {
      const due = new Date(start);
      due.setMonth(due.getMonth() + i);
      const paid = existingPayments.find(
        (p) => p.installmentNumber === i + 1 && p.status !== "REJECTED"
      );
      return {
        number: i + 1,
        amount: installmentAmount,
        dueDate: due,
        paid,
      };
    });
  }, [canPayPartial, partialPaymentInstallments, totalDue, rentStartDate, existingPayments]);

  // Next unpaid installment
  const nextInstallment = installments.find((inst) => !inst.paid);
  const isPartialMode = !isRecurringOnly && canPayPartial && partialPaymentInstallments > 1 && isRentSelected;
  const payAmount = isRecurringOnly && charge
    ? charge.amount
    : breakdown && breakdown.length > 0
      ? breakdown.reduce((sum, item) => sum + item.amount, 0)
      : (isPartialMode && nextInstallment ? nextInstallment.amount : totalDue);

  const config = {
    reference: new Date().getTime().toString(),
    email: tenantEmail || session?.user?.email,
    amount: Math.round(payAmount * 100),
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
          amount: payAmount,
          signature,
          isPartial: isRecurringOnly ? false : (isPartialMode && isRentSelected),
          installmentNumber: isRecurringOnly || !isRentSelected ? null : (nextInstallment?.number || null),
          totalInstallments: isRecurringOnly || !isRentSelected ? null : (partialPaymentInstallments || null),
          dueDate: isRecurringOnly || !isRentSelected ? null : (nextInstallment?.dueDate || null),
          recurringChargeIds: isRecurringOnly && charge ? [charge.id] : (recurringChargeIds || []),
          isRentSelected: isRecurringOnly ? false : isRentSelected,
          breakdown: isRecurringOnly ? [] : (breakdown || []),
          recurringChargeId: isRecurringOnly && charge ? charge.id : undefined,
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
    if (!signature.trim()) return toast.error("Please provide your digital signature.");
    // Don't set loading here — Paystack opens its own modal overlay
    // loading is set inside onPaystackSuccess after Paystack closes
    initializePayment({
      onSuccess: onPaystackSuccess,
      onClose: () => setLoading(false),
    });
  };

  const handleReceiptUpload = async (e) => {
    e.preventDefault();
    if (!receiptFile) return toast.error("Please select a receipt file.");
    if (uploadProgress || success) return; // prevent double submit

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
          amount: payAmount,
          receiptUrl: fileUrl,
          isPartial: isRecurringOnly ? false : (isPartialMode && isRentSelected),
          paymentType: isRecurringOnly ? "RECURRING" : (isRentSelected ? (isPartialMode ? "PARTIAL" : "FULL") : "RECURRING"),
          installmentNumber: isRecurringOnly || !isRentSelected ? null : (nextInstallment?.number || null),
          totalInstallments: isRecurringOnly || !isRentSelected ? null : (partialPaymentInstallments || null),
          dueDate: isRecurringOnly || !isRentSelected ? null : (nextInstallment?.dueDate || null),
          tenantId,
          recurringChargeIds: isRecurringOnly && charge ? [charge.id] : (recurringChargeIds || []),
          isRentSelected: isRecurringOnly ? false : isRentSelected,
          breakdown: isRecurringOnly ? [] : (breakdown || []),
          recurringChargeId: isRecurringOnly && charge ? charge.id : undefined,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        // Don't reset success — keeps the form locked so tenant can't re-submit.
        // Page refresh is only triggered on next navigation.
        setTimeout(() => router.refresh(), 2500);
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
      <div className="bg-green-50 rounded-3xl p-10 border border-green-200 text-center animate-in zoom-in-95 duration-500">
        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-xl font-bold text-green-900">
          {mode === "receipt" ? "Receipt Submitted!" : "Payment Successful!"}
        </h3>
        <p className="text-green-700 mt-2 text-sm">
          {mode === "receipt"
            ? "Your receipt has been submitted and is awaiting landlord approval."
            : "Your payment has been confirmed."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Header */}
      {isRecurringOnly && charge ? (
        <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CreditCard size={20} className="text-blue-600" />
              {charge.billingRule.title || charge.billingRule.description}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Due: {new Date(charge.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 px-3 py-1 bg-slate-200 rounded-full border border-slate-300">
            {charge.billingRule.frequency?.replace(/_/g, " ")}
          </span>
        </div>
      ) : (
        <div className="bg-slate-50 p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CreditCard size={20} className="text-blue-600" />
            {isPartialMode ? `Installment ${nextInstallment?.number || "—"} of ${partialPaymentInstallments}` : "Make Payment"}
          </h3>
          {isPartialMode && nextInstallment && (
            <p className="text-xs text-slate-500 mt-1">
              Due: {nextInstallment.dueDate.toLocaleDateString()} · ₦{nextInstallment.amount.toLocaleString()}
            </p>
          )}
          {!isPartialMode && (
            <p className="text-xs text-slate-500 mt-1">Full payment required.</p>
          )}
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Amount display */}
        <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600">Amount due</span>
          <span className="text-2xl font-black text-slate-900">₦{payAmount.toLocaleString()}</span>
        </div>

        {/* Installment schedule toggle */}
        {isPartialMode && installments.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowSchedule(!showSchedule)}
              className="w-full flex items-center justify-between text-sm font-semibold text-slate-700 bg-blue-50 px-4 py-3 rounded-xl hover:bg-blue-100 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" />
                View installment schedule
              </span>
              {showSchedule ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showSchedule && (
              <div className="mt-3 rounded-xl border border-slate-100 overflow-hidden">
                {installments.map((inst) => (
                  <div
                    key={inst.number}
                    className={`flex items-center justify-between px-4 py-3 text-sm border-b border-slate-50 last:border-0 ${
                      inst.paid?.status === "VERIFIED" ? "bg-green-50" :
                      inst.paid?.status === "PENDING" ? "bg-amber-50" :
                      inst.number === nextInstallment?.number ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center">
                        {inst.number}
                      </span>
                      <span className="text-slate-600">{inst.dueDate.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900">₦{inst.amount.toLocaleString()}</span>
                      {inst.paid?.status === "VERIFIED" && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Paid</span>}
                      {inst.paid?.status === "PENDING" && <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Pending</span>}
                      {!inst.paid && inst.number === nextInstallment?.number && <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Due next</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payment mode tabs */}
        <div className="grid grid-cols-1 gap-2 bg-slate-100 p-1 rounded-xl">
          {/* <button
            type="button"
            onClick={() => setMode("paystack")}
            className={`py-2.5 text-xs font-bold rounded-lg transition-all ${mode === "paystack" ? "bg-white shadow text-blue-600" : "text-slate-500"}`}
          >
            Pay via Paystack
          </button> */}
          <button
            type="button"
            onClick={() => setMode("receipt")}
            className={`py-2.5 text-xs font-bold rounded-lg transition-all ${mode === "receipt" ? "bg-white shadow text-blue-600" : "text-slate-500"}`}
          >
          Pay via Transfer
          </button>
        </div>

        {/* Receipt upload mode */}
        {mode === "receipt" && (
          <div className="space-y-4">
            {bankDetails && (
              <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-3">
                <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                  <CreditCard size={12} />
                  Hostel Bank Account Details
                </h4>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Bank Name</span>
                    <span className="font-bold text-slate-900">{bankDetails.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Account Number</span>
                    <span className="font-bold text-slate-900 tracking-wider">{bankDetails.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Account Name</span>
                    <span className="font-bold text-slate-900">{bankDetails.accountName}</span>
                  </div>
                </div>
                <div className="text-[10px] text-blue-500 font-medium bg-blue-50/60 p-2 rounded-lg text-center mt-2 border border-blue-100/50">
                  Kindly transfer <strong>₦{payAmount.toLocaleString()}</strong> to the details above, then upload your transfer receipt below.
                </div>
              </div>
            )}

            <div
              className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
              onClick={() => document.getElementById("receipt-input").click()}
            >
              <Upload size={24} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600 truncate max-w-xs mx-auto" title={receiptFile?.name}>
                {receiptFile ? receiptFile.name : "Click to upload receipt"}
              </p>
              {receiptFile && (
                <p className="text-xs text-slate-400 mt-0.5">{(receiptFile.size / 1024).toFixed(1)} KB</p>
              )}
              {!receiptFile && <p className="text-xs text-slate-400 mt-1">PNG, JPG, PDF up to 10MB</p>}
              <input
                id="receipt-input"
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setReceiptFile(e.target.files[0])}
              />
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-medium">
                Receipt uploads require landlord approval before your payment is confirmed.
              </p>
            </div>
          </div>
        )}

        {/* Signature */}
        {!isRecurringOnly && (
          <div className="space-y-4">
            {mode === "paystack" && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Digital Signature <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Type your full name to sign"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all text-center italic"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                />
                <p className="text-xs text-slate-400 mt-1.5">Required before payment can proceed</p>
              </div>
            )}
          </div>
        )}

        {/* Submit button */}
        {isSharer ? (
          <div className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl text-sm font-bold border border-slate-200 flex items-center justify-center gap-2">
            <Lock size={18} />
            Managed by {primaryName}
          </div>
        ) : mode === "paystack" ? (
          <button
            onClick={handlePaystackClick}
            disabled={loading || !signature.trim()}
            className="w-full py-4 bg-[#0b69ff] text-white rounded-2xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:translate-y-px transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : `Pay ₦${payAmount.toLocaleString()}${isRentSelected ? `/${rentFrequencyShorthand}` : ""} via Paystack`}
          </button>
        ) : (
          <button
            onClick={handleReceiptUpload}
            disabled={uploadProgress || !receiptFile}
            className="w-full py-4 bg-[#102a43] text-white rounded-2xl text-sm font-bold hover:bg-slate-800 active:translate-y-px transition-all disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center gap-2"
          >
            {uploadProgress ? <><Loader2 size={18} className="animate-spin" /> Uploading...</> : "Submit Receipt for Approval"}
          </button>
        )}
      </div>
    </div>
  );
}
