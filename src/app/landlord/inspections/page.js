import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import InspectionManager from "./InspectionManager";

export const dynamic = "force-dynamic";

export default async function LandlordInspectionsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["LANDLORD", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  const [inspections, tenants] = await Promise.all([
    prisma.inspection.findMany({
      include: {
        tenant: { include: { user: true } },
        room: { include: { block: true } },
      },
      orderBy: { date: "desc" },
    }),
    prisma.tenantProfile.findMany({
      include: { user: true, room: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <InspectionManager
        initialInspections={inspections}
        tenants={tenants}
      />
    </div>
  );
}
