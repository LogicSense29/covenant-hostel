"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  User, 
  Upload, 
  CheckCircle2, 
  ArrowRight, 
  Phone,
  Mail,
  Loader2,
  Building2,
  Calendar,
  Share2,
  CreditCard,
  AlertCircle
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

export default function BookInspectionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
    receiptUrl: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fee, setFee] = useState(0);
  const [feeEnabled, setFeeEnabled] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [bankDetails, setBankDetails] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchSettings = () => {
      fetch("/api/public/bank-details")
        .then((res) => res.json())
        .then((data) => {
          const isEnabled = data.INSPECTION_FEE_ENABLED === "true" || data.INSPECTION_FEE_ENABLED === undefined;
          setFeeEnabled(isEnabled);
          
          if (isEnabled && data.INSPECTION_FEE) {
            setFee(parseFloat(data.INSPECTION_FEE));
          } else {
            setFee(0);
          }
          
          if (data.BANK_NAME || data.ACCOUNT_NUMBER || data.ACCOUNT_NAME) {
            setBankDetails({
              bankName: data.BANK_NAME || "N/A",
              accountNumber: data.ACCOUNT_NUMBER || "N/A",
              accountName: data.ACCOUNT_NAME || "N/A",
            });
          }
          setSettingsLoaded(true);
        })
        .catch((err) => {
          console.error(err);
          setSettingsLoaded(true);
        });
    };

    fetchSettings();
  }, []);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `Book Inspection - Room ${roomNumber || ''}`,
        text: `Check out this room and book an inspection!`,
        url: url
      }).catch(() => copyToClipboard(url));
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Link copied to clipboard!", { duration: 2000 });
    });
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePhone = (phone) => /^\+234\d{10}$/.test(phone);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length > 0) {
        let phoneNumber = digitsOnly;
        if (phoneNumber.startsWith("234")) phoneNumber = phoneNumber.substring(3);
        phoneNumber = phoneNumber.substring(0, 10);
        setFormData({ ...formData, phone: phoneNumber ? `+234${phoneNumber}` : "" });
      } else {
        setFormData({ ...formData, phone: "" });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading("Uploading receipt...");

    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: data });
      const result = await res.json();
      
      if (result.success || result.fileUrl) {
        setFormData({ ...formData, receiptUrl: result.fileUrl });
        toast.success("Uploaded successfully!", { id: toastId });
      } else {
        toast.error(result.error || "Upload failed", { id: toastId });
      }
    } catch (err) {
      toast.error("An error occurred during upload", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmail(formData.email)) {
      return toast.error("Please enter a valid email address");
    }
    
    if (formData.phone && !validatePhone(formData.phone)) {
      return toast.error("Please enter a valid 10-digit phone number");
    }

    if (feeEnabled && fee > 0 && !formData.receiptUrl) {
      return toast.error("Please upload your transfer receipt to proceed");
    }

    setLoading(true);

    try {
      const res = await fetch("/api/guest-inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create inspection");
      }

      setSuccess(true);
      toast.success("Booking confirmed successfully!", { duration: 3000 });
    } catch (err) {
      toast.error(err.message || "Something went wrong", { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8 font-sans">
        <div className="w-full max-w-[480px] bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center animate-in zoom-in duration-300">
           <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 mb-6 mx-auto">
              <CheckCircle2 size={32} />
           </div>
           <h2 className="text-2xl font-bold text-slate-900 mb-3">Booking Received!</h2>
           <p className="text-slate-500 mb-6 leading-relaxed">
             Thank you for booking an inspection. Your details have been submitted. 
           </p>

           {feeEnabled && fee > 0 ? (
             <div className="bg-amber-50 rounded-2xl p-4 mb-8 text-left border border-amber-100 flex items-start gap-3">
               <AlertCircle size={18} className="text-amber-600 mt-0.5 shrink-0" />
               <div>
                 <p className="text-sm font-bold text-amber-800">Pending Receipt Verification</p>
                 <p className="text-xs text-amber-700 mt-1">Your payment receipt has been submitted and is awaiting confirmation by the landlord. We will contact you once it is verified.</p>
               </div>
             </div>
           ) : null}

           <button 
             onClick={() => router.push("/")}
             className="w-full h-12 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all"
           >
             Return Home
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8 font-sans">
      <Toaster position="top-center" />
      
      {!settingsLoaded ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
          <p className="text-slate-500 font-medium">Loading booking form...</p>
        </div>
      ) : (
        <div className="w-full max-w-[480px]">
          <div className="text-center mb-8">
             <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm mb-4">
                <Calendar size={24} />
             </div>
             <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Book Inspection</h1>
             <p className="text-sm text-slate-500 mt-1 font-medium">Schedule a facility tour</p>
          </div>

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
                {address && <p className="text-xs text-[#0b69ff]/70 truncate">{address}</p>}
              </div>
              <button onClick={handleShare} className="p-2 hover:bg-blue-100 rounded-lg transition-colors shrink-0 text-[#0b69ff]">
                <Share2 size={18} />
              </button>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-900">Fill Details</span>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Fee</span>
                  <p className="text-sm font-bold text-slate-900">
                    {!feeEnabled || fee === 0 ? "FREE" : `₦${fee.toLocaleString()}`}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                    <input required name="name" type="text" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900" placeholder="Samuel Adekunle" value={formData.name} onChange={handleChange} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                    <input required name="email" type="email" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900" placeholder="samuel@example.com" value={formData.email} onChange={handleChange} />
                  </div>
                  {formData.email && !validateEmail(formData.email) && (
                    <p className="text-[10px] text-red-500 ml-1 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-500"></span>
                      Please enter a valid email address
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                  <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors flex items-center gap-1">
                      <Phone size={18} />
                      <span className="text-xs font-bold">+234</span>
                    </div>
                    <input name="phone" type="tel" className="w-full pl-20 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900" placeholder="7061608636" value={formData.phone.replace("+234", "")} onChange={handleChange} maxLength={10} required/>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Inspection Date</label>
                  <div className="relative group">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                    <input required name="date" type={formData.date ? "date" : "text"} min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} onFocus={(e) => { e.target.type = "date"; try { e.target.showPicker(); } catch(err){} }} onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900" placeholder="Select a date" value={formData.date} onChange={handleChange} />
                  </div>
                </div>

                {feeEnabled && fee > 0 && (
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    {bankDetails && (
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl space-y-3">
                        <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                          <CreditCard size={12} />
                          Transfer Details
                        </h4>
                        <div className="space-y-1.5 text-xs text-slate-700">
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Bank Name</span>
                            <span className="font-bold text-slate-900">{bankDetails.bankName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Account Number</span>
                            <span className="font-bold text-slate-900 tracking-wider">{bankDetails.accountNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Account Name</span>
                            <span className="font-bold text-slate-900">{bankDetails.accountName}</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-blue-600 font-medium bg-blue-100/50 p-2 rounded-lg text-center mt-2 border border-blue-100">
                          Transfer <strong>₦{fee.toLocaleString()}</strong> to the details above and upload your receipt below.
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Payment Receipt</label>
                      <label className={`block border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer text-center ${
                        formData.receiptUrl ? "border-green-500 bg-green-50/50" : "border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-400"
                      }`}>
                        {uploading ? (
                          <Loader2 className="text-blue-600 animate-spin mx-auto" size={20} />
                        ) : formData.receiptUrl ? (
                          <div className="flex items-center justify-center gap-2">
                            <CheckCircle2 className="text-green-600" size={20} />
                            <span className="text-xs font-bold text-green-600">Receipt Uploaded</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <Upload className="text-slate-400" size={20} />
                            <span className="text-xs font-bold text-slate-600">Upload Transfer Receipt</span>
                          </div>
                        )}
                        <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
                      </label>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={loading || uploading || (feeEnabled && fee > 0 && !formData.receiptUrl)}
                    className="w-full h-12 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-sm transition-all flex items-center justify-center gap-2 group disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        Complete Booking
                        <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
