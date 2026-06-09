import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TenantDirectoryClient from "./TenantDirectoryClient";

export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["LANDLORD", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }
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
      },
      payments: {
        orderBy: {
          createdAt: "desc"
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
