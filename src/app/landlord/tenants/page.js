import { prisma } from "@/lib/prisma";
import TenantDirectoryClient from "./TenantDirectoryClient";

export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  const tenants = await prisma.tenantProfile.findMany({
    include: {
      user: true,
      room: {
        include: { block: true }
      },
      stayHistory: {
        include: {
          room: {
            include: { block: true }
          }
        },
        orderBy: {
          startDate: "desc"
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const availableRooms = await prisma.room.findMany({
    where: { 
      NOT: { status: "UNDER_MAINTENANCE" }
    },
    include: {
      tenants: true,
      block: true
    },
    orderBy: { roomNumber: "asc" }
  });

  return (
    <TenantDirectoryClient tenants={tenants} availableRooms={availableRooms} />
  );
}
