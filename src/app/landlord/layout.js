"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";
import { 
  LayoutDashboard, 
  Home, 
  Users, 
  CreditCard, 
  Wrench, 
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  ClipboardCheck,
  Settings,
  Globe,
  Database,
  Briefcase
} from "lucide-react";


import { useState } from "react";

export default function LandlordLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/login");
      return;
    }

    if (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN") {
    return null;
  }

  const navigation = [
    { name: "Dashboard", href: "/landlord", icon: LayoutDashboard },
    { name: "Room Management", href: "/landlord/rooms", icon: Home },
    { name: "Tenant Directory", href: "/landlord/tenants", icon: Users },
    { name: "Billing & Rules", href: "/landlord/billing", icon: CreditCard },
    { name: "Maintenance", href: "/landlord/maintenance", icon: Wrench },
    // { name: "Service Providers", href: "/landlord/maintenance/providers", icon: Users },
    { name: "Inspections", href: "/landlord/inspections", icon: ClipboardCheck },
    { name: "Settings", href: "/landlord/settings", icon: Settings },
  ];

  const adminNavigation = [
    { name: "Manage Landlords", href: "/admin/landlords", icon: Briefcase },
    { name: "System Settings", href: "/admin/settings", icon: Settings },
    { name: "Database Logs", href: "/admin/logs", icon: Database },
  ];


  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 bg-white border-r border-slate-200 w-72 transition-transform duration-300 z-50 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center px-8 border-b border-slate-100">
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            CHMS Portal
          </span>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="text-slate-400" />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-160px)]">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all group ${
                  isActive 
                  ? "bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/10" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={20} className={isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"} />
                {item.name}
              </Link>
            );
          })}

          {/* {session?.user?.role === "ADMIN" && (
            <div className="pt-6">
              <p className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Admin Tools</p>
              {adminNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all group ${
                      isActive 
                      ? "bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/10" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={20} className={isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          )} */}
        </nav>



        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100 bg-white">
          <button 
            onClick={() => signOut()} 
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pl-72 min-h-screen">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              className="p-2 -ml-2 lg:hidden text-slate-500 hover:bg-slate-50 rounded-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center gap-2 bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200 w-80 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white transition-all">
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none outline-none text-sm text-slate-900 w-full placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-white"></span>
            </button>

            <div className="h-8 w-px bg-slate-200" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">{session?.user?.name || (session?.user?.role === "ADMIN" ? "Admin" : "Landlord")}</p>
                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  {session?.user?.role === "ADMIN" ? "Super Administrator" : "Property Owner"}
                </p>
              </div>

              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                {session?.user?.name?.[0]?.toUpperCase() || "L"}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
