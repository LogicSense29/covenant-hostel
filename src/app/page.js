import { prisma } from "@/lib/prisma";
import LandingClient from "@/components/LandingClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Fetch available rooms (those with at least one free bed)
  const availableRooms = await prisma.room.findMany({
    where: {
      status: "AVAILABLE",
      // We also verify that there is actual capacity left
    },
    include: {
      block: {
        select: {
          name: true,
          address: true,
        }
      },
      tenants: {
        select: {
          id: true,
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  // Filter to ensure only rooms with actual free beds are shown as primary discovery
  const filteredRooms = availableRooms.filter(room => room.tenants.length < room.capacity);

  return <LandingClient initialRooms={filteredRooms} />;
}
