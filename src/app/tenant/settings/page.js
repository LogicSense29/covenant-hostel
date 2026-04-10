import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TenantSettingsClient from "./TenantSettingsClient";

export const dynamic = "force-dynamic";

export default async function TenantSettingsPage() {
  const session = await getServerSession(authOptions);

  const profile = await prisma.tenantProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });

  return <TenantSettingsClient profile={profile} userEmail={session.user.email} />;
}
