import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  Users, 
  Home, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  ArrowUpRight,
  Plus,
  Wrench,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LandlordDashboard() {
  const session = await getServerSession(authOptions);
  
  // Dashboard Metrics
  const rooms = await prisma.room.findMany({
    include: { tenants: true }
  });

  const totalRooms = rooms.length;
  const vacantRooms = rooms.filter(r => r.tenants.length < r.capacity && r.status !== "UNDER_MAINTENANCE").length;
  const occupiedRooms = rooms.filter(r => r.tenants.length > 0).length;
  const expiredRooms = rooms.filter(r => 
    r.status === "EXPIRED_RENT" || 
    (r.rentExpiryDate && new Date(r.rentExpiryDate) < new Date()) ||
    r.tenants.some(t => t.rentExpiryDate && new Date(t.rentExpiryDate) < new Date())
  ).length;
  const totalCapacity = rooms.reduce((acc, r) => acc + r.capacity, 0);
  const totalOccupants = rooms.reduce((acc, r) => acc + r.tenants.length, 0);
  const openTickets = await prisma.maintenanceTicket.count({ where: { status: "OPEN" } });

  // Expiry monitoring counts
  const todayUTC = new Date();
  const in7days = new Date(todayUTC); in7days.setDate(todayUTC.getDate() + 7);
  const in30days = new Date(todayUTC); in30days.setDate(todayUTC.getDate() + 30);

  const [expiredTenantCount, expiringSoon7, expiringSoon30] = await Promise.all([
    prisma.tenantProfile.count({ where: { user: { status: "EXPIRED" } } }),
    prisma.tenantProfile.count({ where: { rentExpiryDate: { gte: todayUTC, lte: in7days }, user: { status: "ACTIVE" } } }),
    prisma.tenantProfile.count({ where: { rentExpiryDate: { gte: todayUTC, lte: in30days }, user: { status: "ACTIVE" } } }),
  ]);
  
  // Room reservation requests (tenants with roomId but status PENDING or AWAITING_PAYMENT)
  const roomReservations = await prisma.tenantProfile.count({
    where: {
      roomId: { not: null },
      user: {
        status: { in: ["PENDING", "AWAITING_PAYMENT"] }
      }
    }
  });

  // Inspection requests (guest inspections with PENDING or CONFIRMED status)
  const inspectionRequests = await prisma.guestInspection.count({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] }
    }
  });
  
  // Occupancy rate: only count rooms that are actually available (exclude UNDER_MAINTENANCE)
  const availableRooms = rooms.filter(r => r.status !== "UNDER_MAINTENANCE");
  const availableCapacity = availableRooms.reduce((acc, r) => acc + r.capacity, 0);
  const occupancyRate = availableCapacity > 0 ? (totalOccupants / availableCapacity) * 100 : 0;

  // Payment Totals
  const rentPayments = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { 
      status: { in: ["SUCCESS", "VERIFIED"] },
      paymentType: { not: "RECURRING" }
    },
  });
  const otherBillingsPayments = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { 
      status: { in: ["SUCCESS", "VERIFIED"] },
      paymentType: "RECURRING"
    },
  });
  const inspectionPayments = await prisma.guestInspection.aggregate({
    _sum: { amountPaid: true },
    where: { feePaid: true },
  });
  const totalRentCollected = rentPayments._sum.amount || 0;
  const totalOtherBillings = otherBillingsPayments._sum.amount || 0;
  const totalInspectionFees = inspectionPayments._sum.amountPaid || 0;
  const grandTotalRevenue = totalRentCollected + totalOtherBillings + totalInspectionFees;

  // Admin Specific Global Metrics
  const isAdmin = session?.user?.role === "ADMIN";
  let adminStats = [];
  if (isAdmin) {
    const totalUsers = await prisma.user.count();
    const totalLandlords = await prisma.user.count({ where: { role: "LANDLORD" } });
    const activeInspections = await prisma.guestInspection.count({ where: { feePaid: true } });
    
    adminStats = [
      { name: "Platform Users", value: totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
      { name: "Total Landlords", value: totalLandlords, icon: Home, color: "text-indigo-600", bg: "bg-indigo-50" },
      { name: "Paid Inspections", value: activeInspections, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
    ];
  }


  let recentTickets = [];
  try {
    recentTickets = await prisma.maintenanceTicket.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        tenant: { include: { user: true } },
      }
    });
  } catch (err) {
    console.error("Dashboard Tickets Fetch Error:", err);
  }

  const stats = [
    { name: "Occupancy Rate",     value: `${occupancyRate.toFixed(1)}%`, icon: CheckCircle, color: "text-green-600",  bg: "bg-green-50",  accent: "bg-green-500",  border: "border-green-300",  href: "/landlord/analytics" },
    { name: "Vacant Rooms",       value: vacantRooms,                    icon: AlertCircle,  color: "text-amber-600", bg: "bg-amber-50",  accent: "bg-amber-400",  border: "border-amber-300",  href: "/landlord/rooms" },
    { name: "Open Tickets",       value: openTickets,                    icon: Wrench,       color: "text-purple-600",bg: "bg-purple-50", accent: "bg-purple-500", border: "border-purple-300", href: "/landlord/maintenance" },
    { name: "Room Reservations",  value: roomReservations,               icon: Home,         color: "text-blue-600",  bg: "bg-blue-50",   accent: "bg-blue-500",   border: "border-blue-300",   href: "/landlord/tenants" },
    { name: "Inspection Requests",value: inspectionRequests,             icon: Users,        color: "text-indigo-600",bg: "bg-indigo-50", accent: "bg-indigo-500", border: "border-indigo-300", href: "/landlord/inspections" },
  ];


  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500 mt-1">Welcome back, {session?.user?.name}</p>
      </div>

      {/* Admin Stats Grid */}
      {/* {isAdmin && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 px-1">System Administration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {adminStats.map((stat) => (
              <div key={stat.name} className="bg-slate-900 p-6 rounded-2xl shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative">
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.name}</p>
                    <p className="text-3xl font-black text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-white/10 ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/5 rounded-full blur-2xl"></div>
              </div>
            ))}
          </div>
        </div>
      )} */}

      {/* Property Stats Grid */}
      <div className="space-y-4 mt-6">
        {isAdmin && <h2 className="text-xl font-bold text-slate-900 px-1">Property Management</h2>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <Link
              key={stat.name}
              href={stat.href}
              className="relative bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 overflow-hidden group flex flex-col border border-slate-100/60"
            >
              {/* Soft background gradient blob */}
              <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full ${stat.bg} opacity-60 group-hover:scale-150 transition-transform duration-700 ease-in-out blur-3xl`}></div>
              
              <div className="relative z-10 flex items-start justify-between">
                <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-white/50`}>
                  <stat.icon size={26} strokeWidth={2.5} />
                </div>
                <div className="bg-slate-50 p-2.5 rounded-full group-hover:bg-slate-100 transition-colors">
                  <ArrowUpRight size={18} className="text-slate-400 group-hover:text-slate-700" />
                </div>
              </div>
              
              <div className="relative z-10 mt-auto">
                <p className="text-[13px] font-semibold text-slate-500 mb-1">{stat.name}</p>
                <p className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
              </div>
            </Link>
          ))}

          {/* Rent Expiry card */}
          <div className="relative bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-red-100/60 flex flex-col justify-between overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
            <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-red-50 opacity-60 blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-sm border border-white/50">
                  <Clock size={26} strokeWidth={2.5} />
                </div>
                <p className="text-[13px] font-semibold text-slate-500">Rent Expiry</p>
              </div>
              <div className="flex items-end justify-between">
                <div className="flex flex-col gap-2">
                  <Link href="/landlord/tenants?status=EXPIRING_7" className="flex items-center gap-2.5 text-[12px] py-2 px-3.5 rounded-xl bg-slate-50 hover:bg-orange-50 hover:text-orange-700 transition-colors group/link border border-slate-100 hover:border-orange-200">
                    <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0 group-hover/link:animate-pulse shadow-[0_0_8px_rgba(251,146,60,0.6)]" />
                    <span className="font-medium text-slate-600 group-hover/link:text-orange-700">In 7 days</span>
                    <span className={`font-black ml-1 ${expiringSoon7 > 0 ? "text-orange-600" : "text-slate-400"}`}>{expiringSoon7}</span>
                  </Link>
                  <Link href="/landlord/tenants?status=EXPIRING_30" className="flex items-center gap-2.5 text-[12px] py-2 px-3.5 rounded-xl bg-slate-50 hover:bg-amber-50 hover:text-amber-700 transition-colors group/link border border-slate-100 hover:border-amber-200">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 group-hover/link:animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                    <span className="font-medium text-slate-600 group-hover/link:text-amber-700">In 30 days</span>
                    <span className={`font-black ml-1 ${expiringSoon30 > 0 ? "text-amber-600" : "text-slate-400"}`}>{expiringSoon30}</span>
                  </Link>
                </div>
                <Link href="/landlord/tenants?status=EXPIRED_TENANT" className="text-right group/expired pl-4 border-l border-slate-100">
                  <p className={`text-4xl font-bold tracking-tight ${expiredTenantCount > 0 ? "text-red-600" : "text-slate-300"} group-hover/expired:scale-105 transition-transform origin-right`}>{expiredTenantCount}</p>
                  <p className="text-[11px] font-bold text-red-400 uppercase tracking-wider mt-1">Expired</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Totals */}
      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-bold text-slate-900 px-1">Revenue Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/landlord/payments" className="relative p-6 rounded-[2rem] overflow-hidden group bg-gradient-to-br from-blue-50/80 to-white border border-blue-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(59,130,246,0.1)] transition-all duration-300 hover:-translate-y-1">
            <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 rounded-bl-full group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-start justify-between mb-8">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform border border-blue-200/50 shadow-sm">
                  <DollarSign size={24} strokeWidth={2.5} />
                </div>
                <div className="bg-white p-2 rounded-full shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors text-slate-400">
                  <ArrowUpRight size={16} />
                </div>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-blue-800/70 mb-1">Billings Collected</p>
                <p className="text-3xl font-bold text-slate-900 tracking-tight">₦{(totalRentCollected + totalOtherBillings).toLocaleString()}</p>
              </div>
            </div>
          </Link>
          
          <Link href="/landlord/inspections" className="relative p-6 rounded-[2rem] overflow-hidden group bg-gradient-to-br from-emerald-50/80 to-white border border-emerald-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.1)] transition-all duration-300 hover:-translate-y-1">
            <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-start justify-between mb-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform border border-emerald-200/50 shadow-sm">
                  <CheckCircle size={24} strokeWidth={2.5} />
                </div>
                <div className="bg-white p-2 rounded-full shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors text-slate-400">
                  <ArrowUpRight size={16} />
                </div>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-emerald-800/70 mb-1">Inspection Fees</p>
                <p className="text-3xl font-bold text-slate-900 tracking-tight">₦{totalInspectionFees.toLocaleString()}</p>
              </div>
            </div>
          </Link>
          
          <Link href="/landlord/billing" className="relative p-6 rounded-[2rem] overflow-hidden group bg-gradient-to-br from-slate-900 to-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.15)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-1">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-bl-full group-hover:scale-110 transition-transform duration-500"></div>
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500/20 blur-3xl rounded-full"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-start justify-between mb-8">
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center group-hover:scale-110 transition-transform border border-white/10 shadow-sm backdrop-blur-sm">
                  <TrendingUp size={24} strokeWidth={2.5} />
                </div>
                <div className="bg-white/10 p-2 rounded-full shadow-sm group-hover:bg-white group-hover:text-slate-900 transition-colors text-white/50 backdrop-blur-sm">
                  <ArrowUpRight size={16} />
                </div>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-400 mb-1">Grand Total Revenue</p>
                <p className="text-3xl font-bold text-white tracking-tight">₦{grandTotalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 pb-10">
        {/* Recent Tickets */}
        <div className="bg-white rounded-[2rem] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col h-[340px]">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-900">Recent Maintenance Tickets</h2>
            <Link href="/landlord/maintenance" className="text-[13px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-full transition-colors hover:bg-blue-100">
              View All <ArrowUpRight size={14} strokeWidth={3} />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto p-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
            {recentTickets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                  <AlertCircle size={32} className="opacity-40" />
                </div>
                <p className="text-sm font-medium">No recent tickets found.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentTickets.map((ticket) => (
                  <div key={ticket.id} className="p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-900">Ticket #{ticket.id.slice(-4)}</span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        ticket.status === "OPEN" ? "bg-red-50 text-red-600 border border-red-100" : 
                        ticket.status === "IN_PROGRESS" ? "bg-amber-50 text-amber-600 border border-amber-100" : 
                        "bg-green-50 text-green-600 border border-green-100"
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-600 line-clamp-1 mb-3">{ticket.issueDescription}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-[9px] uppercase">
                          {(ticket.tenant?.user?.name || "U").charAt(0)}
                        </div>
                        <span>{ticket.tenant?.user?.name || "Unknown Tenant"}</span>
                      </div>
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-[2rem] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col h-[340px]">
          <div className="p-6 border-b border-slate-50 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-5 flex-1">
            <Link href="/landlord/rooms/new" className="flex flex-col items-center justify-center gap-4 p-6 rounded-[1.5rem] border border-slate-100 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-200 hover:shadow-sm transition-all text-slate-600 group text-center">
              <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-400 group-hover:text-blue-600 group-hover:scale-110 transition-all duration-300 border border-slate-100">
                <Plus size={28} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold group-hover:text-blue-700 transition-colors">Add New Room</span>
            </Link>
            <Link href="/landlord/tenants" className="flex flex-col items-center justify-center gap-4 p-6 rounded-[1.5rem] border border-slate-100 bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-200 hover:shadow-sm transition-all text-slate-600 group text-center">
              <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all duration-300 border border-slate-100">
                <Users size={28} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold group-hover:text-indigo-700 transition-colors">Manage Tenants</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
