import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AlertCircle } from "lucide-react";
import ComplaintForm from "./ComplaintForm";
import ComplaintsClient from "./ComplaintsClient";

export const dynamic = "force-dynamic";

export default async function TenantComplaintsPage() {
  const session = await getServerSession(authOptions);

  const profile = await prisma.tenantProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile || !profile.roomId) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200 shadow-xl border-t-4 border-t-red-500">
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
    where: { tenantId: profile.id, category: "COMPLAINT" },
    include: { provider: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ComplaintsClient
      complaints={complaints}
      currentUser={session.user}
    />
  );
}
