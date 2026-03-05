"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard"); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-5 font-sans">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-10 w-full max-w-md shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-3xl font-bold text-slate-900 text-center mb-2">Welcome Back</h1>
        <p className="text-slate-500 text-center mb-8 text-sm">Sign in to your CHMS account</p>

        {error && (
          <div className="text-red-600 text-sm mb-5 text-center bg-red-50 p-3 rounded-lg border border-red-200 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
            <input
              id="email"
              type="email"
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-900 bg-slate-50 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <input
              id="password"
              type="password"
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-900 bg-slate-50 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            className="w-full py-3.5 bg-blue-600 text-white rounded-lg text-base font-semibold hover:bg-blue-700 active:translate-y-px disabled:bg-blue-300 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 transition-all mt-2"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* <p className="mt-8 text-center text-sm text-slate-500">
          Don't have an account? <Link href="/register" className="text-blue-600 font-semibold hover:underline">Register here</Link>
        </p> */}
      </div>
    </div>
  );
}
