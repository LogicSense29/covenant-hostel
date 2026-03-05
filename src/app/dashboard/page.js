import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardRedirect() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;

  switch (role) {
    case "LANDLORD":
      redirect("/landlord");
      break;
    case "TENANT":
      redirect("/tenant");
      break;
    case "ADMIN":
      redirect("/landlord");
      break;
    case "SERVICE_PROVIDER":
      redirect("/service-provider");
      break;
    default:
      redirect("/unauthorized");
  }

  return null;
}
