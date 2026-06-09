import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  TrendingUp, Home, Users, CreditCard, AlertCircle,
  CheckCircle2, Clock, ArrowUpRight, BarChart3, PieChart,
  Activity, Wrench, Calendar
} from "lucide-react";
import Link from "next/link";
import RevenueChart from "@/components/RevenueChart";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    redirect("/login");
  }

  // ── Rooms & Occupancy ──
  const rooms = await prisma.room.findMany({
    include: { tenants: true, block: true },
  });

  const totalRooms = rooms.length;
  const totalCapacity = rooms.reduce((s, r) => s + r.capacity, 0);
  const totalOccupants = rooms.reduce((s, r) => s + r.tenants.length, 0);
  const occupiedRooms = rooms.filter(r => r.tenants.length > 0).length;
  const vacantRooms = rooms.filter(r => r.tenants.length < r.capacity && r.status !== "UNDER_MAINTENANCE").length;
  const maintenanceRooms = rooms.filter(r => r.status === "UNDER_MAINTENANCE").length;
  const occupancyRate = totalCapacity > 0 ? (totalOccupants / totalCapacity) * 100 : 0;

  // Occupancy by block
  const blockMap = {};
  for (const room of rooms) {
    const key = room.block?.name || "Unassigned";
    if (!blockMap[key]) blockMap[key] = { capacity: 0, occupants: 0, rooms: 0 };
    blockMap[key].capacity += room.capacity;
    blockMap[key].occupants += room.tenants.length;
    blockMap[key].rooms += 1;
  }
  const blockStats = Object.entries(blockMap).map(([name, data]) => ({
    name,
    ...data,
    rate: data.capacity > 0 ? (data.occupants / data.capacity) * 100 : 0,
  })).sort((a, b) => b.rate - a.rate);

  // ── Tenants ──
  const tenantStatusCounts = await prisma.user.groupBy({
    by: ["status"],
    where: { role: "TENANT" },
    _count: true,
  });
  const statusMap = Object.fromEntries(tenantStatusCounts.map(s => [s.status, s._count]));
  const totalTenants = Object.values(statusMap).reduce((s, v) => s + v, 0);

  // Expiring tenancies in next 30 days
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  const expiringCount = await prisma.tenantProfile.count({
    where: {
      rentExpiryDate: { gte: new Date(), lte: in30Days },
      user: { status: "ACTIVE" },
    },
  });

  // ── Payments ──
  const [verifiedPayments, pendingPayments, allPayments] = await Promise.all([
    prisma.payment.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { status: { in: ["SUCCESS", "VERIFIED"] } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { status: "PENDING" },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { amount: true, status: true, createdAt: true, paymentType: true },
    }),
  ]);

  // Monthly revenue — last 6 months
  const now = new Date();
  const monthlyRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const label = start.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
    const total = allPayments
      .filter(p =>
        (p.status === "SUCCESS" || p.status === "VERIFIED") &&
        new Date(p.createdAt) >= start &&
        new Date(p.createdAt) <= end
      )
      .reduce((s, p) => s + p.amount, 0);
    monthlyRevenue.push({ label, total });
  }
  const maxMonthly = Math.max(...monthlyRevenue.map(m => m.total), 1);

  // Payment type breakdown
  const fullPayments = allPayments.filter(p => p.paymentType === "FULL" && (p.status === "SUCCESS" || p.status === "VERIFIED"));
  const partialPayments = allPayments.filter(p => p.paymentType === "PARTIAL" && (p.status === "SUCCESS" || p.status === "VERIFIED"));
  const recurringPayments = allPayments.filter(p => p.paymentType === "RECURRING" && (p.status === "SUCCESS" || p.status === "VERIFIED"));

  // ── Maintenance ──
  const [ticketsByStatus, recentTickets] = await Promise.all([
    prisma.maintenanceTicket.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.maintenanceTicket.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { tenant: { include: { user: true, room: true } } },
    }),
  ]);
  const ticketStatusMap = Object.fromEntries(ticketsByStatus.map(t => [t.status, t._count]));
  const totalTickets = Object.values(ticketStatusMap).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Analytics</h1>
          <p className="text-slate-500">Operational overview.</p>
        </div>
        <Link
          href="/landlord"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Top KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            label: "Occupancy Rate",
            value: `${occupancyRate.toFixed(1)}%`,
            sub: `${totalOccupants} of ${totalCapacity} beds`,
            icon: BarChart3,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Total Revenue",
            value: `₦${(verifiedPayments._sum.amount || 0).toLocaleString()}`,
            sub: `${verifiedPayments._count} confirmed payments`,
            icon: CreditCard,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Active Tenants",
            value: statusMap["ACTIVE"] || 0,
            sub: `${expiringCount} expiring in 30 days`,
            icon: Users,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "Pending Approvals",
            value: (pendingPayments._count || 0) + (statusMap["PAYMENT_MADE"] || 0),
            sub: `${pendingPayments._count || 0} payments · ${statusMap["PAYMENT_MADE"] || 0} activations`,
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map(kpi => (
          <div key={kpi.label} className="relative bg-white rounded-[2rem] border border-slate-100/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${kpi.bg} opacity-60 group-hover:scale-150 transition-transform duration-700 ease-in-out blur-2xl`}></div>
            <div className="relative z-10">
              <div className={`p-3 ${kpi.bg} ${kpi.color} rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-white/50`}>
                <kpi.icon size={22} strokeWidth={2.5} />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</p>
              <p className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">{kpi.value}</p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Expiring Tenancies */}
        <div className="bg-white rounded-[2rem] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300 h-full flex flex-col">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center border border-white shadow-sm">
                <Calendar size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Expiring Soon</h2>
                <p className="text-xs text-slate-500 font-medium">Within the next 30 days</p>
              </div>
            </div>
            <Link href="/landlord/tenants" className="text-[13px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1.5 bg-orange-50/50 px-3 py-1.5 rounded-full transition-colors hover:bg-orange-100/50 border border-orange-100/50">
              View All <ArrowUpRight size={14} strokeWidth={3} />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ExpiringTenancies />
          </div>
        </div>

        {/* Monthly Revenue Bar Chart */}
        <div className="bg-white rounded-[2rem] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300 h-full flex flex-col">
          <div className="p-6 border-b border-slate-50 flex items-center gap-4 bg-slate-50/50">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-white shadow-sm">
              <Activity size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Monthly Revenue</h2>
              <p className="text-xs text-slate-500 font-medium">Last 6 months — confirmed payments</p>
            </div>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-end">
            <RevenueChart data={monthlyRevenue} />
          </div>
        </div>

        {/* Tenant Status Breakdown */}
        <div className="bg-white rounded-[2rem] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300 h-full flex flex-col">
          <div className="p-6 border-b border-slate-50 flex items-center gap-4 bg-slate-50/50">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center border border-white shadow-sm">
              <Users size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Tenant Status</h2>
              <p className="text-xs text-slate-500 font-medium">{totalTenants} total tenants</p>
            </div>
          </div>
          <div className="p-6 space-y-4 flex-1 flex flex-col justify-center">
            {[
              { key: "ACTIVE", label: "Active", color: "bg-green-500", text: "text-green-700", bg: "bg-green-50", border: "border-green-100/50" },
              { key: "AWAITING_PAYMENT", label: "Awaiting Payment", color: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-100/50" },
              { key: "PAYMENT_MADE", label: "Payment Under Review", color: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-100/50" },
              { key: "PENDING", label: "Pending Approval", color: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-50", border: "border-slate-100/50" },
              { key: "EXPIRED", label: "Expired", color: "bg-red-400", text: "text-red-700", bg: "bg-red-50", border: "border-red-100/50" },
              { key: "REJECTED", label: "Rejected", color: "bg-rose-400", text: "text-rose-700", bg: "bg-rose-50", border: "border-rose-100/50" },
            ].map(s => {
              const count = statusMap[s.key] || 0;
              const pct = totalTenants > 0 ? (count / totalTenants) * 100 : 0;
              return (
                <div key={s.key} className="flex items-center gap-4 group">
                  <span className={`text-[11px] font-bold px-3 py-1.5 rounded-xl ${s.bg} ${s.text} border ${s.border} w-44 shrink-0 transition-colors`}>
                    {s.label}
                  </span>
                  <div className="flex-1 bg-slate-50 rounded-full h-3 shadow-inner overflow-hidden">
                    <div className={`h-full rounded-full ${s.color} transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-black text-slate-900 w-8 text-right tabular-nums">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Room Status + Payment Types Stacked */}
        <div className="flex flex-col gap-6 lg:gap-8 h-full">
          {/* Room Status */}
          <div className="bg-white rounded-[2rem] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300 flex-1 flex flex-col">
            <div className="p-6 border-b border-slate-50 flex items-center gap-4 bg-slate-50/50">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-white shadow-sm">
                <Home size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Room Status</h2>
                <p className="text-xs text-slate-500 font-medium">Real-time room availability</p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 flex-1">
              {[
                { label: "Occupied", value: occupiedRooms, color: "text-green-600", bg: "bg-green-50", border: "border-green-100/50" },
                { label: "Vacant", value: vacantRooms, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100/50" },
                { label: "Maintenance", value: maintenanceRooms, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100/50" },
                { label: "Total Rooms", value: totalRooms, color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-100/50" },
              ].map(s => (
                <div key={s.label} className={`${s.bg} border ${s.border} rounded-[1.5rem] p-5 transition-transform duration-300 hover:scale-[1.02] hover:shadow-sm flex flex-col justify-center`}>
                  <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Type Breakdown */}
          <div className="bg-white rounded-[2rem] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300 flex-1 flex flex-col">
            <div className="p-6 border-b border-slate-50 flex items-center gap-4 bg-slate-50/50">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-white shadow-sm">
                <CreditCard size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Payment Types</h2>
                <p className="text-xs text-slate-500 font-medium">Confirmed transaction breakdown</p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-3 gap-3 flex-1">
              {[
                { label: "Full", count: fullPayments.length, amount: fullPayments.reduce((s, p) => s + p.amount, 0), color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100/50" },
                { label: "Install", count: partialPayments.length, amount: partialPayments.reduce((s, p) => s + p.amount, 0), color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100/50" },
                { label: "Recur", count: recurringPayments.length, amount: recurringPayments.reduce((s, p) => s + p.amount, 0), color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100/50" },
              ].map(t => (
                <div key={t.label} className={`${t.bg} border ${t.border} rounded-[1.25rem] p-4 flex flex-col justify-center transition-transform duration-300 hover:scale-[1.02] hover:shadow-sm`}>
                  <p className={`text-2xl font-black ${t.color} leading-none`}>{t.count}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{t.label}</p>
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5">₦{(t.amount / 1000).toFixed(0)}k</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Maintenance Ticket Status */}
        <div className="bg-white rounded-[2rem] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300 h-full flex flex-col">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-white shadow-sm">
                <Wrench size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Maintenance Tickets</h2>
                <p className="text-xs text-slate-500 font-medium">{totalTickets} total recorded</p>
              </div>
            </div>
            <Link href="/landlord/maintenance" className="text-[13px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1.5 bg-purple-50/50 px-3 py-1.5 rounded-full transition-colors hover:bg-purple-100/50 border border-purple-100/50">
              View All <ArrowUpRight size={14} strokeWidth={3} />
            </Link>
          </div>
          <div className="p-6 space-y-4 flex-1 flex flex-col justify-center">
            {[
              { key: "OPEN", label: "Open", color: "bg-red-500", text: "text-red-700", bg: "bg-red-50", border: "border-red-100/50" },
              { key: "IN_PROGRESS", label: "In Progress", color: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-100/50" },
              { key: "RESOLVED", label: "Resolved", color: "bg-green-500", text: "text-green-700", bg: "bg-green-50", border: "border-green-100/50" },
              { key: "CANCELLED", label: "Cancelled", color: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-50", border: "border-slate-100/50" },
            ].map(s => {
              const count = ticketStatusMap[s.key] || 0;
              const pct = totalTickets > 0 ? (count / totalTickets) * 100 : 0;
              return (
                <div key={s.key} className="flex items-center gap-4 group">
                  <span className={`text-[11px] font-bold px-3 py-1.5 rounded-xl ${s.bg} ${s.text} border ${s.border} w-32 shrink-0 transition-colors`}>
                    {s.label}
                  </span>
                  <div className="flex-1 bg-slate-50 rounded-full h-3 shadow-inner overflow-hidden">
                    <div className={`h-full rounded-full ${s.color} transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-black text-slate-900 w-8 text-right tabular-nums">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Occupancy by Block */}
        <div className="bg-white rounded-[2rem] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300 h-full flex flex-col">
          <div className="p-6 border-b border-slate-50 flex items-center gap-4 bg-slate-50/50">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-white shadow-sm">
              <Home size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Occupancy by Block</h2>
              <p className="text-xs text-slate-500 font-medium">Beds filled vs total capacity</p>
            </div>
          </div>
          <div className="p-6 space-y-6 flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
            {blockStats.length === 0 ? (
              <p className="text-sm font-semibold text-slate-400 text-center py-8">No blocks configured yet.</p>
            ) : (
              blockStats.map(block => (
                <div key={block.name} className="group">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-sm font-bold text-slate-800">{block.name}</span>
                      <span className="text-xs font-semibold text-slate-400 ml-2">{block.rooms} room{block.rooms !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900">{block.rate.toFixed(0)}%</span>
                      <span className="text-xs font-semibold text-slate-400 ml-1">{block.occupants}/{block.capacity}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-50 rounded-full h-3 shadow-inner overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden ${
                        block.rate >= 90 ? "bg-green-500" :
                        block.rate >= 60 ? "bg-blue-500" :
                        block.rate >= 30 ? "bg-amber-400" : "bg-red-400"
                      }`}
                      style={{ width: `${block.rate}%` }}
                    >
                      <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Separate async component for expiring tenancies to keep the main query clean
async function ExpiringTenancies() {
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);

  const expiring = await prisma.tenantProfile.findMany({
    where: {
      rentExpiryDate: { gte: new Date(), lte: in30Days },
      user: { status: "ACTIVE" },
    },
    include: { user: true, room: { include: { block: true } } },
    orderBy: { rentExpiryDate: "asc" },
    take: 8,
  });

  if (expiring.length === 0) {
    return (
      <div className="p-12 text-center">
        <CheckCircle2 size={28} className="text-green-300 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-400">No tenancies expiring in the next 30 days.</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1">
      {expiring.map(profile => {
        const daysLeft = Math.ceil((new Date(profile.rentExpiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return (
          <div key={profile.id} className="px-5 py-3.5 rounded-[1rem] flex items-center justify-between hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm uppercase shrink-0">
                {(profile.user.name || "U").charAt(0)}
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900">{profile.user.name}</p>
                <p className="text-[11px] font-semibold text-slate-400">
                  Room {profile.room?.roomNumber || "—"}
                  {profile.room?.block?.name ? ` · ${profile.room.block.name}` : ""}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                daysLeft <= 7
                  ? "bg-red-50 text-red-600 border-red-100"
                  : daysLeft <= 14
                  ? "bg-amber-50 text-amber-600 border-amber-100"
                  : "bg-blue-50 text-blue-600 border-blue-100"
              }`}>
                {daysLeft}d left
              </span>
              <p className="text-[10px] font-medium text-slate-400 mt-1">
                {new Date(profile.rentExpiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
