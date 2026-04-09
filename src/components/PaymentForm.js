"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CreditCard, CheckCircle2, AlertCircle, Loader2, Upload, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { usePaystackPayment } from "react-paystack";
import { useSession } from "next-auth/react";

export default function PaymentForm({
  totalDue,
  canPayPartial,
  partialPaymentInstallments,
  tenantEmail,
  tenantId,
  rentStartDate,
  existingPayments = [],
}) {
  const router = useRouter();
  const { data: session } = useSession();

  const [mode, setMode] = useState("paystack"); // "paystack" | "receipt"
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [rulesAgreed, setRulesAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

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
  const isPartialMode = canPayPartial && partialPaymentInstallments > 1;
  const payAmount = isPartialMode && nextInstallment ? nextInstallment.amount : totalDue;

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
          isPartial: isPartialMode,
          installmentNumber: nextInstallment?.number || null,
          totalInstallments: partialPaymentInstallments || null,
          dueDate: nextInstallment?.dueDate || null,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => { setSuccess(false); router.refresh(); }, 3000);
      } else {
        alert("Payment verification failed. Please contact support.");
      }
    } catch {
      alert("An error occurred during verification.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaystackClick = (e) => {
    e.preventDefault();
    if (!rulesAgreed) return alert("Please agree to the Tenancy Rules before proceeding.");
    if (!signature.trim()) return alert("Please provide your digital signature.");
    setLoading(true);
    initializePayment(onPaystackSuccess, () => setLoading(false));
  };

  const handleReceiptUpload = async (e) => {
    e.preventDefault();
    if (!receiptFile) return alert("Please select a receipt file.");
    if (!rulesAgreed) return alert("Please agree to the Tenancy Rules before proceeding.");

    setUploadProgress(true);
    try {
      // Upload file via existing upload API
      const formData = new FormData();
      formData.append("file", receiptFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();

      // Create payment record
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: payAmount,
          receiptUrl: url,
          isPartial: isPartialMode,
          paymentType: isPartialMode ? "PARTIAL" : "FULL",
          installmentNumber: nextInstallment?.number || null,
          totalInstallments: partialPaymentInstallments || null,
          dueDate: nextInstallment?.dueDate || null,
          tenantId,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => { setSuccess(false); router.refresh(); }, 3000);
      } else {
        alert("Failed to submit receipt. Please try again.");
      }
    } catch {
      alert("An error occurred during upload.");
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
          <p className="text-xs text-slate-500 mt-1">Full annual payment required.</p>
        )}
      </div>

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
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setMode("paystack")}
            className={`py-2.5 text-xs font-bold rounded-lg transition-all ${mode === "paystack" ? "bg-white shadow text-blue-600" : "text-slate-500"}`}
          >
            Pay via Paystack
          </button>
          <button
            type="button"
            onClick={() => setMode("receipt")}
            className={`py-2.5 text-xs font-bold rounded-lg transition-all ${mode === "receipt" ? "bg-white shadow text-blue-600" : "text-slate-500"}`}
          >
            Upload Receipt
          </button>
        </div>

        {/* Receipt upload mode */}
        {mode === "receipt" && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
              onClick={() => document.getElementById("receipt-input").click()}
            >
              <Upload size={24} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">
                {receiptFile ? receiptFile.name : "Click to upload receipt"}
              </p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG, PDF up to 10MB</p>
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

        {/* Agreement */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="rulesAgreed"
              className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
              checked={rulesAgreed}
              onChange={(e) => setRulesAgreed(e.target.checked)}
            />
            <label htmlFor="rulesAgreed" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
              I agree to the{" "}
              <Link href="/tenant/rules" className="text-blue-600 font-bold hover:underline" target="_blank">
                Tenancy Rules and Regulations
              </Link>
              .
            </label>
          </div>

          {rulesAgreed && mode === "paystack" && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <input
                type="text"
                placeholder="Type your full name as digital signature"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all text-center italic"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Submit button */}
        {mode === "paystack" ? (
          <button
            onClick={handlePaystackClick}
            disabled={loading || !rulesAgreed || !signature.trim()}
            className="w-full py-4 bg-[#0b69ff] text-white rounded-2xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:translate-y-px transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : `Pay ₦${payAmount.toLocaleString()} via Paystack`}
          </button>
        ) : (
          <button
            onClick={handleReceiptUpload}
            disabled={uploadProgress || !receiptFile || !rulesAgreed}
            className="w-full py-4 bg-[#102a43] text-white rounded-2xl text-sm font-bold hover:bg-slate-800 active:translate-y-px transition-all disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center gap-2"
          >
            {uploadProgress ? <><Loader2 size={18} className="animate-spin" /> Uploading...</> : "Submit Receipt for Approval"}
          </button>
        )}
      </div>
    </div>
  );
}
