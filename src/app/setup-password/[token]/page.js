"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ShieldCheck, 
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import Link from "next/link";

export default function SetupPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token;

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    if (formData.password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/setup-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        toast.success("Account activated!");
      } else {
        const errorText = await res.text();
        toast.error(errorText || "Activation failed");
        if (errorText.includes("token")) {
           setInvalidToken(true);
        }
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-[480px] bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
           <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 mb-6 mx-auto">
              <CheckCircle2 size={32} />
           </div>
           <h2 className="text-2xl font-bold text-slate-900 mb-3">Account Active!</h2>
           <p className="text-slate-500 mb-8 leading-relaxed">
             Your password has been set and your account is now active. You can now log in to the portal.
           </p>
           <button 
             onClick={() => router.push("/login")}
             className="w-full h-12 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all"
           >
             Log In Now
           </button>
        </div>
      </div>
    );
  }

  if (invalidToken) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-[480px] bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
           <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 mb-6 mx-auto">
              <AlertCircle size={32} />
           </div>
           <h2 className="text-2xl font-bold text-slate-900 mb-3">Invalid or Expired Link</h2>
           <p className="text-slate-500 mb-8 leading-relaxed">
             This activation link is either invalid or has already expired. Please contact support or your landlord.
           </p>
           <button 
             onClick={() => router.push("/")}
             className="w-full h-12 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
           >
             Return Home
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      <Toaster position="top-center" />
      
      <div className="w-full max-w-[480px]">
        <div className="text-center mb-8">
           <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm mb-4">
              <ShieldCheck size={24} />
           </div>
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Set Your Password</h1>
           <p className="text-sm text-slate-500 mt-1 font-medium">Activate your Covenant Hostel account</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">New Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input 
                  required 
                  type="password" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900" 
                  placeholder="Minimum 6 characters" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Confirm Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input 
                  required 
                  type="password" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900" 
                  placeholder="Re-enter password" 
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-sm transition-all flex items-center justify-center gap-2 group disabled:bg-slate-200 disabled:text-slate-400"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : "Activate Account"}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400 font-medium">
          Having trouble? Contact support@covenanthostel.com
        </p>
      </div>
    </div>
  );
}
