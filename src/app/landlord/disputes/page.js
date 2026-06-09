import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  MessageSquareWarning,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  User,
  Home,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_STYLES = {
  OPEN:        { label: "Open",        bg: "bg-red-50",    text: "text-red-600",    border: "border-red-100",    dot: "bg-red-500" },
  IN_PROGRESS: { label: "In Progress", bg: "bg-amber-50",  text: "text-amber-600",  border: "border-amber-100",  dot: "bg-amber-400" },
  RESOLVED:    { label: "Resolved",    bg: "bg-green-50",  text: "text-green-600",  border: "border-green-100",  dot: "bg-green-500" },
  CANCELLED:   { label: "Cancelled",   bg: "bg-slate-50",  text: "text-slate-500",  border: "border-slate-100",  dot: "bg-slate-400" },
};

const CATEGORY_STYLES = {
  COMPLAINT: { label: "Complaint", bg: "bg-orange-50",  text: "text-orange-600", border: "border-orange-100" },
  DISPUTE:   { label: "Dispute",   bg: "bg-rose-50",    text: "text-rose-600",   border: "border-rose-100" },
};

export default async function LandlordDisputesPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    redirect("/login");
  }

  const statusFilter = searchParams?.status || "ALL";
  const categoryFilter = searchParams?.category || "ALL";

  // Build where clause
  const whereClause = {
    category: { in: ["COMPLAINT", "DISPUTE"] },
  };
  if (statusFilter !== "ALL") whereClause.status = statusFilter;
  if (categoryFilter !== "ALL") whereClause.category = categoryFilter;

  const [tickets, counts] = await Promise.all([
    prisma.maintenanceTicket.findMany({
      where: whereClause,
      include: {
        tenant: {
          include: {
            user: true,
            room: { include: { block: true } },
          },
        },
        provider: { include: { user: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.maintenanceTicket.groupBy({
      by: ["status"],
      where: { category: { in: ["COMPLAINT", "DISPUTE"] } },
      _count: true,
    }),
  ]);

  const totalComplaints = await prisma.maintenanceTicket.count({
    where: { category: "COMPLAINT" },
  });
  const totalDisputes = await prisma.maintenanceTicket.count({
    where: { category: "DISPUTE" },
  });
  const openCount   = counts.find(c => c.status === "OPEN")?._count        || 0;
  const pendingCount = counts.find(c => c.status === "IN_PROGRESS")?._count || 0;
  const resolvedCount = counts.find(c => c.status === "RESOLVED")?._count  || 0;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose-600 mb-2">
            <MessageSquareWarning size={20} />
            <span className="text-[11px] font-bold uppercase tracking-widest">Disputes & Complaints</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tenant Disputes</h1>
          <p className="text-slate-500 text-sm">Review, respond to, and resolve tenant-filed complaints and disputes.</p>
        </div>

        {/* Summary Chips */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-full text-xs font-bold">
            {openCount} Open
          </div>
          <div className="px-4 py-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-xs font-bold">
            {pendingCount} In Progress
          </div>
          <div className="px-4 py-2 bg-green-50 text-green-600 border border-green-100 rounded-full text-xs font-bold">
            {resolvedCount} Resolved
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[
          { label: "Total Complaints", value: totalComplaints, icon: AlertCircle,   color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Total Disputes",   value: totalDisputes,   icon: MessageSquareWarning, color: "text-rose-600",   bg: "bg-rose-50" },
          { label: "Open / Unresolved",value: openCount,       icon: Clock,         color: "text-red-600",    bg: "bg-red-50" },
          { label: "Resolved",         value: resolvedCount,   icon: CheckCircle2,  color: "text-green-600",  bg: "bg-green-50" },
        ].map(kpi => (
          <div key={kpi.label} className="relative bg-white rounded-[2rem] border border-slate-100/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${kpi.bg} opacity-60 group-hover:scale-150 transition-transform duration-700 blur-2xl`} />
            <div className="relative z-10">
              <div className={`p-3 ${kpi.bg} ${kpi.color} rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-white/50`}>
                <kpi.icon size={20} strokeWidth={2.5} />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</p>
              <p className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">Filter:</span>

        {/* Status filter */}
        {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CANCELLED"].map(s => (
          <Link
            key={s}
            href={`/landlord/disputes?status=${s}&category=${categoryFilter}`}
            className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
              statusFilter === s
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-800"
            }`}
          >
            {s === "ALL" ? "All Statuses" : s.replace("_", " ")}
          </Link>
        ))}

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Category filter */}
        {["ALL", "COMPLAINT", "DISPUTE"].map(c => (
          <Link
            key={c}
            href={`/landlord/disputes?status=${statusFilter}&category=${c}`}
            className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
              categoryFilter === c
                ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                : "bg-white text-slate-500 border-slate-200 hover:border-rose-300 hover:text-rose-600"
            }`}
          >
            {c === "ALL" ? "All Categories" : c}
          </Link>
        ))}
      </div>

      {/* Ticket List */}
      {tickets.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
            <CheckCircle2 size={28} className="text-green-400" />
          </div>
          <p className="text-base font-bold text-slate-700">No disputes found</p>
          <p className="text-sm text-slate-400 mt-1">No records match the current filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map(ticket => {
            const status  = STATUS_STYLES[ticket.status]  || STATUS_STYLES.OPEN;
            const category = CATEGORY_STYLES[ticket.category] || CATEGORY_STYLES.COMPLAINT;
            const tenant  = ticket.tenant;
            const room    = tenant?.room;
            const lastMsg = ticket.messages[0];
            const daysOpen = Math.ceil((new Date() - new Date(ticket.createdAt)) / (1000 * 60 * 60 * 24));

            return (
              <div
                key={ticket.id}
                className="bg-white rounded-[2rem] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 overflow-hidden group"
              >
                <div className="p-6 flex flex-col md:flex-row md:items-start gap-5">
                  {/* Left: Tenant avatar + meta */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg uppercase shrink-0 border border-slate-200 shadow-sm">
                      {(tenant?.user?.name || "T").charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <p className="text-sm font-bold text-slate-900">{tenant?.user?.name || "Unknown Tenant"}</p>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${category.bg} ${category.text} ${category.border}`}>
                          {category.label}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${status.bg} ${status.text} ${status.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </div>

                      {/* Room info */}
                      {room && (
                        <p className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 mb-2">
                          <Home size={11} />
                          Room {room.roomNumber}{room.block?.name ? ` · ${room.block.name}` : ""}
                        </p>
                      )}

                      {/* Issue description */}
                      <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                        {ticket.issueDescription}
                      </p>

                      {/* Last message preview */}
                      {lastMsg && (
                        <p className="text-[11px] text-slate-400 mt-2 italic line-clamp-1">
                          Last reply: "{lastMsg.content}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: meta + action */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-4 shrink-0 md:min-w-[140px]">
                    <div className="text-right">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Filed</p>
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">
                        {new Date(ticket.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <p className={`text-[10px] font-bold mt-1 ${daysOpen > 7 && ticket.status === "OPEN" ? "text-red-500" : "text-slate-400"}`}>
                        {daysOpen === 0 ? "Today" : `${daysOpen}d ago`}
                      </p>
                    </div>

                    <Link
                      href={`/landlord/maintenance?ticketId=${ticket.id}`}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors group-hover:bg-rose-600 shrink-0"
                    >
                      Respond <ArrowUpRight size={13} strokeWidth={3} />
                    </Link>
                  </div>
                </div>

                {/* Ticket ID footer */}
                <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Ticket #{ticket.id.slice(-8).toUpperCase()}
                  </p>
                  {ticket.provider && (
                    <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                      <User size={10} />
                      Assigned: {ticket.provider.user?.name || "Provider"}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
