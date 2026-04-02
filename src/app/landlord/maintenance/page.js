import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LandlordMaintenanceManager from "./LandlordMaintenanceManager";

export const dynamic = "force-dynamic";

export default async function LandlordMaintenancePage() {
  const session = await getServerSession(authOptions);
  
  const tickets = await prisma.maintenanceTicket.findMany({
    include: {
      tenant: {
        include: { user: true }
      },
      provider: {
        include: { user: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const providers = await prisma.serviceProviderProfile.findMany({
    include: { user: true }
  });

  return (
    <div className="max-w-7xl mx-auto">
      <LandlordMaintenanceManager 
        initialTickets={tickets} 
        providers={providers} 
        currentUser={session?.user}
      />
    </div>
  );
}
