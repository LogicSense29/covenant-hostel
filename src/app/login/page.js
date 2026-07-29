"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      // Show specific messages for lockout and account-status errors
      // For generic wrong-password errors keep it vague (security best practice)
      if (res.error.toLowerCase().includes("too many")) {
        setError(res.error);
      } else if (res.error.toLowerCase().includes("pending") || res.error.toLowerCase().includes("activation")) {
        setError("Your account is pending approval or activation. Check your email for next steps.");
      } else {
        setError("Invalid email or password");
      }
      setLoading(false);
    } else {
      router.push("/dashboard"); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-[480px]">
        <div className="text-center mb-8">
                    <Link href="/" className="flex flex-col items-center gap-2 group shrink-0">
                         <img src="/convenant-hostel-logo.png" alt="Covenant Hostel" className="w-12 h-12 object-contain drop-shadow-md" />
  
                      {/* <span className="text-lg font-bold text-[#102a43] tracking-tight hidden sm:block">Covenant Hostel</span> */}
                    </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Sign in to your CHMS account</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 md:p-8">
            {error && (
              <div className="text-red-600 text-sm mb-5 text-center bg-red-50 p-3 rounded-xl border border-red-200 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                <input
                  id="email"
                  type="email"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                  <Link href="/forgot-password" className="text-xs font-semibold text-blue-500 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full h-12 bg-primary text-white rounded-xl font-bold text-sm hover:bg-blue-700 active:translate-y-px disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-sm transition-all mt-2"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>

        {/* <p className="mt-8 text-center text-sm font-bold text-slate-400 uppercase tracking-widest">
          Don't have an account? <Link href="/register" className="text-blue-600 hover:text-blue-700 transition-all ml-1 underline underline-offset-4">Register here</Link>
        </p> */}
      </div>
    </div>
  );
}
