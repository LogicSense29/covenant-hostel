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
  
  const occupancyRate = totalCapacity > 0 ? (totalOccupants / totalCapacity) * 100 : 0;

  // Payment Totals
  const rentPayments = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { status: "PAID" },
  });
  const inspectionPayments = await prisma.guestInspection.aggregate({
    _sum: { amountPaid: true },
    where: { feePaid: true },
  });
  const totalRentCollected = rentPayments._sum.amount || 0;
  const totalInspectionFees = inspectionPayments._sum.amountPaid || 0;
  const grandTotalRevenue = totalRentCollected + totalInspectionFees;

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
    { name: "Occupancy Rate", value: `${occupancyRate.toFixed(1)}%`, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", href: "/landlord/rooms" },
    { name: "Vacant Rooms", value: vacantRooms, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50", href: "/landlord/rooms" },
    { name: "Rent Expired", value: expiredRooms, icon: Clock, color: "text-red-600", bg: "bg-red-50", href: "/landlord/rooms" },
    { name: "Open Tickets", value: openTickets, icon: Wrench, color: "text-purple-600", bg: "bg-purple-50", href: "/landlord/maintenance" },
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
      <div className="space-y-4">
        {isAdmin && <h2 className="text-xl font-bold text-slate-900 px-1">Property Management</h2>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Link 
              key={stat.name} 
              href={stat.href}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group block"
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110 duration-300`}>
                  <stat.icon size={24} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">View All</span>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{stat.name}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Revenue Totals */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 px-1">Revenue Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/landlord/billing" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-100 transition-all hover:shadow-md block">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                <DollarSign size={24} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Details</span>
            </div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Rent Collected</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">₦{totalRentCollected.toLocaleString()}</p>
          </Link>
          <Link href="/landlord/inspections" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-100 transition-all hover:shadow-md block">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle size={24} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">History</span>
            </div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Inspection Fees</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">₦{totalInspectionFees.toLocaleString()}</p>
          </Link>
          <Link href="/landlord/billing" className="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 rounded-2xl shadow-lg shadow-blue-200 hover:-translate-y-1 transition-all duration-300 block group overflow-hidden relative">
            <div className="relative z-10 flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-white/20 text-white group-hover:scale-110 transition-transform duration-300">
                <TrendingUp size={24} />
              </div>
              <span className="text-[10px] font-bold text-blue-100 uppercase tracking-widest bg-white/10 px-2 py-1 rounded">Total</span>
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-blue-100 uppercase tracking-wide">Grand Total Revenue</p>
              <p className="text-3xl font-bold text-white mt-1">₦{grandTotalRevenue.toLocaleString()}</p>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
          </Link>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tickets */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Maintenance Tickets</h2>
            <Link href="/landlord/maintenance" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="flex-1">
            {recentTickets.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <AlertCircle size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">No recent tickets found.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentTickets.map((ticket) => (
                  <div key={ticket.id} className="p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-900 uppercase">Ticket #{ticket.id.slice(-4)}</span>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                        ticket.status === "OPEN" ? "bg-red-50 text-red-600" : 
                        ticket.status === "IN_PROGRESS" ? "bg-amber-50 text-amber-600" : 
                        "bg-green-50 text-green-600"
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-1">{ticket.issueDescription}</p>
                    <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400 font-medium">
                      <span>By: {ticket.tenant?.user?.name || "Unknown Tenant"}</span>
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <Link href="/landlord/rooms/new" className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all text-slate-600 group text-center">
              <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400 group-hover:text-blue-600 transition-colors">
                <Plus size={24} />
              </div>
              <span className="text-sm font-bold">Add New Room</span>
            </Link>
            <Link href="/landlord/tenants" className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all text-slate-600 group text-center">
              <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400 group-hover:text-indigo-600 transition-colors">
                <Users size={24} />
              </div>
              <span className="text-sm font-bold">Manage Tenants</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
