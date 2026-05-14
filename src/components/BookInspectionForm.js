"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePaystackPayment } from "react-paystack";
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowRight,
  Building2,
  Share2
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

export default function BookInspectionForm() {

  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fee, setFee] = useState(0);
  const [feeEnabled, setFeeEnabled] = useState(true);
  const [paidAmount, setPaidAmount] = useState(0); // locked at booking time
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `Book Inspection - Room ${roomNumber || ''}`,
        text: `Check out this room and book an inspection!`,
        url: url
      }).catch(() => {
        // Fallback to copy
        copyToClipboard(url);
      });
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Link copied to clipboard!", { duration: 2000 });
    }).catch(() => {
      toast.error("Failed to copy link", { duration: 2000 });
    });
  };

  // Get room details from URL
  const roomNumber = searchParams.get("roomNumber");
  const blockName = searchParams.get("blockName");
  const address = searchParams.get("address");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    roomNumber: roomNumber || "",
    blockName: blockName || "",
    address: address || "",
  });

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone validation function
  const validatePhone = (phone) => {
    // Should be +234 followed by 10 digits
    const phoneRegex = /^\+234\d{10}$/;
    return phoneRegex.test(phone);
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, "");
    
    // If user is typing and has digits
    if (digitsOnly.length > 0) {
      // Remove +234 prefix if present to get the actual number
      let phoneNumber = digitsOnly;
      if (phoneNumber.startsWith("234")) {
        phoneNumber = phoneNumber.substring(3);
      }
      
      // Limit to 10 digits (Nigerian phone numbers)
      phoneNumber = phoneNumber.substring(0, 10);
      
      // Format with +234 prefix
      setFormData({ ...formData, phone: phoneNumber ? `+234${phoneNumber}` : "" });
    } else {
      setFormData({ ...formData, phone: "" });
    }
  };

  const bookingDetailsRef = useRef(null);
  const feeRef = useRef(0);

  // Fetch inspection fee
  useEffect(() => {
    const fetchSettings = () => {
      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          const isEnabled = data.INSPECTION_FEE_ENABLED === "true";
          setFeeEnabled(isEnabled);
          
          if (isEnabled && data.INSPECTION_FEE) {
            const val = parseFloat(data.INSPECTION_FEE);
            setFee(val);
            feeRef.current = val;
          } else {
            setFee(0);
            feeRef.current = 0;
          }
          setSettingsLoaded(true);
        })
        .catch((err) => {
          console.error(err);
          setSettingsLoaded(true);
        });
    };

    // Initial fetch
    fetchSettings();

    // Poll every 30 seconds for settings updates
    const interval = setInterval(fetchSettings, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
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
    setPaidAmount(feeRef.current); // lock the amount that was actually paid
    setSuccess(true);
    toast.dismiss();

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
      duration: 3000,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email
    if (!validateEmail(formData.email)) {
      toast.error("Please enter a valid email address", { duration: 3000 });
      return;
    }
    
    // Validate phone if provided
    if (formData.phone && !validatePhone(formData.phone)) {
      toast.error("Please enter a valid 10-digit phone number", { duration: 3000 });
      return;
    }
    
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

      if (data.feeAmount !== undefined) {
        setFee(data.feeAmount);
        feeRef.current = data.feeAmount;
      }

      setLoading(false);

      if (feeRef.current === 0) {
        setPaidAmount(0); // lock as free
        setSuccess(true);
        toast.success("Booking confirmed successfully!", { duration: 3000 });
      } else {
        initializePayment({
          onSuccess: handlePaymentSuccess,
          onClose: handlePaymentClose,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Something went wrong", {
        duration: 3000,
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

          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Room Inspection Booked</h1>
          {/* <p className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-6">Inspection Confirmed</p> */}

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
              <span className="font-black text-green-600 text-lg">{paidAmount === 0 ? "FREE" : `₦${paidAmount.toLocaleString()}`}</span>
            </div>
          </div>

          {paidAmount > 0 && (
            <PaymentSuccessMessage amount={paidAmount} />
          )}

          <button
            onClick={() => router.push("/")}
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
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      
      {!settingsLoaded ? (
        <div className="bg-white rounded-3xl p-10 shadow-lg max-w-xl w-full">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium">Loading booking form...</p>
          </div>
        </div>
      ) : (
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
              {!feeEnabled || fee === 0 ? "FREE" : `₦${fee.toLocaleString()}`}
            </p>
          </div>
        </div>

        {/* Room info banner */}
        {roomNumber && (
          <div className="mb-6 flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
            <div className="p-2 bg-[#0b69ff] rounded-xl shrink-0">
              <Building2 size={16} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-[#0b69ff] uppercase tracking-widest">Inspecting</p>
              <p className="text-sm font-bold text-[#102a43] truncate">
                Room {roomNumber}{blockName ? ` · ${blockName}` : ""}
              </p>
              {address && <p className="text-xs text-gray-500 truncate">{address}</p>}
            </div>
            <button
              type="button"
              onClick={handleShare}
              className="p-2 hover:bg-blue-100 rounded-lg transition-colors shrink-0"
              title="Share this room"
            >
              <Share2 size={18} className="text-[#0b69ff]" />
            </button>
          </div>
        )}

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
          {formData.email && !validateEmail(formData.email) && (
            <p className="text-[10px] text-red-500 ml-1 flex items-center gap-1 -mt-2">
              <span className="w-1 h-1 rounded-full bg-red-500"></span>
              Please enter a valid email address
            </p>
          )}

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 flex items-center gap-1">
                <span className="text-xs font-bold">+234</span>
              </div>
              <input
                type="tel"
                placeholder="7061608636"
                className="w-full border border-slate-200 bg-white text-slate-900 rounded-xl pl-16 pr-4 py-3 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                value={formData.phone.replace("+234", "")}
                onChange={handlePhoneChange}
                maxLength={10}
              />
            </div>
            <p className="text-[10px] text-slate-400 ml-1 -mt-2">Enter 10-digit phone number (optional)</p>

            <input
              required
              type={formData.date ? "date" : "text"}
              onFocus={(e) => {
                e.target.type = "date";
                // Show the native date picker immediately
                try {
                  e.target.showPicker();
                } catch (err) {
                  // Fallback for older browsers
                }
              }}
              onBlur={(e) => {
                if (!e.target.value) e.target.type = "text";
              }}
              placeholder="Select Inspection Date"
              min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000 + 86400000).toISOString().split('T')[0]}
              className="w-full border border-slate-200 bg-white text-slate-900 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />

          {feeEnabled && fee > 0 && (
            <div className="bg-amber-50 p-4 rounded-xl border text-sm text-amber-800 flex gap-3">
              <AlertCircle size={18} />
              Non-refundable booking fee. Payment handled by Paystack.
            </div>
          )}

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
                {!feeEnabled || fee === 0 ? "Confirm Booking" : "Continue to Payment"} <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
      )}
    </div>
  );
}

// Payment success message — stays permanently on the success screen
function PaymentSuccessMessage({ amount }) {
  return (
    <div className="mb-6 flex items-start gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl text-left animate-in fade-in duration-300">
      <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-bold text-green-800">Payment of ₦{amount.toLocaleString()} confirmed</p>
        <p className="text-xs text-green-600 mt-0.5">Your payment was received successfully. A receipt has been sent to your email.</p>
      </div>
    </div>
  );
}
