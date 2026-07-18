import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TenantLayoutClient from "./TenantLayoutClient";
import { redirect } from "next/navigation";

export default async function TenantLayout({ children }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "TENANT") {
    redirect("/dashboard");
  }

  // Fetch the user's own status AND check if they are a sharer (linked to a primary tenant)
  const profile = await prisma.tenantProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      primaryTenantId: true,
      primaryTenant: {
        select: {
          user: { select: { status: true } }
        }
      },
      user: { select: { status: true } },
    },
  });

  const ownStatus = profile?.user?.status ?? "ACTIVE";
  const primaryStatus = profile?.primaryTenant?.user?.status ?? null;

  // If the tenant is a sharer, their effective status is determined by their primary tenant.
  // This means if the primary's rent expires, the sharer is locked out too — no DB change needed.
  const effectiveStatus = primaryStatus ?? ownStatus;

  return <TenantLayoutClient dbUser={{ status: effectiveStatus }}>{children}</TenantLayoutClient>;
}
