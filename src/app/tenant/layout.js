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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { status: true }
  });

  return <TenantLayoutClient dbUser={user}>{children}</TenantLayoutClient>;
}
