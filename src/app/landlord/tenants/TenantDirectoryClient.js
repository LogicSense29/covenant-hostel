"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  Mail,
  ExternalLink,
  Loader2,
  Link2
} from "lucide-react";
import Link from "next/link";
import TenantActionsMenu from "./TenantActionsMenu";
import ApprovalActions from "./ApprovalActions";
import AssignRoomActions from "./AssignRoomActions";
import PartialPaymentToggle from "@/components/PartialPaymentToggle";
import TenantEmailModal from "./TenantEmailModal";
import BulkEmailModal from "./BulkEmailModal";

export default function TenantDirectoryClient({ initialTenants, initialNextCursor, availableRooms }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  const [tenants, setTenants] = useState(initialTenants || []);
  const [nextCursor, setNextCursor] = useState(initialNextCursor || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  const [selectedTenant, setSelectedTenant] = useState(null);
  const [emailTenant, setEmailTenant] = useState(null);
  const [showBulkEmail, setShowBulkEmail] = useState(false);

  const isInitialMount = useRef(true);
  const observerRef = useRef();

  // Handle body scroll for drawer
  useEffect(() => {
    if (selectedTenant && window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [selectedTenant]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch filtered data when search or status changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (debouncedSearch === "" && statusFilter === "") return;
    }

    let isMounted = true;
    const fetchFiltered = async () => {
      setIsLoading(true);
      try {
        const query = new URLSearchParams({
          search: debouncedSearch,
          status: statusFilter,
          limit: "20"
        });
        const res = await fetch(`/api/landlord/tenants?${query.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch tenants");
        const json = await res.json();
        
        if (isMounted) {
          setTenants(json.data);
          setNextCursor(json.nextCursor);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchFiltered();
    
    return () => { isMounted = false; };
  }, [debouncedSearch, statusFilter]);

  // Infinite Scroll logic
  const fetchNextPage = async () => {
    if (!nextCursor || isFetchingNextPage || isLoading) return;
    
    setIsFetchingNextPage(true);
    try {
      const query = new URLSearchParams({
        search: debouncedSearch,
        status: statusFilter,
        cursor: nextCursor,
        limit: "20"
      });
      const res = await fetch(`/api/landlord/tenants?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch more tenants");
      const json = await res.json();
      
      setTenants(prev => [...prev, ...json.data]);
      setNextCursor(json.nextCursor);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingNextPage(false);
    }
  };

  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && nextCursor && !isFetchingNextPage && !isLoading) {
      fetchNextPage();
    }
  }, [nextCursor, isFetchingNextPage, isLoading, debouncedSearch, statusFilter]);

  useEffect(() => {
    const element = observerRef.current;
    if (!element) return;
    const option = { threshold: 0.1 };
    const observer = new IntersectionObserver(handleObserver, option);
    observer.observe(element);
    return () => observer.unobserve(element);
  }, [handleObserver]);

  const now = new Date();

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
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 text-sm font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all shrink-0"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="AWAITING_PAYMENT">Awaiting Payment</option>
          <option value="PAYMENT_MADE">Payment Made</option>
          <option value="ACTIVE">Active</option>
          <option value="REJECTED">Rejected</option>
          <option disabled>──────────</option>
          <option value="EXPIRING_7">⚠ Expiring in 7 days</option>
          <option value="EXPIRING_14">📅 Expiring in 14 days</option>
          <option value="EXPIRING_30">📅 Expiring in 30 days</option>
          <option value="EXPIRED_TENANT">🔴 Expired</option>
        </select>
        <button
          onClick={() => setShowBulkEmail(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm shrink-0"
        >
          <Mail size={16} />
          Bulk Email
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 size={32} className="text-blue-500 animate-spin mb-4" />
          <p className="text-slate-500 text-sm font-medium">Loading tenants...</p>
        </div>
      ) : tenants.length === 0 ? (
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
                {tenants.map((profile) => {
                  const status = profile.primaryTenantId ? (profile.primaryTenant?.user?.status || "ACTIVE") : (profile.user?.status || "ACTIVE");
                  const effectiveExpiryDate = profile.primaryTenantId ? profile.primaryTenant?.rentExpiryDate : profile.rentExpiryDate;
                  const isSelfEmployed = profile.workType === "Self employed/Worker" && !profile.isStudent;

                  return (
                    <tr 
                      key={profile.id} 
                      onClick={() => { 
                        if (selectedTenant && selectedTenant.id === profile.id) {
                          setSelectedTenant(null);
                        } else {
                          setSelectedTenant(profile);
                        }
                      }}
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
                              
                              {profile.primaryTenantId && (
                                <span 
                                  className="shrink-0 flex items-center gap-1 text-[8px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded font-bold uppercase tracking-tighter border border-indigo-100"
                                  title={`Linked to ${profile.primaryTenant?.user?.name || "Primary Tenant"}`}
                                >
                                  <Link2 size={9} /> Sharer
                                </span>
                              )}

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
                              {(() => {
                                if (!effectiveExpiryDate) return null;
                                const days = Math.ceil((new Date(effectiveExpiryDate) - now) / (1000 * 60 * 60 * 24));
                                if (days <= 0) return <span className="shrink-0 text-[8px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold uppercase tracking-tighter">Expired</span>;
                                if (days <= 7) return <span className="shrink-0 text-[8px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded font-bold uppercase tracking-tighter">{days}d left</span>;
                                if (days <= 30) return <span className="shrink-0 text-[8px] px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded font-bold uppercase tracking-tighter border border-amber-100">{days}d left</span>;
                                return null;
                              })()}
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
                        <div className="flex flex-wrap gap-1.5">
                          {profile.guarantorIdUrl && !isSelfEmployed ? (
                            <a 
                              onClick={e => e.stopPropagation()} 
                              href={profile.guarantorIdUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              title="View Guarantor ID" 
                              className="p-1.5 bg-slate-100 text-slate-500 rounded-lg border border-slate-200 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                            >
                              <FileText size={14} />
                            </a>
                          ) : null}
                          {profile.isStudent && profile.studentIdUrl && (
                            <a 
                              onClick={e => e.stopPropagation()} 
                              href={profile.studentIdUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              title="View Student ID" 
                              className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                            >
                              <GraduationCap size={14} />
                            </a>
                          )}
                          {!profile.isStudent && profile.workType === "Employee" && profile.workIdUrl && (
                            <a 
                              onClick={e => e.stopPropagation()} 
                              href={profile.workIdUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              title="View Work ID" 
                              className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors"
                            >
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
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic">
                            {status === "REJECTED" ? "Rejected" : status === "ACTIVE" ? "Not placed" : "Awaiting"}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <TenantActionsMenu
                          profile={profile}
                          availableRooms={availableRooms}
                          onEmail={(p) => setEmailTenant(p)}
                        />
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Invisible element for Intersection Observer */}
            <div ref={observerRef} className="h-4 w-full" />
            
            {isFetchingNextPage && (
              <div className="py-6 flex justify-center border-t border-slate-100 bg-slate-50/50">
                <Loader2 size={24} className="text-blue-500 animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* SLIM DRAWER */}
      {selectedTenant && (
        <>
          <div
            className="fixed h-screen inset-0 bg-slate-900/40 backdrop-blur-sm z-40 animate-in fade-in duration-300"
            onClick={() => setSelectedTenant(null)}
          />
          <div className="fixed left-0 right-0 bottom-0 top-16 md:top-0 md:bottom-0 md:left-auto md:right-0 md:w-full md:max-w-sm bg-white z-50 rounded-t-3xl md:rounded-none md:rounded-l-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom md:slide-in-from-right duration-300">

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white sticky top-0 rounded-t-3xl md:rounded-tl-3xl z-10 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Quick View</h2>
                <p className="text-xs text-slate-400">Tenant snapshot</p>
              </div>
              <button onClick={() => setSelectedTenant(null)} className="p-2 bg-slate-50 text-slate-500 rounded-full hover:bg-slate-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-2xl border border-blue-100 shrink-0">
                  {selectedTenant.user?.name?.[0]?.toUpperCase() || "T"}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedTenant.user?.name || "Unnamed"}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Phone size={12} className="text-slate-400" /> {selectedTenant.phone}
                  </p>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {selectedTenant.primaryTenantId && (
                      <span 
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-bold border border-indigo-100"
                        title={`Linked to ${selectedTenant.primaryTenant?.user?.name || "Primary Tenant"}`}
                      >
                        <Link2 size={10} /> Sharer
                      </span>
                    )}
                    {selectedTenant.isStudent
                      ? <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-bold"><GraduationCap size={10} /> Student</span>
                      : <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded font-bold"><Briefcase size={10} /> Professional</span>
                    }
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-bold border border-slate-200">
                      {(selectedTenant.primaryTenantId ? selectedTenant.primaryTenant?.user?.status : selectedTenant.user?.status)?.replace(/_/g, " ") || "UNKNOWN"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Key info */}
              <div className="bg-slate-50 rounded-2xl border border-slate-100 divide-y divide-slate-100">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-slate-400 font-semibold">Email</span>
                  <span className="text-xs font-bold text-slate-700 truncate max-w-[180px]">{selectedTenant.user?.email}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-slate-400 font-semibold">Room</span>
                  <span className="text-xs font-bold text-slate-700">
                    {selectedTenant.room
                      ? `Room ${selectedTenant.room.roomNumber}${selectedTenant.room.block?.name ? ` · ${selectedTenant.room.block.name}` : ""}`
                      : "Not assigned"}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-slate-400 font-semibold">Applied</span>
                  <span className="text-xs font-bold text-slate-700">{new Date(selectedTenant.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                {selectedTenant.guarantorName && selectedTenant.guarantorName.toLowerCase() !== "null" && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-slate-400 font-semibold">Guarantor</span>
                    <span className="text-xs font-bold text-slate-700 truncate max-w-[180px]">{selectedTenant.guarantorName}</span>
                  </div>
                )}
              </div>

              {/* Quick approval actions */}
              <div className="space-y-2">
                <ApprovalActions userId={selectedTenant.userId} status={selectedTenant.user?.status} payments={selectedTenant.payments} />
                <button
                  onClick={() => setEmailTenant(selectedTenant)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all"
                >
                  <Mail size={15} /> Send Email
                </button>
              </div>

              {/* Partial payment toggle — for eligible statuses */}
              {["ACTIVE", "AWAITING_PAYMENT", "PAYMENT_MADE", "EXPIRED"].includes(selectedTenant.user?.status) && (
                <PartialPaymentToggle
                  tenantProfileId={selectedTenant.id}
                  allowPartialPayment={selectedTenant.allowPartialPayment}
                  partialPaymentInstallments={selectedTenant.partialPaymentInstallments}
                  totalDue={selectedTenant.room?.rentAmount || null}
                />
              )}
            </div>

            {/* Footer — View Full Profile */}
            <div className="p-5 border-t border-slate-100 shrink-0">
              <Link
                href={`/landlord/tenants/${selectedTenant.id}`}
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-blue-600 transition-all"
              >
                <ExternalLink size={16} />
                View Full Profile
              </Link>
            </div>
          </div>
        </>
      )}
      {showBulkEmail && (
        <BulkEmailModal
          tenants={tenants}
          onClose={() => setShowBulkEmail(false)}
        />
      )}
      {emailTenant && (
        <TenantEmailModal
          tenant={emailTenant}
          onClose={() => setEmailTenant(null)}
        />
      )}
    </div>
  );
}
