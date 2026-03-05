import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AlertCircle, ArrowLeft, MessageSquare, Send, Clock, ShieldAlert } from "lucide-react";
import Link from "next/link";
import ComplaintForm from "./ComplaintForm";

export const dynamic = "force-dynamic";

export default async function TenantComplaintsPage() {
  const session = await getServerSession(authOptions);
  
  const profile = await prisma.tenantProfile.findUnique({
    where: { userId: session.user.id }
  });

  if (!profile || !profile.roomId) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200 shadow-xl border-t-4 border-t-red-500 animate-in fade-in duration-700">
        <div className="bg-red-50 p-4 rounded-2xl mb-6">
          <AlertCircle size={48} className="text-red-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 text-center">Service Unavailable</h1>
        <p className="text-slate-500 mt-4 text-center max-w-md leading-relaxed">
          The complaint center is only available to tenants with an active room allocation.
        </p>
      </div>
    );
  }

  const complaints = await prisma.maintenanceTicket.findMany({
    where: { 
      tenantId: profile.id,
      category: "COMPLAINT"
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link href="/tenant" className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors mb-4 uppercase tracking-widest">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Complaint Center</h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">Report non-facility issues, noise complaints, or general disputes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Form Column */}
        <div className="lg:col-span-1">
          <ComplaintForm />
        </div>

        {/* History Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden flex flex-col">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Your Complaints</h2>
                <p className="text-xs text-slate-500 mt-1 font-medium italic">Track the status of your reported grievances.</p>
              </div>
              <div className="bg-red-50 px-4 py-2 rounded-2xl border border-red-100">
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Official Record</span>
              </div>
            </div>
            
            <div className="divide-y divide-slate-100">
              {complaints.length === 0 ? (
                <div className="p-24 text-center text-slate-300">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert size={40} className="opacity-10" />
                  </div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No complaints recorded</p>
                  <p className="text-xs text-slate-400 mt-2 font-medium">Use the form on the left if you have an issue to report.</p>
                </div>
              ) : (
                complaints.map((ticket) => (
                  <div key={ticket.id} className="p-10 hover:bg-slate-50 transition-all group relative overflow-hidden">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xs shadow-sm ${
                          ticket.status === "OPEN" ? "bg-amber-50 text-amber-600" :
                          ticket.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-600" :
                          "bg-green-50 text-green-600"
                        }`}>
                          #{ticket.id.slice(-4).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {ticket.issueDescription.slice(0, 50)}...
                          </h3>
                          <div className="flex items-center gap-3 mt-2">
                             <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                                <Clock size={12} className="text-blue-500" /> {new Date(ticket.createdAt).toLocaleDateString()}
                             </span>
                          </div>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-sm ${
                        ticket.status === "OPEN" ? "bg-amber-600 text-white shadow-amber-500/20" :
                        ticket.status === "IN_PROGRESS" ? "bg-blue-600 text-white shadow-blue-500/20" :
                        "bg-green-600 text-white shadow-green-500/20"
                      }`}>
                        {ticket.status.replace("_", " ")}
                      </span>
                    </div>
                    
                    <p className="text-base text-slate-600 leading-relaxed bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group-hover:shadow-md transition-shadow">
                      {ticket.issueDescription}
                    </p>

                    <div className="mt-8 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waiting for Response</span>
                       </div>
                       <button className="text-[11px] font-black text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                          View Activity Center
                       </button>
                    </div>
                    <div className="absolute top-0 right-0 p-10 bg-blue-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
