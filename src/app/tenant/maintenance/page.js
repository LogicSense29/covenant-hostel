import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MaintenanceManager from "./MaintenanceManager";

export const dynamic = "force-dynamic";

export default async function TenantMaintenancePage() {
  const session = await getServerSession(authOptions);
  
  const profile = await prisma.tenantProfile.findUnique({
    where: { userId: session.user.id }
  });

  if (!profile || !profile.roomId) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200 shadow-xl border-t-4 border-t-blue-500 animate-in fade-in duration-700">
        <div className="bg-blue-50 p-4 rounded-2xl mb-6">
          <AlertCircle size={48} className="text-blue-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 text-center">Support Service Restricted</h1>
        <p className="text-slate-500 mt-4 text-center max-w-md leading-relaxed">
          Maintenance reporting is only available to tenants with an active room allocation. 
        </p>
      </div>
    );
  }

  const tickets = await prisma.maintenanceTicket.findMany({
    where: { tenantId: profile.id },
    include: {
      provider: {
        include: { user: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="max-w-7xl mx-auto">
      <MaintenanceManager initialTickets={tickets} />
    </div>
  );
}

// Add the missing AlertCircle import for the error state
import { AlertCircle } from "lucide-react";
