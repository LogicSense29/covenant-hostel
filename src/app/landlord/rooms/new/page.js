import RoomForm from "@/components/RoomForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewRoomPage() {
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
          <h1 className="text-2xl font-bold text-slate-900">Add New Room</h1>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">Configure a new unit for your property.</p>
        </div>
      </div>
      
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <RoomForm />
      </div>
    </div>
  );
}

