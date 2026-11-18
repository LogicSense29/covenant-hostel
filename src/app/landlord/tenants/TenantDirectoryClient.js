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
  CreditCard,
  ExternalLink,
  ArrowRight,
  Loader2,
  Link2,
  Archive,
  Trash2,
  AlertCircle
} from "lucide-react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import TenantActionsMenu from "./TenantActionsMenu";
import ApprovalActions from "./ApprovalActions";
import AssignRoomActions from "./AssignRoomActions";
import PartialPaymentToggle from "@/components/PartialPaymentToggle";
import TenantEmailModal from "./TenantEmailModal";
import BulkEmailModal from "./BulkEmailModal";
import InstallmentBalanceCard from "@/components/InstallmentBalanceCard";

export default function TenantDirectoryClient({ initialTenants, initialNextCursor, availableRooms, blocks = [], userRole }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  
  const [tenants, setTenants] = useState(initialTenants || []);
  const [nextCursor, setNextCursor] = useState(initialNextCursor || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  const [selectedTenant, setSelectedTenant] = useState(null);
  const [emailTenant, setEmailTenant] = useState(null);
  const [showBulkEmail, setShowBulkEmail] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const isInitialMount = useRef(true);
  const observerRef = useRef();

  // Bulk selection handlers
  const toggleSelection = (tenantId) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tenantId)) {
        newSet.delete(tenantId);
      } else {
        newSet.add(tenantId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === tenants.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tenants.map(t => t.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkArchive = async () => {
    if (selectedIds.size === 0) return;
    
    const confirmed = window.confirm(`Archive ${selectedIds.size} tenant(s)? They will be moved to the archived list.`);
    if (!confirmed) return;

    // Optimistically remove from list immediately
    const idsToArchive = new Set(selectedIds);
    setTenants(prev => prev.filter(t => !idsToArchive.has(t.id)));
    clearSelection();

    try {
      const res = await fetch("/api/tenants/bulk-archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantIds: Array.from(idsToArchive) }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Archived ${data.archivedCount} tenant(s)`);
      } else {
        toast.error("Failed to archive tenants");
        window.location.reload();
      }
    } catch (err) {
      toast.error("Error archiving tenants");
      window.location.reload();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    setShowBulkDeleteModal(false);
    setIsBulkDeleting(true);

    // Optimistically remove selected tenants from the list immediately
    const idsToDelete = new Set(selectedIds);
    setTenants(prev => prev.filter(t => !idsToDelete.has(t.id)));
    clearSelection();
    
    try {
      const res = await fetch("/api/tenants/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantIds: Array.from(idsToDelete) }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Deleted ${data.deletedCount} tenant(s)`);
        if (data.errors && data.errors.length > 0) {
          toast.error(`${data.errors.length} tenant(s) could not be deleted (have sharers)`);
          // Re-fetch to restore any tenants that failed to delete
          window.location.reload();
        }
      } else {
        toast.error("Failed to delete tenants");
        window.location.reload(); // Restore list on failure
      }
    } catch (err) {
      toast.error("Error deleting tenants");
      window.location.reload();
    } finally {
      setIsBulkDeleting(false);
    }
  };

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
      if (debouncedSearch === "" && statusFilter === "" && blockFilter === "") return;
    }

    let isMounted = true;
    const fetchFiltered = async () => {
      setIsLoading(true);
      try {
        const query = new URLSearchParams({
          search: debouncedSearch,
          status: statusFilter,
          block: blockFilter,
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
  }, [debouncedSearch, statusFilter, blockFilter]);

  // Infinite Scroll logic
  const fetchNextPage = async () => {
    if (!nextCursor || isFetchingNextPage || isLoading) return;
    
    setIsFetchingNextPage(true);
    try {
      const query = new URLSearchParams({
        search: debouncedSearch,
        status: statusFilter,
        block: blockFilter,
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
  }, [nextCursor, isFetchingNextPage, isLoading, debouncedSearch, statusFilter, blockFilter]);

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
        <div className="flex flex-wrap gap-2 md:flex-nowrap">
          <select
            value={blockFilter}
            onChange={(e) => setBlockFilter(e.target.value)}
            className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 text-sm font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all shrink-0 w-full md:w-auto"
          >
            <option value="">All Blocks</option>
            {blocks.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 text-sm font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all shrink-0 w-full md:w-auto"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="AWAITING_PAYMENT">Awaiting Payment</option>
            <option value="PAYMENT_MADE">Payment Made</option>
            <option value="ACTIVE">Active</option>
            <option value="REJECTED">Rejected</option>
            <option disabled>──────────</option>
            <option value="INSTALLMENTS">💳 Installment Plan</option>
            <option value="EXPIRING_7">⚠ Expiring in 7 days</option>
            <option value="EXPIRING_14">📅 Expiring in 14 days</option>
            <option value="EXPIRING_30">📅 Expiring in 30 days</option>
            <option value="EXPIRED_TENANT">🔴 Expired</option>
            <option disabled>──────────</option>
            <option value="ARCHIVED">📦 Archived</option>
          </select>
        </div>
        <button
          onClick={() => setShowBulkEmail(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm shrink-0 w-full md:w-auto justify-center"
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
                  <th className="px-4 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === tenants.length && tenants.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tenant</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">Guarantor</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">IDs</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Room</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map((profile) => {
                  const status = profile.primaryTenantId ? (profile.primaryTenant?.user?.status || "ACTIVE") : (profile.user?.status || "ACTIVE");
                  const effectiveExpiryDate = profile.primaryTenantId ? profile.primaryTenant?.rentExpiryDate : profile.rentExpiryDate;
                  const effectiveRoom = profile.primaryTenantId ? profile.primaryTenant?.room : profile.room;
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

                      {/* Checkbox */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(profile.id)}
                          onChange={() => toggleSelection(profile.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                        />
                      </td>

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
                              {profile.allowPartialPayment && (
                                <span 
                                  className="shrink-0 flex items-center gap-1 text-[8px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-bold uppercase tracking-tighter border border-blue-100"
                                  title={`Installment Plan (${profile.partialPaymentInstallments}x)`}
                                >
                                  <CreditCard size={9} /> Installments
                                </span>
                              )}
                              {status === 'PENDING' && <span className="shrink-0 text-[8px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-bold uppercase tracking-tighter">Pending</span>}
                              {status === 'REJECTED' && <span className="shrink-0 text-[8px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold uppercase tracking-tighter">Rejected</span>}
                              {status === 'AWAITING_PAYMENT' && <span className="shrink-0 text-[8px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-bold uppercase tracking-tighter border border-blue-100">Awaiting Payment</span>}
                              {status === 'PAYMENT_MADE' && <span className="shrink-0 text-[8px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded font-bold uppercase tracking-tighter border border-emerald-100">Payment Made</span>}
                              {status === 'ARCHIVED' && <span className="shrink-0 text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-bold uppercase tracking-tighter border border-slate-200">Archived</span>}
                              {(() => {
                                if (!effectiveExpiryDate) return null;
                                const expiryDate = new Date(effectiveExpiryDate);
                                const days = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                                
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
                      <td className="px-4 py-3 hidden md:table-cell">
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
                      <td className="px-4 py-3 hidden md:table-cell">
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
                        {effectiveRoom ? (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 w-fit">
                              <MapPin size={11} />
                              Room {effectiveRoom.roomNumber}
                              {effectiveRoom.block && <span className="text-[9px] font-bold text-indigo-500">{effectiveRoom.block.name}</span>}
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
                          userRole={userRole}
                          onTenantUpdate={(updated) => {
                            setTenants(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
                            setSelectedTenant(prev => prev?.id === updated.id ? { ...prev, ...updated } : prev);
                          }}
                          onTenantRemove={(tenantId) => {
                            setTenants(prev => prev.filter(t => t.id !== tenantId));
                            setSelectedTenant(prev => prev?.id === tenantId ? null : prev);
                          }}
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
      {selectedTenant && (() => {
          const effectiveSelectedRoom = selectedTenant.primaryTenantId ? selectedTenant.primaryTenant?.room : selectedTenant.room;
          return (
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
                    {effectiveSelectedRoom
                      ? `Room ${effectiveSelectedRoom.roomNumber}${effectiveSelectedRoom.block?.name ? ` · ${effectiveSelectedRoom.block.name}` : ""}`
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

              {/* Installment Balance */}
              <InstallmentBalanceCard 
                profile={selectedTenant} 
                allInstallmentCharges={selectedTenant.recurringCharges || []} 
              />

              {/* Quick approval actions */}
              <div className="space-y-2">
                <ApprovalActions userId={selectedTenant.userId} status={selectedTenant.user?.status} payments={selectedTenant.payments} />
                <button
                  onClick={() => setEmailTenant(selectedTenant)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all"
                >
                  <Mail size={15} /> Send Email
                </button>
                              {/* Partial payment toggle — for eligible statuses */}
              {["ACTIVE", "AWAITING_PAYMENT", "PAYMENT_MADE", "EXPIRED"].includes(selectedTenant.user?.status) && (
                <PartialPaymentToggle
                  tenantProfileId={selectedTenant.id}
                  allowPartialPayment={selectedTenant.allowPartialPayment}
                  partialPaymentInstallments={selectedTenant.partialPaymentInstallments}
                  totalDue={effectiveSelectedRoom?.rentAmount || null}
                />
              )}
            </div>
            </div>

            {/* Footer — View Full Profile */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 mt-auto rounded-bl-3xl">
              <Link 
                href={`/landlord/tenants/${selectedTenant.id}`}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
              >
                View Full Profile <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </>
      );
    })()}
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

      {/* Floating Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 px-6 py-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
                {selectedIds.size}
              </div>
              <span className="text-sm font-semibold">
                {selectedIds.size} selected
              </span>
            </div>
            
            <div className="w-px h-8 bg-slate-700" />
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkArchive}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <Archive size={16} />
                Archive
              </button>
              
              {userRole === "ADMIN" && (
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              )}
              
              <button
                onClick={clearSelection}
                className="px-4 py-2 hover:bg-slate-700 rounded-lg text-sm font-semibold transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in duration-200"
            onClick={() => setShowBulkDeleteModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertCircle size={24} className="text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">Permanently Delete {selectedIds.size} Tenant(s)?</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    This will <strong>permanently delete</strong> all selected tenants and their data (payments, history, notifications). 
                    This action <strong>cannot be undone</strong>.
                  </p>
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                    ⚠️ Tenants with linked sharers will be skipped.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBulkDelete}
                  disabled={isBulkDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {isBulkDeleting ? (
                    <><Loader2 size={16} className="animate-spin" /> Deleting...</>
                  ) : (
                    "Delete Permanently"
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
    
  );

}
