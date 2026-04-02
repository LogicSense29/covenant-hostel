"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  MapPin, 
  Phone, 
  FileText,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  X,
  CreditCard,
  Building,
  Calendar
} from "lucide-react";
import ApprovalActions from "./ApprovalActions";
import AssignRoomActions from "./AssignRoomActions";

export default function TenantDirectoryClient({ tenants, availableRooms }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTenant, setSelectedTenant] = useState(null);

  useEffect(() => {
    if (selectedTenant) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [selectedTenant]);

  const filteredTenants = tenants.filter(t => 
    t.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.phone?.includes(searchTerm) ||
    t.guarantorName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredTenants.length === 0 ? (
        <div className="py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
          <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Users size={32} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No tenants found</h3>
          <p className="text-slate-500 mt-1 max-w-xs mx-auto text-sm">There are no matching tenants in the system.</p>
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
                {filteredTenants.map((profile) => {
                  const status = profile.user?.status || "ACTIVE";
                  const isSelfEmployed = profile.workType === "Self employed/Worker" && !profile.isStudent;

                  return (
                    <tr 
                      key={profile.id} 
                      onClick={() => setSelectedTenant(profile)}
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                    >

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
                              <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">{profile.user?.name || "Unnamed"}</p>
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
                          </div>
                        )}
                      </td>

                      {/* ID Verify */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5" onClick={e => e.stopPropagation()}>
                          {profile.guarantorIdUrl && !isSelfEmployed ? (
                            <div title="Guarantor ID attached" className="p-1.5 bg-slate-100 text-slate-500 rounded-lg border border-slate-200">
                              <FileText size={14} />
                            </div>
                          ) : null}
                          {profile.isStudent && profile.studentIdUrl && (
                            <div title="Student ID attached" className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                              <GraduationCap size={14} />
                            </div>
                          )}
                          {!profile.isStudent && profile.workType === "Employee" && profile.workIdUrl && (
                            <div title="Work ID attached" className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                              <Briefcase size={14} />
                            </div>
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
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic">
                            {status === "REJECTED" ? "Rejected" : status === "ACTIVE" ? "Not placed" : "Awaiting"}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
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

      {/* DRAWER OVERLAY */}
      {selectedTenant && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed h-screen inset-0 bg-slate-900/40 backdrop-blur-sm z-40 animate-in fade-in duration-300" 
            onClick={() => setSelectedTenant(null)}
          />
          
          {/* Drawer / Bottom Sheet */}
          <div className="fixed inset-x-0 bottom-0 top-16 md:top-0 md:bottom-0 md:inset-auto md:right-0 md:w-full md:max-w-md bg-white z-50 rounded-t-3xl md:rounded-none md:rounded-l-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom md:slide-in-from-right duration-300">
            
            {/* Drawer Header (Sticky) */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white sticky top-0 rounded-t-3xl md:rounded-tl-3xl z-10 shrink-0">
               <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Application Profile</h2>
                  <p className="text-xs text-slate-400 font-medium">Review tenant details</p>
               </div>
               <button 
                 onClick={() => setSelectedTenant(null)}
                 className="p-2 bg-slate-50 text-slate-500 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors"
               >
                 <X size={20} />
               </button>
            </div>

            {/* Drawer Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
               
               {/* 1. Profile Summary */}
               <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-2xl border border-blue-100 shrink-0">
                    {selectedTenant.user?.name?.[0]?.toUpperCase() || "T"}
                  </div>
                  <div className="space-y-1">
                     <h3 className="text-xl font-bold text-slate-900 leading-tight">
                        {selectedTenant.user?.name || "Unnamed Applicant"}
                     </h3>
                     <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 pt-0.5">
                       <Phone size={14} className="text-slate-400" /> {selectedTenant.phone}
                     </p>
                     <div className="flex flex-wrap gap-2 pt-2">
                        {selectedTenant.isStudent ? (
                          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg font-bold">
                            <GraduationCap size={14} /> Student
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-bold">
                            <Briefcase size={14} /> Professional
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg font-bold border border-slate-200">
                          {selectedTenant.user?.status?.replace("_", " ")}
                        </span>
                     </div>
                  </div>
               </div>

               {/* 2. Personal & Academic/Work Detail Cards */}
               <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Primary Information</h4>
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-4">
                     
                     <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
                        <p className="text-sm font-semibold text-slate-800">{selectedTenant.user?.email}</p>
                     </div>
                     <div className="h-px bg-slate-200" />

                     {selectedTenant.isStudent ? (
                       <>
                         <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Matriculation Number</p>
                            <p className="text-sm font-semibold text-slate-800">{selectedTenant.matricNumber}</p>
                         </div>
                         <div className="h-px bg-slate-200" />
                         <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institution & Course</p>
                            <p className="text-sm font-semibold text-slate-800">{selectedTenant.schoolName} — {selectedTenant.schoolYear}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{selectedTenant.courseOfStudy} ({selectedTenant.department}, {selectedTenant.faculty})</p>
                         </div>
                       </>
                     ) : (
                       <>
                         <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employment Type</p>
                            <p className="text-sm font-semibold text-slate-800">{selectedTenant.workType}</p>
                         </div>
                         <div className="h-px bg-slate-200" />
                         <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Company / Workplace</p>
                            <p className="text-sm font-semibold text-slate-800">{selectedTenant.companyName}</p>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-start gap-1">
                              <MapPin size={12} className="shrink-0 mt-0.5" /> 
                              {selectedTenant.workAddress}
                            </p>
                         </div>
                       </>
                     )}
                     
                     <div className="h-px bg-slate-200" />
                     <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Permanent Address</p>
                        <p className="text-sm font-semibold text-slate-800">{selectedTenant.permanentAddress}</p>
                     </div>
                  </div>
               </div>

               {/* 3. Guarantor (If Applicable) */}
               {!(selectedTenant.workType === "Self employed/Worker" && !selectedTenant.isStudent) && (
                 <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Guarantor Information</h4>
                    <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-5 space-y-4">
                       <div className="flex items-center justify-between">
                         <div className="space-y-1">
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Guarantor Name</p>
                            <p className="text-sm font-semibold text-slate-900">{selectedTenant.guarantorName}</p>
                         </div>
                         <span className="text-[10px] font-bold px-2 py-1 bg-white text-blue-600 rounded-lg border border-blue-100 uppercase tracking-wider">
                           {selectedTenant.guarantorRelationship}
                         </span>
                       </div>
                       
                       <div className="h-px bg-blue-100/50" />
                       
                       <div className="space-y-1">
                          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Contact Phone</p>
                          <p className="text-sm font-semibold text-slate-900">{selectedTenant.guarantorPhone}</p>
                       </div>

                       <div className="h-px bg-blue-100/50" />
                       
                       <div className="space-y-1">
                          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Guarantor Address</p>
                          <p className="text-sm font-semibold text-slate-900">{selectedTenant.guarantorAddress}</p>
                       </div>
                    </div>
                 </div>
               )}

               {/* 4. Documents Grid */}
               <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Verification Documents</h4>
                  <div className="grid grid-cols-2 gap-3">
                     
                     {selectedTenant.isStudent && selectedTenant.studentIdUrl && (
                       <a href={selectedTenant.studentIdUrl} target="_blank" rel="noopener noreferrer" 
                          className="group relative aspect-[4/3] rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center hover:border-blue-300 transition-all">
                          <img src={selectedTenant.studentIdUrl} alt="Student ID" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex flex-col justify-end p-3">
                            <p className="text-white text-xs font-bold flex items-center gap-1.5"><GraduationCap size={14} /> Student ID</p>
                          </div>
                       </a>
                     )}

                     {!selectedTenant.isStudent && selectedTenant.workType === "Employee" && selectedTenant.workIdUrl && (
                       <a href={selectedTenant.workIdUrl} target="_blank" rel="noopener noreferrer" 
                          className="group relative aspect-[4/3] rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center hover:border-blue-300 transition-all">
                          <img src={selectedTenant.workIdUrl} alt="Work ID" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex flex-col justify-end p-3">
                            <p className="text-white text-xs font-bold flex items-center gap-1.5"><Briefcase size={14} /> Work ID</p>
                          </div>
                       </a>
                     )}

                     {selectedTenant.guarantorIdUrl && (
                       <a href={selectedTenant.guarantorIdUrl} target="_blank" rel="noopener noreferrer" 
                          className="group relative aspect-[4/3] rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center hover:border-blue-300 transition-all">
                          <img src={selectedTenant.guarantorIdUrl} alt="Guarantor ID" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex flex-col justify-end p-3">
                            <p className="text-white text-xs font-bold flex items-center gap-1.5"><FileText size={14} /> Guarantor ID</p>
                          </div>
                       </a>
                     )}
                     
                     {!selectedTenant.studentIdUrl && !selectedTenant.workIdUrl && !selectedTenant.guarantorIdUrl && (
                       <div className="col-span-2 p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs font-bold">
                         No documents uploaded
                       </div>
                     )}
                  </div>
               </div>

            </div>

            {/* Drawer Footer Actions (Sticky Bottom) */}
            <div className="p-6 bg-white border-t border-slate-100 shrink-0 space-y-4">
               {/* Quick info bar */}
               <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <Calendar size={14} className="text-slate-400" />
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Applied</span>
                 </div>
                 <span className="text-xs font-bold text-slate-700">{new Date(selectedTenant.createdAt).toLocaleDateString()}</span>
               </div>
               
               {/* Actions */}
               <div className="flex gap-2 w-full [&>*]:flex-1">
                 <ApprovalActions userId={selectedTenant.userId} status={selectedTenant.user?.status} />
               </div>
            </div>
            
          </div>
        </>
      )}
    </div>
  );
}
