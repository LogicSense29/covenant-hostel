"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CreditCard, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { usePaystackPayment } from "react-paystack";
import { useSession } from "next-auth/react";

export default function PaymentForm({ totalDue, canPayPartial, tenantEmail }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [amount, setAmount] = useState(totalDue.toFixed(2));

  const [rulesAgreed, setRulesAgreed] = useState(false);
  const [signature, setSignature] = useState("");

  // Paystack Configuration
  const config = {
    reference: (new Date()).getTime().toString(),
    email: tenantEmail || session?.user?.email,
    amount: parseFloat(amount) * 100, // Paystack works in kobo/cents
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder", // User needs to provide this
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = async (reference) => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: reference.reference,
          amount: parseFloat(amount),
          signature: signature, // Digital signature passed to API
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          router.refresh();
        }, 3000);
      } else {
        alert("Payment verification failed. Please contact support.");
      }
    } catch (err) {
      alert("An error occurred during verification.");
    } finally {
      setLoading(false);
    }
  };

  const onClose = () => {
    setLoading(false);
  };

  const handlePayClick = (e) => {
    e.preventDefault();
    if (!rulesAgreed) {
      alert("Please read and agree to the Tenancy Rules and Regulations before proceeding.");
      return;
    }
    if (!signature.trim()) {
      alert("Please provide your digital signature (full name) to proceed.");
      return;
    }
    setLoading(true);
    initializePayment(onSuccess, onClose);
  };

  if (success) {
    return (
      <div className="bg-green-50 rounded-3xl p-10 border border-green-200 text-center animate-in zoom-in-95 duration-500">
        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
           <CheckCircle2 size={32} />
        </div>
        <h3 className="text-xl font-bold text-green-900">Payment Successful!</h3>
        <p className="text-green-700 mt-2">Your rent has been updated and a receipt has been generated.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in slide-in-from-right-4 duration-700">
      <div className="bg-slate-50 p-6 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <CreditCard size={20} className="text-blue-600" />
          Pay via Paystack
        </h3>
        <p className="text-xs text-slate-500 mt-1">Instant confirmation for rent and fees.</p>
      </div>

      <div className="p-8 space-y-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Payment Amount ($)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
            <input
              type="number"
              step="0.01"
              required
              readOnly={!canPayPartial}
              className={`w-full pl-8 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all ${!canPayPartial ? 'cursor-not-allowed opacity-75' : 'focus:bg-white'}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          {!canPayPartial && (
            <p className="text-[10px] text-amber-600 font-bold mt-2 flex items-center gap-1 uppercase tracking-tight">
               <AlertCircle size={12} /> Full payment required by landlord
            </p>
          )}
        </div>

        {/* Tenancy Agreement Checkbox */}
        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-3">
             <input 
               type="checkbox" 
               id="rulesAgreed"
               className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors cursor-pointer"
               checked={rulesAgreed}
               onChange={(e) => setRulesAgreed(e.target.checked)}
             />
             <label htmlFor="rulesAgreed" className="text-xs text-slate-600 font-medium leading-relaxed cursor-pointer select-none">
               I have read and agree to follow the <Link href="/tenant/rules" className="text-blue-600 font-bold hover:underline" target="_blank">Tenancy Rules and Regulations</Link>.
             </label>
          </div>

          <div className={`transition-all duration-500 overflow-hidden ${rulesAgreed ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1 text-center">Digital Signature (Type Full Name)</label>
             <input
               type="text"
               required
               placeholder="Enter your full name as signature"
               className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all text-center italic"
               value={signature}
               onChange={(e) => setSignature(e.target.value)}
             />
          </div>
        </div>

        <button
          onClick={handlePayClick}
          disabled={loading || !rulesAgreed || !signature.trim()}
          className="w-full py-5 bg-blue-600 text-white rounded-2xl text-base font-bold hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:translate-y-px transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Processing...
            </>
          ) : (
            "Review & Secure Checkout"
          )}
        </button>
        
        <div className="flex items-center justify-center gap-2 grayscale opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
           <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Paystack_Logo.png" alt="Paystack" className="h-4" />
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secured Payment</span>
        </div>
      </div>
    </div>
  );
}
