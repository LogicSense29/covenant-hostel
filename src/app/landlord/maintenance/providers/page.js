import { prisma } from "@/lib/prisma";
import ProviderManager from "./ProviderManager";

export const dynamic = "force-dynamic";

export default async function ProvidersPage() {
  const providers = await prisma.serviceProviderProfile.findMany({
    include: {
      user: true
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="max-w-7xl mx-auto">
      <ProviderManager initialProviders={providers} />
    </div>
  );
}
