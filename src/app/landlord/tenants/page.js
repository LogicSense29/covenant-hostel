import { prisma } from "@/lib/prisma";
import ApprovalActions from "./ApprovalActions";
import AssignRoomActions from "./AssignRoomActions";
import { 
  Users, 
  Search, 
  MapPin, 
  Phone, 
  FileText,
  GraduationCap,
  Briefcase,
  ShieldCheck
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
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tenant</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Guarantor</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">IDs</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Room</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map((profile) => {
                  const status = profile.user?.status || "ACTIVE";
                  const isSelfEmployed = profile.workType === "Self employed/Worker" && !profile.isStudent;

                  return (
                    <tr key={profile.id} className="hover:bg-slate-50/50 transition-colors">

                      {/* Tenant Details */}
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm border ${
                            status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {profile.user?.name?.[0]?.toUpperCase() || "T"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1 mb-0.5">
                              <p className="text-sm font-bold text-slate-900 truncate">{profile.user?.name || "Unnamed"}</p>
                              {profile.isStudent ? (
                                <span className="shrink-0 flex items-center gap-1 text-[8px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-bold uppercase tracking-tighter">
                                  <GraduationCap size={9} /> Student
                                </span>
                              ) : (
                                <span className="shrink-0 flex items-center gap-1 text-[8px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-bold uppercase tracking-tighter">
                                  <Briefcase size={9} /> Pro
                                </span>
                              )}
                              {status === 'PENDING' && <span className="shrink-0 text-[8px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-bold uppercase tracking-tighter">Pending</span>}
                              {status === 'REJECTED' && <span className="shrink-0 text-[8px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold uppercase tracking-tighter">Rejected</span>}
                              {status === 'AWAITING_PAYMENT' && <span className="shrink-0 text-[8px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-bold uppercase tracking-tighter border border-blue-100">Awaiting Payment</span>}
                              {status === 'PAYMENT_MADE' && <span className="shrink-0 text-[8px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded font-bold uppercase tracking-tighter border border-emerald-100">Payment Made</span>}
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium truncate">{profile.phone}</p>
                            {profile.isStudent ? (
                              <p className="text-[10px] text-slate-500 truncate mt-0.5">{profile.schoolName} – {profile.schoolYear}</p>
                            ) : (
                              <p className="text-[10px] text-slate-500 truncate mt-0.5">{profile.companyName} · {profile.workType}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Guarantor */}
                      <td className="px-4 py-3">
                        {isSelfEmployed ? (
                          <span className="text-[10px] text-slate-300 italic">N/A</span>
                        ) : (
                          <div className="space-y-0.5 max-w-[160px]">
                            <p className="text-xs font-bold text-slate-800 truncate">{profile.guarantorName}</p>
                            {profile.guarantorRelationship && (
                              <span className="inline-block text-[8px] px-1 py-0.5 bg-slate-100 text-slate-400 rounded font-bold uppercase tracking-tighter">
                                {profile.guarantorRelationship}
                              </span>
                            )}
                            <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                              <Phone size={9} className="shrink-0" />{profile.guarantorPhone}
                            </p>
                          </div>
                        )}
                      </td>

                      {/* ID Verify */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {profile.guarantorIdUrl && !isSelfEmployed ? (
                            <a href={profile.guarantorIdUrl} target="_blank" rel="noopener noreferrer" title="Guarantor ID"
                              className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-white hover:text-blue-600 transition-all border border-slate-200">
                              <FileText size={14} />
                            </a>
                          ) : null}
                          {profile.isStudent && profile.studentIdUrl && (
                            <a href={profile.studentIdUrl} target="_blank" rel="noopener noreferrer" title="Student ID"
                              className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-white transition-all border border-blue-100">
                              <GraduationCap size={14} />
                            </a>
                          )}
                          {!profile.isStudent && profile.workType === "Employee" && profile.workIdUrl && (
                            <a href={profile.workIdUrl} target="_blank" rel="noopener noreferrer" title="Work ID"
                              className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-white transition-all border border-emerald-100">
                              <Briefcase size={14} />
                            </a>
                          )}
                          {profile.rulesSigned && (
                            <div title="Rules Signed" className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                              <ShieldCheck size={14} />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Room Allocation */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {profile.room ? (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 w-fit">
                              <MapPin size={11} />
                              Room {profile.room.roomNumber}
                              {profile.room.block && <span className="text-[9px] font-bold text-indigo-500">{profile.room.block.name}</span>}
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 pl-1">₦{(profile.room.rentAmount / profile.room.capacity).toLocaleString()}/bed</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic">
                            {status === "REJECTED" ? "Rejected" : status === "ACTIVE" ? "Not placed" : "Awaiting"}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end items-center gap-1.5">
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
