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
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full w-fit">
            <TrendingUp size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Property Intelligence</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Analytics</h1>
          <p className="text-slate-500">Occupancy, revenue, and operational overview.</p>
        </div>
        <Link
          href="/landlord"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Top KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div key={kpi.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className={`p-2.5 ${kpi.bg} ${kpi.color} rounded-xl w-fit mb-3`}>
              <kpi.icon size={20} />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{kpi.value}</p>
            <p className="text-xs text-slate-400 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Monthly Revenue Bar Chart */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/20">
            <Activity size={20} className="text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Monthly Revenue</h2>
              <p className="text-xs text-slate-400">Last 6 months — confirmed payments only</p>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-end gap-3 h-40">
              {monthlyRevenue.map((m) => {
                const heightPct = maxMonthly > 0 ? (m.total / maxMonthly) * 100 : 0;
                return (
                  <div key={m.label} className="flex-1 flex flex-col items-center gap-2">
                    <p className="text-[10px] font-bold text-slate-500">
                      {m.total > 0 ? `₦${(m.total / 1000).toFixed(0)}k` : "—"}
                    </p>
                    <div className="w-full bg-slate-100 rounded-lg overflow-hidden" style={{ height: "80px" }}>
                      <div
                        className="w-full bg-blue-500 rounded-lg transition-all duration-500"
                        style={{ height: `${heightPct}%`, marginTop: `${100 - heightPct}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400">{m.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Occupancy by Block */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/20">
            <Home size={20} className="text-indigo-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Occupancy by Block</h2>
              <p className="text-xs text-slate-400">Beds filled vs total capacity</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {blockStats.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No blocks configured yet.</p>
            ) : (
              blockStats.map(block => (
                <div key={block.name}>
                  <div className="flex justify-between items-center mb-1.5">
                    <div>
                      <span className="text-sm font-bold text-slate-800">{block.name}</span>
                      <span className="text-xs text-slate-400 ml-2">{block.rooms} room{block.rooms !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900">{block.rate.toFixed(0)}%</span>
                      <span className="text-xs text-slate-400 ml-1">{block.occupants}/{block.capacity}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        block.rate >= 90 ? "bg-green-500" :
                        block.rate >= 60 ? "bg-blue-500" :
                        block.rate >= 30 ? "bg-amber-400" : "bg-red-400"
                      }`}
                      style={{ width: `${block.rate}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tenant Status Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/20">
            <Users size={20} className="text-indigo-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Tenant Status</h2>
              <p className="text-xs text-slate-400">{totalTenants} total tenants</p>
            </div>
          </div>
          <div className="p-6 space-y-3">
            {[
              { key: "ACTIVE", label: "Active", color: "bg-green-500", text: "text-green-700", bg: "bg-green-50" },
              { key: "AWAITING_PAYMENT", label: "Awaiting Payment", color: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50" },
              { key: "PAYMENT_MADE", label: "Payment Under Review", color: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50" },
              { key: "PENDING", label: "Pending Approval", color: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-50" },
              { key: "EXPIRED", label: "Expired", color: "bg-red-400", text: "text-red-700", bg: "bg-red-50" },
              { key: "REJECTED", label: "Rejected", color: "bg-rose-300", text: "text-rose-600", bg: "bg-rose-50" },
            ].map(s => {
              const count = statusMap[s.key] || 0;
              const pct = totalTenants > 0 ? (count / totalTenants) * 100 : 0;
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.bg} ${s.text} w-44 shrink-0`}>
                    {s.label}
                  </span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${s.color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-black text-slate-900 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Room Status + Payment Types */}
        <div className="space-y-6">
          {/* Room Status */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/20">
              <Home size={20} className="text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Room Status</h2>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                { label: "Occupied", value: occupiedRooms, color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
                { label: "Vacant", value: vacantRooms, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
                { label: "Maintenance", value: maintenanceRooms, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
                { label: "Total Rooms", value: totalRooms, color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-100" },
              ].map(s => (
                <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4`}>
                  <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-xs font-bold text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Type Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/20">
              <CreditCard size={20} className="text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Payment Types</h2>
            </div>
            <div className="p-6 grid grid-cols-3 gap-3">
              {[
                { label: "Full", count: fullPayments.length, amount: fullPayments.reduce((s, p) => s + p.amount, 0), color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                { label: "Installment", count: partialPayments.length, amount: partialPayments.reduce((s, p) => s + p.amount, 0), color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
                { label: "Recurring", count: recurringPayments.length, amount: recurringPayments.reduce((s, p) => s + p.amount, 0), color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
              ].map(t => (
                <div key={t.label} className={`${t.bg} border ${t.border} rounded-2xl p-4`}>
                  <p className={`text-xl font-black ${t.color}`}>{t.count}</p>
                  <p className="text-xs font-bold text-slate-500">{t.label}</p>
                  <p className="text-[10px] text-slate-400 mt-1">₦{(t.amount / 1000).toFixed(0)}k</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Summary + Expiring Tenancies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Maintenance Ticket Status */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
            <div className="flex items-center gap-3">
              <Wrench size={20} className="text-purple-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">Maintenance Tickets</h2>
                <p className="text-xs text-slate-400">{totalTickets} total</p>
              </div>
            </div>
            <Link href="/landlord/maintenance" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              View All <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="p-6 space-y-3">
            {[
              { key: "OPEN", label: "Open", color: "bg-red-500", text: "text-red-700", bg: "bg-red-50" },
              { key: "IN_PROGRESS", label: "In Progress", color: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50" },
              { key: "RESOLVED", label: "Resolved", color: "bg-green-500", text: "text-green-700", bg: "bg-green-50" },
              { key: "CANCELLED", label: "Cancelled", color: "bg-slate-300", text: "text-slate-500", bg: "bg-slate-50" },
            ].map(s => {
              const count = ticketStatusMap[s.key] || 0;
              const pct = totalTickets > 0 ? (count / totalTickets) * 100 : 0;
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.bg} ${s.text} w-28 shrink-0`}>
                    {s.label}
                  </span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${s.color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-black text-slate-900 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expiring Tenancies */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
            <div className="flex items-center gap-3">
              <Calendar size={20} className="text-amber-500" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">Expiring Soon</h2>
                <p className="text-xs text-slate-400">Active tenancies expiring in the next 30 days</p>
              </div>
            </div>
            <Link href="/landlord/tenants" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              View All <ArrowUpRight size={12} />
            </Link>
          </div>
          <ExpiringTenancies />
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
    <div className="divide-y divide-slate-100">
      {expiring.map(profile => {
        const daysLeft = Math.ceil((new Date(profile.rentExpiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return (
          <div key={profile.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
            <div>
              <p className="text-sm font-bold text-slate-900">{profile.user.name}</p>
              <p className="text-xs text-slate-400">
                Room {profile.room?.roomNumber || "—"}
                {profile.room?.block?.name ? ` · ${profile.room.block.name}` : ""}
              </p>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                daysLeft <= 7
                  ? "bg-red-50 text-red-600 border-red-100"
                  : daysLeft <= 14
                  ? "bg-amber-50 text-amber-600 border-amber-100"
                  : "bg-blue-50 text-blue-600 border-blue-100"
              }`}>
                {daysLeft}d left
              </span>
              <p className="text-[10px] text-slate-400 mt-1">
                {new Date(profile.rentExpiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
