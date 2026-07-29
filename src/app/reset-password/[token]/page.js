"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Lock, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token;

  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: formData.password }),
      });

      if (res.ok) {
        setSuccess(true);
      } else if (res.status === 429) {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || "Too many attempts. Please try again later.");
      } else {
        const errorText = await res.text();
        toast.error(errorText || "Reset failed. The link may have expired.");
        if (errorText.toLowerCase().includes("token") || errorText.toLowerCase().includes("expired")) {
          setInvalidToken(true);
        }
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
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
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Password Updated</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Your password has been reset successfully. You can now log in with your new password.
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
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Link Expired or Invalid</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            This password reset link has expired or is invalid. Reset links are only valid for 1 hour.
          </p>
          <Link
            href="/forgot-password"
            className="w-full h-12 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center justify-center"
          >
            Request a New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">


      <div className="w-full max-w-[480px]">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm mb-4">
            <Lock size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reset Password</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Enter your new password below</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                New Password
              </label>
              <div className="relative group">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
                  size={18}
                />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                Confirm Password
              </label>
              <div className="relative group">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
                  size={18}
                />
                <input
                  required
                  type={showConfirm ? "text" : "password"}
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-900"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-sm transition-all flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400"
            >
              {loading ? (
                <><Loader2 className="animate-spin" size={18} /> Updating...</>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
