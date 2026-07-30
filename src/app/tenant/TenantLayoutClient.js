"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  CreditCard, 
  Wrench, 
  LogOut,
  ClipboardCheck,
  Settings,
  ShieldAlert,
  Search,
  Headset
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

export default function TenantLayoutClient({ children, dbUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSupportMenu, setShowSupportMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (session.user.role !== "TENANT") {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  // Handle routing restriction if tenancy is not fully active
  useEffect(() => {
    if (dbUser && dbUser.status !== "ACTIVE") {
      if (pathname !== "/tenant" && !pathname.startsWith("/tenant/payments")) {
        router.push("/tenant");
      }
    }
  }, [dbUser, pathname, router]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-[#203090] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (session.user.role !== "TENANT") {
    return null;
  }

  let navigation = [
    { name: "Dashboard", href: "/tenant", icon: LayoutDashboard },
    { name: "Payments", href: "/tenant/payments", icon: CreditCard },
    { name: "Maintenance", href: "/tenant/maintenance", icon: Wrench },
    { name: "Complaints", href: "/tenant/complaints", icon: ShieldAlert },
    { name: "Inspections", href: "/tenant/inspections", icon: ClipboardCheck },
    { name: "Settings", href: "/tenant/settings", icon: Settings },
  ];

  if (dbUser && dbUser.status !== "ACTIVE") {
    navigation = navigation.filter(n => n.href === "/tenant" || n.href === "/tenant/payments");
  }

  const mobileNavigation = (dbUser && dbUser.status !== "ACTIVE") 
    ? navigation 
    : [
        { name: "Dashboard", href: "/tenant", icon: LayoutDashboard },
        { name: "Payments", href: "/tenant/payments", icon: CreditCard },
        { name: "Support", isMenu: true, icon: Headset },
        { name: "Inspections", href: "/tenant/inspections", icon: ClipboardCheck },
        { name: "Settings", href: "/tenant/settings", icon: Settings },
      ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-500/20 relative ">
      
      {/* Soft Light Background Effects */}
      {/* <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-100/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-[150px] pointer-events-none" /> */}

      {/* Left Sidebar Navigation (Desktop) */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen px-4 flex-col items-center py-3 z-50 bg-white/70 backdrop-blur-xl border-r border-slate-200">
        <div className="flex flex-col items-center gap-8">
          {/* Logo Area */}
          <Link href="/tenant" className="group mb-2">
             <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#203090] to-[#1a2673] flex items-center justify-center shadow-md shadow-[#203090]/30 group-hover:shadow-xl group-hover:shadow-[#203090]/40 transition-all duration-300 group-hover:scale-110 border border-[#1a2673]/50">
               <img src="/convenant-hostel-logo.png" alt="Covenant Hostel" className="w-6 h-6 object-contain brightness-0 invert drop-shadow-md" />
             </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="flex flex-col items-center gap-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative p-3 rounded-full flex items-center justify-center transition-all duration-300 group ${
                    isActive 
                    ? "bg-[#203090] text-white" 
                    : "text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                  }`}
                  title={item.name}
                >
                  <Icon size={24} strokeWidth={isActive ? 2 : 2} />
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Top Header (Desktop L-Shape) */}
      <header className={`hidden lg:flex fixed top-0 left-20 right-0 items-center justify-between px-8 py-2 z-40 transition-all duration-300 ${isScrolled ? 'bg-white border-b border-slate-200' : 'bg-white border-b border-slate-200'}`}>
        
        {/* Desktop Greeting */}
        <div className="flex-1 animate-in fade-in slide-in-from-left-8 duration-1000 mt-0">
           {/* Desktop Search Box */}
           <div className="hidden md:flex items-center gap-2 bg-slate-200/50 hover:bg-slate-200/80 focus-within:bg-white focus-within:shadow-sm focus-within:ring-1 focus-within:ring-slate-200 transition-all rounded-full pl-5 pr-4 h-10 w-64 cursor-text">
              <input 
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none w-full text-sm text-slate-700 placeholder:text-slate-500"
              />
              <div className="p-1 rounded-full hover:bg-slate-200/50 transition-colors cursor-pointer text-slate-400 hover:text-indigo-600">
                 <Search size={18} strokeWidth={2.5} />
              </div>
           </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 ml-8 mt-0">

           {/* Mobile Search Icon */}
           <div className="md:hidden w-12 h-12 flex items-center justify-center bg-white/60 hover:bg-white/90 transition-all rounded-full cursor-pointer text-slate-600 hover:text-indigo-600">
              <Search size={22} strokeWidth={2} />
           </div>

           <div className="w-12 h-12 flex items-center justify-center bg-white/60 hover:bg-white/90 transition-all rounded-full cursor-pointer text-slate-600 hover:text-indigo-600 relative [&>div>button]:hover:bg-transparent [&>div>button]:text-inherit">
              <NotificationBell />
           </div>
           
           <div className="flex items-center gap-3 cursor-pointer group hover:opacity-80 transition-opacity" title={session?.user?.name || "Profile"}>
             <span className="text-sm font-medium text-slate-700">{session?.user?.name || "Tenant"}</span>
             <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#203090] to-[#1a2673] flex items-center justify-center text-white font-bold text-md group-hover:scale-105 transition-transform overflow-hidden border border-slate-200">
               <img 
                 src={`https://api.dicebear.com/9.x/shapes/svg?seed=${session?.user?.name || "Tenant"}`} 
                 alt="Profile Avatar" 
                 className="w-full h-full object-cover"
               />
             </div>
           </div>
           
           <button onClick={() => signOut()} className="w-12 h-12 flex items-center justify-center rounded-full text-slate-600 hover:bg-rose-50 hover:text-rose-500 transition-all bg-white/60 hover:bg-white/90" title="Sign Out">
              <LogOut size={22} />
           </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto pt-8 lg:pt-28 pb-28 md:pb-12 px-4 md:px-8 lg:pl-32 relative z-10">
        {/* Top Header for Mobile only, Desktop uses Sidebar */}
        <header className="lg:hidden sticky top-4 z-40 flex items-center justify-between mb-8 bg-white/80 backdrop-blur-xl border border-white rounded-full px-4 py-2 shadow-sm">
          <Link href="/tenant" className="flex items-center gap-3 ml-2 group">
             <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#203090] to-[#1a2673] flex items-center justify-center shadow-md">
               <img src="/convenant-hostel-logo.png" alt="Covenant Hostel" className="w-6 h-6 object-contain brightness-0 invert" />
             </div>
             <span className="font-bold text-slate-800 tracking-wide hidden sm:block">Covenant</span>
          </Link>
          <div className="flex items-center gap-3">
             <div className="bg-slate-50 rounded-full cursor-pointer text-slate-500">
                <NotificationBell />
             </div>
             {/* <div className="flex items-center gap-3 bg-slate-50 pr-1.5 pl-4 py-1.5 rounded-full border border-slate-200"> */}
             <div className=" ">
               <span className="text-sm font-medium text-slate-700 hidden sm:block">{session?.user?.name || "Tenant"}</span>
               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#203090] to-[#1a2673] flex items-center justify-center text-white font-bold text-xs overflow-hidden">
                 <img 
                   src={`https://api.dicebear.com/9.x/shapes/svg?seed=${session?.user?.name || "Tenant"}`} 
                   alt="Profile Avatar" 
                   className="w-full h-full object-cover"
                 />
               </div>
             </div>
          </div>
        </header>

        {children}
      </main>

      {/* Mobile Bottom Dock (iOS Style) */}
      <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50 flex justify-center">
        
        {/* Expandable Support Menu Popup */}
        {showSupportMenu && (
          <div className="absolute bottom-[110%] bg-white text-slate-800 rounded-2xl p-2 shadow-[0_10px_40px_rgb(0,0,0,0.1)] border border-slate-100 flex flex-col gap-1 animate-in slide-in-from-bottom-2 fade-in duration-200 min-w-[160px]">
            <Link 
              href="/tenant/maintenance"
              onClick={() => setShowSupportMenu(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 hover:text-[#203090] transition-colors"
            >
              <Wrench size={18} className="text-[#203090]" />
              <span className="text-sm font-bold">Maintenance</span>
            </Link>
            <Link 
              href="/tenant/complaints"
              onClick={() => setShowSupportMenu(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 hover:text-[#203090] transition-colors"
            >
              <ShieldAlert size={18} className="text-rose-500" />
              <span className="text-sm font-bold">Complaints</span>
            </Link>
          </div>
        )}

        <nav className="bg-white backdrop-blur-2xl border border-white p-2 rounded-full shadow-[0_10px_40px_rgb(0,0,0,0.1)] flex items-center gap-1 sm:gap-2 relative">
          {mobileNavigation.map((item) => {
            const Icon = item.icon;
            
            if (item.isMenu) {
              const isActive = pathname === "/tenant/maintenance" || pathname === "/tenant/complaints";
              return (
                <button
                  key={item.name}
                  onClick={() => setShowSupportMenu(!showSupportMenu)}
                  className={`relative p-3 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive || showSupportMenu
                    ? "bg-slate-900 text-white shadow-md" 
                    : "text-slate-400 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive || showSupportMenu ? 2.5 : 2} />
                </button>
              );
            }

            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setShowSupportMenu(false)}
                className={`relative p-3 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive 
                  ? "bg-primary text-white shadow-md" 
                  : "text-slate-400 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </Link>
            );
          })}
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <button 
            onClick={() => signOut()} 
            className="p-3 rounded-full text-rose-500 hover:bg-rose-50 transition-colors flex items-center justify-center"
          >
            <LogOut size={20} />
          </button>
        </nav>
      </div>

    </div>
  );
}
