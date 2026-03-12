import { prisma } from "@/lib/prisma";
import BlockManager from "./BlockManager";
import { FolderCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BlocksPage() {
  const blocks = await prisma.block.findMany({
    include: {
      _count: {
        select: { rooms: true }
      }
    },
    orderBy: { name: "asc" }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full w-fit mb-2">
            <FolderCheck size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Facility Organization</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Facility Blocks</h1>
          <p className="text-slate-500 max-w-xl">
            Group your rooms into wings, categories or blocks. This helps in searching for rooms 
            and enforces unique room numbers within each specific category.
          </p>
        </div>
      </div> */}

      <BlockManager initialBlocks={blocks} />
    </div>
  );
}
