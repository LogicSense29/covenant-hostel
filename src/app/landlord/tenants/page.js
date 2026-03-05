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
  ExternalLink
} from "lucide-react";

export default async function TenantsPage() {
  let tenants = [];
  try {
    tenants = await prisma.tenantProfile.findMany({
      include: {
        user: true,
        room: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  } catch (err) {
    console.error("Tenants Fetch Error:", err);
  }

  let availableRooms = [];
  try {
    availableRooms = await prisma.room.findMany({
      where: { status: "AVAILABLE" },
      orderBy: { roomNumber: "asc" }
    });
  } catch (err) {
    console.error("Rooms Fetch Error:", err);
  }

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
                            status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {profile.user?.name?.[0]?.toUpperCase() || "T"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                               <p className="text-sm font-bold text-slate-900">{profile.user?.name || "Unnamed"}</p>
                               {status === 'PENDING' && <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-bold uppercase tracking-tighter">New Application</span>}
                            </div>
                            <p className="text-xs text-slate-500">{profile.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1 max-w-[200px]">
                          <p className="text-sm font-bold text-slate-900">{profile.guarantorName}</p>
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
                        {profile.guarantorIdUrl ? (
                          <a 
                            href={profile.guarantorIdUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg border border-slate-200 w-fit hover:bg-white hover:text-blue-600 hover:border-blue-200 transition-all"
                          >
                            <FileText size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">View ID</span>
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span className="text-slate-300 text-[10px] italic">No ID uploaded</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        {status === "ACTIVE" ? (
                          profile.room ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 w-fit">
                              <MapPin size={12} />
                              <span className="text-xs font-bold uppercase tracking-wider">Room {profile.room.roomNumber}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg border border-slate-200 w-fit italic">
                               <span className="text-[10px] font-bold uppercase tracking-wider">Not placed</span>
                            </div>
                          )
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-400 rounded-lg border border-slate-100 w-fit border-dashed">
                             <span className="text-[10px] font-bold uppercase tracking-wider italic">Awaiting Approval</span>
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
