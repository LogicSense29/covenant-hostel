"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePaystackPayment } from "react-paystack";
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowRight
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

export default function BookInspectionForm() {

  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fee, setFee] = useState(5000);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
  });

  const bookingDetailsRef = useRef(null);
  const feeRef = useRef(5000);

  // Fetch inspection fee
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.INSPECTION_FEE) {
          const val = parseFloat(data.INSPECTION_FEE);
          setFee(val);
          feeRef.current = val;
        }
      })
      .catch(console.error);
  }, []);

  /*
  PAYSTACK CONFIG
  This will reinitialize with latest values
  */
  const initializePayment = usePaystackPayment({
    reference: `inspection_${Date.now()}`,
    email: formData.email,
    amount: feeRef.current * 100,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
  });

  // Payment success — Paystack has confirmed the transaction on their end.
  const handlePaymentSuccess = async (reference) => {
    setSuccess(true);
    toast.success("Payment successful! Booking confirmed.", {
      duration: 4000,
    });

    try {
      await fetch("/api/guest-inspections/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: reference.reference,
          inspectionId: bookingDetailsRef.current?.id,
          amount: feeRef.current,
        }),
      });
    } catch (err) {
      console.error("Background verification failed:", err);
    }

    setLoading(false);
  };

  const handlePaymentClose = () => {
    setLoading(false);
    toast.error("Payment cancelled.", {
      duration: 4000,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/guest-inspections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create inspection");
      }

      bookingDetailsRef.current = data.inspection;

      if (data.feeAmount) {
        setFee(data.feeAmount);
        feeRef.current = data.feeAmount;
      }

      setLoading(false);

      initializePayment({
        onSuccess: handlePaymentSuccess,
        onClose: handlePaymentClose,
      });
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Something went wrong", {
        duration: 4000,
      });
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-200 opacity-20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-green-200 opacity-20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative bg-white rounded-3xl p-10 shadow-2xl max-w-md w-full text-center border border-slate-100">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-30" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-300/40">
              <CheckCircle2 className="text-white" size={44} />
            </div>
          </div>

          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Payment Successful!</h1>
          <p className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-6">Inspection Confirmed</p>

          <div className="bg-slate-50 rounded-2xl p-5 mb-6 text-left space-y-3 border border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Name</span>
              <span className="font-bold text-slate-800">{formData.name}</span>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Email</span>
              <span className="font-bold text-slate-800 truncate max-w-[180px]">{formData.email}</span>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Inspection Date</span>
              <span className="font-bold text-blue-600">{new Date(formData.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Amount Paid</span>
              <span className="font-black text-green-600 text-lg">₦{fee.toLocaleString()}</span>
            </div>
          </div>

          <p className="text-slate-400 text-xs mb-8">A receipt has been sent to your email address. Please check your inbox.</p>

          <button
            onClick={() => router.push("/book-inspection")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200 hover:-translate-y-0.5 active:scale-95"
          >
            Go back  <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafcff] flex items-center justify-center p-6">
      <Toaster position="top-center" />
      <div className="bg-white rounded-3xl p-10 shadow-lg max-w-xl w-full">

        <div className="flex justify-between items-center mb-8 border-b pb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Book Inspection</h2>
            <p className="text-slate-500 text-sm">
              Enter your correct details
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Booking Fee
            </span>
            <p className="text-2xl font-bold text-blue-600">
              ₦{fee.toLocaleString()}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

            <input
              required
              type="text"
              placeholder="Full Name"
              className="w-full border border-slate-200 bg-white text-slate-900 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
          />

            <input
              required
              type="email"
              placeholder="Email"
              className="w-full border border-slate-200 bg-white text-slate-900 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

            <input
              type="tel"
              placeholder="Phone Number"
              className="w-full border border-slate-200 bg-white text-slate-900 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />

            <input
              required
              type="date"
              min={new Date().toISOString().split("T")[0]}
              className="w-full border border-slate-200 bg-white text-slate-900 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
            value={formData.date}
            onChange={(e) =>
              setFormData({ ...formData, date: e.target.value })
            }
          />

          <div className="bg-amber-50 p-4 rounded-xl border text-sm text-amber-800 flex gap-3">
            <AlertCircle size={18} />
            Non-refundable booking fee. Payment handled by Paystack.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200 hover:-translate-y-0.5 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            {loading ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                Processing...
              </>
            ) : (
              <>
                Continue to Payment <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
