import { prisma } from "@/lib/prisma";
import ApprovalActions from "./ApprovalActions";
import AssignRoomActions from "./AssignRoomActions";
import { 
  Users, 
  Search, 
  MapPin, 
  Phone, 
  Calendar,
  AlertCircle,
  FileText,
  ExternalLink,
  GraduationCap,
  History,
  Home
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  const tenants = await prisma.tenantProfile.findMany({
    include: {
      user: true,
      room: {
        include: { block: true }
      },
      stayHistory: {
        include: {
          room: {
            include: { block: true }
          }
        },
        orderBy: {
          startDate: "desc"
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const availableRooms = await prisma.room.findMany({
    where: { 
      NOT: { status: "UNDER_MAINTENANCE" }
    },
    include: {
      tenants: true,
      block: true
    },
    orderBy: { roomNumber: "asc" }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tenant Directory</h1>
        <p className="text-slate-500 mt-1">View and manage all registered tenants and applications.</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 group focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search name, phone or guarantor..." 
            className="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>
      </div>

      {tenants.length === 0 ? (
        <div className="py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
          <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Users size={32} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No tenants found</h3>
          <p className="text-slate-500 mt-1 max-w-xs mx-auto text-sm">There are no registered tenants in the system yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tenant Details</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Guarantor</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">ID Verify</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Allocation</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map((profile) => {
                  const isExpired = profile.rentExpiryDate && new Date(profile.rentExpiryDate) < new Date();
                  const status = profile.user?.status || "ACTIVE";

                  return (
                    <tr key={profile.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border ${
                            status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                            status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {profile.user?.name?.[0]?.toUpperCase() || "T"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                               <p className="text-sm font-bold text-slate-900">{profile.user?.name || "Unnamed"}</p>
                               {profile.isStudent && (
                                 <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-bold uppercase tracking-tighter">
                                   <GraduationCap size={10} /> Student
                                 </span>
                               )}
                               {status === 'PENDING' && <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-bold uppercase tracking-tighter">New Application</span>}
                               {status === 'REJECTED' && <span className="text-[9px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold uppercase tracking-tighter">Rejected</span>}
                            </div>
                            <p className="text-xs text-slate-500 font-medium">{profile.phone}</p>
                            {profile.isStudent && (
                              <div className="mt-2 space-y-0.5 border-l-2 border-blue-100 pl-2">
                                <p className="text-[10px] font-bold text-slate-700 uppercase">{profile.schoolName}</p>
                                <p className="text-[10px] text-slate-500">{profile.courseOfStudy} ({profile.schoolYear})</p>
                                <p className="text-[9px] text-slate-400 font-mono">{profile.matricNumber}</p>
                                {profile.permanentAddress && (
                                  <p className="text-[9px] text-slate-400 italic mt-1 leading-tight">
                                    <span className="font-bold text-slate-300">Home:</span> {profile.permanentAddress}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1 max-w-[200px]">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-900">{profile.guarantorName}</p>
                            {profile.guarantorRelationship && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200 font-bold uppercase tracking-tighter">
                                {profile.guarantorRelationship}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                            <Phone size={10} className="text-slate-400" /> {profile.guarantorPhone}
                          </div>
                          <div className="flex items-start gap-1.5 text-[10px] text-slate-400 leading-relaxed">
                            <MapPin size={10} className="mt-0.5 shrink-0" />
                            <span className="line-clamp-2">{profile.guarantorAddress}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2">
                          {profile.guarantorIdUrl ? (
                            <a 
                              href={profile.guarantorIdUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg border border-slate-200 w-fit hover:bg-white hover:text-blue-600 hover:border-blue-200 transition-all"
                            >
                              <FileText size={12} />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Guarantor ID</span>
                              <ExternalLink size={10} />
                            </a>
                          ) : (
                            <span className="text-slate-300 text-[10px] italic">No Guarantor ID</span>
                          )}

                          {profile.isStudent && profile.studentIdUrl && (
                             <a 
                               href={profile.studentIdUrl} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 w-fit hover:bg-white hover:text-blue-700 hover:border-blue-300 transition-all"
                             >
                               <GraduationCap size={12} />
                               <span className="text-[10px] font-bold uppercase tracking-wider">Student ID</span>
                               <ExternalLink size={10} />
                             </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {status === "ACTIVE" ? (
                          profile.room ? (
                            <div className="flex flex-col gap-1 items-start">
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 w-fit">
                                <MapPin size={12} />
                                <span className="text-xs font-bold uppercase tracking-wider">Room {profile.room.roomNumber}</span>
                                {profile.room.block && (
                                  <span className="ml-1 text-[9px] font-bold text-indigo-600 bg-indigo-100/50 px-1.5 py-0.5 rounded border border-indigo-200/50 uppercase">
                                    {profile.room.block.name}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-bold text-blue-600 px-1">₦{(profile.room.rentAmount / profile.room.capacity).toLocaleString()} / Bed</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg border border-slate-200 w-fit italic">
                               <span className="text-[10px] font-bold uppercase tracking-wider">Not placed</span>
                            </div>
                          )
                        ) : (
                          status === "REJECTED" ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg border border-red-100 w-fit">
                               <span className="text-[10px] font-bold uppercase tracking-wider italic font-bold">Rejected</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-400 rounded-lg border border-slate-100 w-fit border-dashed text-slate-300">
                               <span className="text-[10px] font-bold uppercase tracking-wider italic">Awaiting Approval</span>
                            </div>
                          )
                        )}

                        {/* Stay History */}
                        {profile.stayHistory?.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-slate-100">
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                               <History size={10} /> Stay History
                             </p>
                             <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                               {profile.stayHistory.map((stay) => {
                                 const isCurrent = stay.status === "ACTIVE";
                                 return (
                                   <div key={stay.id} className={`flex items-center justify-between text-[10px] px-2 py-1.5 rounded-lg border transition-all ${
                                     isCurrent ? 'bg-blue-50/50 border-blue-100/50 text-blue-700' : 'bg-slate-50 border-slate-100 text-slate-500'
                                   }`}>
                                     <div className="flex items-center gap-1.5">
                                        <Home size={10} className={isCurrent ? 'text-blue-400' : 'text-slate-400'} />
                                        <div className="flex flex-col leading-tight">
                                          <span className="font-bold">Room {stay.room.roomNumber}</span>
                                          <span className="text-[8px] opacity-70">({stay.room.block?.name})</span>
                                        </div>
                                     </div>
                                     <div className="text-right leading-tight">
                                        <p className="font-bold">{new Date(stay.startDate).toLocaleDateString()}</p>
                                        <p className="text-[8px] opacity-60">
                                          {stay.endDate ? `to ${new Date(stay.endDate).toLocaleDateString()}` : 'Present'}
                                        </p>
                                     </div>
                                   </div>
                                 );
                               })}
                             </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <ApprovalActions userId={profile.userId} status={status} />
                          {status === "ACTIVE" && (
                            <AssignRoomActions 
                              tenantId={profile.id} 
                              currentRoomId={profile.roomId} 
                              availableRooms={availableRooms} 
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
