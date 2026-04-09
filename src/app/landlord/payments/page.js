import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PaymentApprovalClient from "./PaymentApprovalClient";

export const dynamic = "force-dynamic";

export default async function LandlordPaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "ADMIN")) {
    redirect("/login");
  }

  const payments = await prisma.payment.findMany({
    include: {
      tenant: {
        include: { user: true, room: { include: { block: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return <PaymentApprovalClient payments={payments} />;
}
