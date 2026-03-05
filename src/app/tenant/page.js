import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  Home, 
  MapPin, 
  Calendar, 
  User, 
  ShieldCheck, 
  ShieldAlert,
  Mail, 
  Phone,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TenantDashboard() {
  const session = await getServerSession(authOptions);
  
  const profile = await prisma.tenantProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      room: true,
      user: true
    }
  });

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200 shadow-xl border-t-4 border-t-amber-500 animate-in fade-in duration-700">
        <div className="bg-amber-50 p-4 rounded-2xl mb-6">
          <AlertCircle size={48} className="text-amber-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 text-center">Profile Under Review</h1>
        <p className="text-slate-500 mt-4 text-center max-w-md leading-relaxed">
          Your profile is currently being reviewed by the administration. You will have full access to your portal once your room allocation is confirmed.
        </p>
        <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100 w-full max-w-sm text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
            <p className="text-sm font-bold text-amber-600 uppercase">Pending Approval</p>
        </div>
      </div>
    );
  }

  const { room, user } = profile;
  const isExpired = profile.rentExpiryDate && new Date(profile.rentExpiryDate) < new Date();

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Welcome, {user.name}</h1>
          <p className="text-slate-500 mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Profile Active • Tenant Portal
          </p>
        </div>
        <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="text-right">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rent Status</p>
             <p className={`text-sm font-bold ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
               {isExpired ? 'Expired' : 'Active'}
             </p>
           </div>
           <div className={`p-2 rounded-xl ${isExpired ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
             <ShieldCheck size={20} />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Room Info Card */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden group">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white relative">
              <div className="relative z-10">
                <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Your Allocation</p>
                <h2 className="text-6xl font-black mb-4 group-hover:scale-105 transition-transform origin-left duration-500">
                  {room ? `Room ${room.roomNumber}` : 'Not Allocated'}
                </h2>
                {room && (
                  <div className="flex items-center gap-4 text-blue-100/80 text-sm font-medium">
                    <span className="flex items-center gap-1"><MapPin size={16} /> Block A, Floor 2</span>
                    <span className="flex items-center gap-1"><Home size={16} /> Standard Single</span>
                  </div>
                )}
              </div>
              <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                 <Home size={120} strokeWidth={1} />
              </div>
            </div>
            
            <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rent Amount</p>
                <p className="text-lg font-bold text-slate-900">{room ? `$${room.rentAmount.toLocaleString()}` : 'N/A'}</p>
                <p className="text-[10px] text-slate-400">per annum</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entry Date</p>
                <p className="text-lg font-bold text-slate-900">{new Date(profile.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expiry Date</p>
                <p className={`text-lg font-bold ${isExpired ? 'text-red-600' : 'text-slate-900'}`}>
                  {profile.rentExpiryDate ? new Date(profile.rentExpiryDate).toLocaleDateString() : 'TBD'}
                </p>
              </div>
              <div className="flex items-center justify-end">
                <Link href="/tenant/payments" className="p-4 bg-slate-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                  <ArrowRight size={24} />
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl">
                   <ShieldCheck size={28} />
                </div>
                <div>
                   <p className="text-sm font-bold text-slate-900">Maintenance</p>
                   <p className="text-xs text-slate-500">Requests handled instantly</p>
                   <Link href="/tenant/maintenance" className="text-xs font-bold text-purple-600 hover:underline mt-2 inline-block">Report Issue</Link>
                </div>
             </div>
             <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl">
                   <ShieldAlert size={28} />
                </div>
                <div>
                   <p className="text-sm font-bold text-slate-900">Complaint Center</p>
                   <p className="text-xs text-slate-500">Report issues or grievances</p>
                   <Link href="/tenant/complaints" className="text-xs font-bold text-red-600 hover:underline mt-2 inline-block">File Complaint</Link>
                </div>
             </div>
          </div>
        </div>


        {/* Sidebar / Additional Info */}
        <div className="space-y-8">
           {/* Guarantor Info */}
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden border-t-4 border-t-indigo-500">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Guarantor Information</h3>
                <User size={18} className="text-slate-400" />
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                     G
                   </div>
                   <div>
                     <p className="text-sm font-bold text-slate-900">{profile.guarantorName}</p>
                     <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{profile.guarantorRelationship}</p>
                   </div>
                </div>
                <div className="space-y-2 pt-2">
                   <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Phone size={14} className="text-slate-400" />
                      {profile.guarantorPhone}
                   </div>
                   <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Mail size={14} className="text-slate-400" />
                      {profile.guarantorEmail}
                   </div>
                   <div className="flex items-start gap-2 text-xs text-slate-600 pt-1">
                      <MapPin size={14} className="text-slate-400 shrink-0" />
                      <span className="leading-relaxed">{profile.guarantorAddress}</span>
                   </div>
                </div>
              </div>
           </div>

           {/* Emergency Contact */}
           <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
             <div className="relative z-10">
               <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Emergency Support</h4>
               <p className="text-2xl font-black mb-2 tracking-tight">+234 (0) 800-CHMS-SOS</p>
               <p className="text-xs text-slate-400 leading-relaxed font-medium">Available 24/7 for urgent facility issues and emergency assistance.</p>
             </div>
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Phone size={64} />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
