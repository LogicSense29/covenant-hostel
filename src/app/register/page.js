"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  User, 
  ShieldCheck, 
  MapPin, 
  Upload, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Lock,
  Phone,
  Mail,
  Loader2
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "TENANT", 
    guarantorName: "",
    guarantorPhone: "",
    guarantorAddress: "",
    guarantorIdUrl: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [registered, setRegistered] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading("Uploading ID...");

    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      const result = await res.json();
      if (result.success) {
        setFormData({ ...formData, guarantorIdUrl: result.fileUrl });
        toast.success("ID uploaded successfully!", { id: toastId });
      } else {
        toast.error(result.error || "Upload failed", { id: toastId });
      }
    } catch (err) {
      toast.error("An error occurred during upload", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.phone) {
        return toast.error("Please fill all account information");
      }
      if (formData.role !== "TENANT") {
        setStep(3); // Go to Password for others (we'll call step 3 "Security")
      } else {
        setStep(2); // Go to Guarantor for tenants
      }
    } else if (step === 2) {
      if (!formData.guarantorName || !formData.guarantorPhone || !formData.guarantorAddress || !formData.guarantorIdUrl) {
        return toast.error("Please provide all guarantor details and ID verification");
      }
      // For tenants, Step 2 is the last interactive step before submission
      handleSubmitInternal();
    }
  };

  const prevStep = () => {
    setStep(1);
  };

  const handleSubmitInternal = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        if (formData.role === "TENANT") {
          setRegistered(true);
          toast.success("Application submitted!");
        } else {
          toast.success("Account created successfully!");
          setTimeout(() => router.push("/login"), 1500);
        }
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: "Personal", id: 1 },
    { title: formData.role === "TENANT" ? "Guarantor & ID" : "Security", id: formData.role === "TENANT" ? 2 : 3 },
  ];

  if (registered) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8 font-sans">
        <div className="w-full max-w-[480px] bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center animate-in zoom-in duration-300">
           <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 mb-6 mx-auto">
              <CheckCircle2 size={32} />
           </div>
           <h2 className="text-2xl font-bold text-slate-900 mb-3">Application Received!</h2>
           <p className="text-slate-500 mb-8 leading-relaxed">
             Thank you for registering. Your details and guarantor information have been submitted for review. 
             <br /><br />
             Once approved, you will receive an email with a <strong>link to set your password</strong> and activate your account.
           </p>
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
      
      <div className="w-full max-w-[480px]">
        <div className="text-center mb-8">
           <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm mb-4">
              <ShieldCheck size={24} />
           </div>
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Account</h1>
           <p className="text-sm text-slate-500 mt-1 font-medium">Join Covenant Hostel Management System</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all">
          <div className="flex h-1.5 w-full bg-slate-100">
            {steps.map((s, i) => {
              const isActive = step >= s.id;
              return (
                <div 
                  key={s.id} 
                  className={`flex-1 transition-all duration-500 ${isActive ? "bg-blue-600" : "bg-transparent"}`}
                />
              );
            })}
          </div>

          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                Step {step === 1 ? 1 : 2} of 2
              </span>
              <span className="text-sm font-bold text-slate-900">
                {step === 1 ? "Personal Info" : (formData.role === "TENANT" ? "Guarantor & ID" : "Password Security")}
              </span>
            </div>

            <main className="space-y-5">
              {step === 1 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                      <input required name="email" type="email" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900" placeholder="samuel@hostel.com" value={formData.email} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                      <input required name="phone" type="tel" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900" placeholder="080 000 0000" value={formData.phone} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Register As</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["TENANT"].map((r) => (
                        <button key={r} type="button" onClick={() => setFormData({ ...formData, role: r })} className={`py-3 px-1 rounded-xl border text-[10px] font-bold transition-all ${
                          formData.role === r ? "bg-blue-600 border-blue-600 text-white shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}>
                          {r.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && formData.role === "TENANT" && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      

                  <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Guarantor Name</label>
                    <input required name="guarantorName" type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900" placeholder="Full name of guarantor" value={formData.guarantorName} onChange={handleChange} />
                  </div>
                  
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone</label>
                      <input required name="guarantorPhone" type="tel" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900" placeholder="080..." value={formData.guarantorPhone} onChange={handleChange} />
                    </div>

                  </div>

                                    <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Residential Address</label>
                    <div className="relative">
                      <textarea 
                        required 
                        name="guarantorAddress" 
                        rows="3" 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900 resize-none" 
                        placeholder="House Number, Street Name, City, State" 
                        value={formData.guarantorAddress} 
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Guarantor Valid ID Card</label>
                    <label className={`block border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer text-center ${
                      formData.guarantorIdUrl ? "border-green-500 bg-green-50/50" : "border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-400"
                    }`}>
                      {uploading ? (
                         <div className="flex flex-col items-center gap-2">
                            <Loader2 className="text-blue-600 animate-spin" size={24} />
                            <span className="text-[10px] font-bold text-blue-600 uppercase">Uploading...</span>
                         </div>
                      ) : formData.guarantorIdUrl ? (
                         <div className="flex flex-col items-center gap-2">
                            <CheckCircle2 className="text-green-600" size={24} />
                            <span className="text-[10px] font-bold text-green-600 uppercase">File Uploaded</span>
                            <span className="text-[9px] text-slate-400 underline">Click to replace</span>
                         </div>
                      ) : (
                         <div className="flex flex-col items-center gap-2">
                            <Upload className="text-slate-400" size={24} />
                            <span className="text-[11px] font-bold text-slate-600">Select Image/PDF</span>
                            <span className="text-[9px] text-slate-400">Passport, License or NIN</span>
                         </div>
                      )}
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
                    </label>
                  </div>
                </div>
              )}

              {step === 3 && formData.role !== "TENANT" && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Create Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                      <input required name="password" type="password" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900" placeholder="Minimum 6 characters" value={formData.password} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Confirm Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                      <input required name="confirmPassword" type="password" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900" placeholder="Re-enter password" value={formData.confirmPassword} onChange={handleChange} />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4">
                {step > 1 && (
                  <button onClick={prevStep} disabled={loading} className="px-5 py-3 h-12 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                    <ArrowLeft size={18} />
                  </button>
                )}
                
                <button 
                  onClick={nextStep} 
                  disabled={loading || uploading}
                  className="flex-1 h-12 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-sm transition-all flex items-center justify-center gap-2 group disabled:bg-slate-200 disabled:text-slate-400"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      {step === 1 ? "Continue" : (formData.role === "TENANT" ? "Submit Application" : "Complete Registration")}
                      {step === 1 && <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />}
                    </>
                  )}
                </button>
              </div>
            </main>
          </div>
        </div>

        <p className="mt-8 text-center text-sm font-bold text-slate-400 uppercase tracking-widest">
          Already a member? <Link href="/login" className="text-blue-600 hover:text-blue-700 transition-all ml-1 underline underline-offset-4">Log In</Link>
        </p>
      </div>
    </div>
  );
}
