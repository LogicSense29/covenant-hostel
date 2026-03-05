"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Users, Building2, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fafcff] font-sans selection:bg-blue-500/30 overflow-x-hidden relative">
      
      {/* Abstract Background Meshes */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-5%] w-[30%] h-[50%] bg-indigo-400/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
        
        {/* Navigation */}
        <nav className="flex items-center justify-between py-6 md:py-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
               <Building2 className="text-white" size={20} />
            </div>
            <span className="text-xl md:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">
              Covenant.
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-end">
            <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors px-3 py-2">
              Sign In
            </Link>
            <Link href="/register" className="text-sm font-semibold bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 transition-all hover:shadow-[0_8px_30px_rgb(15,23,42,0.15)] hover:-translate-y-0.5 active:translate-y-0">
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="pt-16 md:pt-24 pb-20 md:pb-32 text-center max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/80 backdrop-blur-md text-blue-600 font-bold text-xs tracking-wide uppercase mb-8 border border-blue-100/50 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <Zap size={14} className="fill-blue-600 inline" /> Redefining Student Living
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-black text-slate-900 tracking-tighter leading-[1.05] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            A Better Way to Manage <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600">
              Accommodations.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            Experience seamless booking, instant maintenance requests, and a vibrant community. The Covenant platform puts control completely back in your hands.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl transition-all shadow-[0_10px_40px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_15px_40px_-10px_rgba(37,99,235,0.7)] hover:-translate-y-1 active:translate-y-0 active:scale-95 flex items-center justify-center gap-2 group">
              Register Now
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 font-bold text-lg rounded-2xl transition-all border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] active:scale-95 flex items-center justify-center gap-2">
              Go to Dashboard
            </Link>
          </div>

          {/* Social Proof metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mt-20 md:mt-28 pt-10 border-t border-slate-200/50 w-full animate-in fade-in duration-1000 delay-700">
            <div className="flex flex-col items-center">
              <span className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">2.5k+</span>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">Happy Residents</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">99%</span>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">Satisfaction Rate</span>
            </div>
            <div className="col-span-2 md:col-span-1 flex flex-col items-center">
              <span className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">24/7</span>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">Support & Security</span>
            </div>
          </div>
        </main>

        {/* Bento Grid Features */}
        <section className="pb-20 md:pb-32 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-[800ms]">
          <div className="text-center mb-12 md:mb-16">
             <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">Everything you need, <br className="md:hidden" /><span className="text-blue-600">simplified.</span></h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            
            {/* Dark Card */}
            <div className="col-span-1 md:col-span-2 bg-slate-900 rounded-[2.5rem] p-10 md:p-12 relative overflow-hidden group shadow-2xl shadow-slate-900/10">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[80px] group-hover:bg-blue-500/30 transition-colors duration-700 translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md border border-white/10 shadow-inner inline-flex">
                <ShieldCheck className="text-blue-400" size={28} />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">Uncompromised Security</h3>
              <p className="text-slate-400 text-lg leading-relaxed max-w-md">Our state-of-the-art digital access control and 24/7 surveillance ensures you sleep with total peace of mind every single night.</p>
            </div>

            {/* Light Card 1 */}
            <div className="col-span-1 bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 inline-flex">
                <Users className="text-blue-600" size={28} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 tracking-tight">Vibrant Community</h3>
              <p className="text-slate-500 leading-relaxed font-medium">Connect with peers through organized events and designated social lounges tailored for you.</p>
            </div>

            {/* Light Card 2 */}
            <div className="col-span-1 bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
               <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-8 inline-flex">
                <Zap className="text-amber-500" size={28} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 tracking-tight">Instant Maintenance</h3>
              <p className="text-slate-500 leading-relaxed font-medium">Report issues with a tap. Our dedicated team tracks and resolves tickets in record time.</p>
            </div>

            {/* Call to Action Abstract Card */}
            <div className="col-span-1 md:col-span-2 rounded-[2.5rem] overflow-hidden relative min-h-[320px] bg-gradient-to-tr from-indigo-50 via-blue-50/50 to-white border border-blue-100/50 flex flex-col justify-center p-10 md:p-14 shadow-sm">
               <div className="absolute right-[-10%] bottom-[-20%] w-[60%] h-[120%] bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-[60px] pointer-events-none" />
               <div className="relative z-10 max-w-sm">
                 <h3 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">Ready to move in?</h3>
                 <p className="text-slate-600 mb-8 text-lg font-medium leading-relaxed">Join thousands of students who have already upgraded their living experience.</p>
                 <Link href="/register" className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-[0_8px_30px_rgb(15,23,42,0.2)] hover:shadow-[0_15px_30px_rgb(15,23,42,0.3)] hover:-translate-y-1 active:translate-y-0 active:scale-95 group">
                    Create your account <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                 </Link>
               </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
