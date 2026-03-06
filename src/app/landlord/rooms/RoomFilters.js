"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useTransition } from "react";

export default function RoomFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleFilter = (name, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
      <div className="flex-1 flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 group focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
        <Search size={18} className={`${isPending ? 'animate-pulse text-blue-500' : 'text-slate-400'}`} />
        <input 
          type="text" 
          placeholder="Search room number or tenant..." 
          className="bg-transparent border-none outline-none text-sm w-full"
          defaultValue={searchParams.get("search") || ""}
          onChange={(e) => handleFilter("search", e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <select 
          defaultValue={searchParams.get("status") || ""}
          onChange={(e) => handleFilter("status", e.target.value)}
          className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 text-sm font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
        >
          <option value="">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="OCCUPIED">Occupied</option>
          <option value="EXPIRED_RENT">Expired</option>
          <option value="UNDER_MAINTENANCE">Maintenance</option>
        </select>
      </div>
    </div>
  );
}
