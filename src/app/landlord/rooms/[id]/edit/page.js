import { prisma } from "@/lib/prisma";
import RoomForm from "@/components/RoomForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export default async function EditRoomPage({ params }) {
  const { id } = await params;


  const room = await prisma.room.findUnique({
    where: { id }
  });

  if (!room) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/landlord/rooms" 
          className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition-all shadow-sm group"
        >
          <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Room Details</h1>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">Update configuration for room #{room.roomNumber}</p>
        </div>
      </div>
      
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <RoomForm initialData={room} />
      </div>
    </div>
  );
}

