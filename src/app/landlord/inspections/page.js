import { prisma } from "@/lib/prisma";
import InspectionManager from "./InspectionManager";

export const dynamic = "force-dynamic";

export default async function LandlordInspectionsPage() {
  const inspections = await prisma.inspection.findMany({
    include: {
      tenant: { include: { user: true } },
      room: true
    },
    orderBy: { date: "desc" }
  });

  const tenants = await prisma.tenantProfile.findMany({
    include: { user: true, room: true }
  });

  const rooms = await prisma.room.findMany();

  return (
    <div className="max-w-7xl mx-auto">
      <InspectionManager 
        initialInspections={inspections} 
        tenants={tenants}
        rooms={rooms}
      />
    </div>
  );
}
