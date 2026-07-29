import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import {
  Home, MapPin, Calendar, ShieldCheck, Phone, Mail,
  ArrowRight, AlertCircle, Clock, CreditCard,
  CheckCircle2, Wrench, MessageSquareWarning,
  User
} from "lucide-react";
import Link from "next/link";
import ShareRoomButton from "@/components/ShareRoomButton";
import StayHistoryModalButton from "@/components/StayHistoryModalButton";
import EmergencyCard from "@/components/EmergencyCard";

export const dynamic = "force-dynamic";

function getGreeting() {
  // WAT = UTC+1
  const h = (new Date().getUTCHours() + 1) % 24;
  
  if (h < 12) return "Good morning";
  if (h < 16) return "Good afternoon"; // 12:00 PM - 3:59 PM
  if (h < 21) return "Good evening";   // 4:00 PM - 8:59 PM
  return "Good night";                 // 9:00 PM - 11:59 PM
}

export default async function TenantDashboard() {
  const session = await getServerSession(authOptions);

  const profile = await prisma.tenantProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      room: {
        include: {
          block: true,
          tenants: {
            where: { user: { status: { notIn: ["REJECTED"] } } },
            select: { id: true },
          },
        },
      },
      user: true,
      primaryTenant: { 
        include: { 
          user: true,
          payments: { orderBy: { createdAt: "desc" }, take: 10 }
        } 
      },
      payments: { orderBy: { createdAt: "desc" }, take: 10 },
      stayHistory: {
        include: { room: { include: { block: true } } },
        orderBy: { startDate: "desc" },
      },
    },
  });

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200 shadow-xl border-t-4 border-t-amber-500">
        <AlertCircle size={48} className="text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900">Profile Not Found</h1>
        <p className="text-slate-500 mt-2 text-center max-w-md">
          No tenant profile linked to this account. Contact support if this is an error.
        </p>
      </div>
    );
  }

  const { room, user, payments } = profile;

  const matchingRules = profile.roomId
    ? await prisma.billingRule.findMany({
        where: {
          type: { in: ["Base Rent", "Base_Rent", "BaseRent", "Rent", "RENT", "BASE_RENT"] },
          rooms: { some: { id: profile.roomId } },
        },
      })
    : [];

  const rentRule = matchingRules[0] || null;
  const baseRentAmount = rentRule ? rentRule.amount : (room?.rentAmount ?? 0);
  const rentFrequency = rentRule?.frequency || "YEARLY";
  const freqMap = { DAILY:"day", MONTHLY:"mo", QUARTERLY:"qtr", YEARLY:"yr", PER_SEMESTER:"sem", ONCE:"once" };
  const rentFrequencyShorthand = freqMap[rentFrequency] || "yr";

  // ── Determine Effective Status & Profile ──
  // For sharers, ALL status and expiry calculations are driven by the primary tenant's data.
  const isRoomSharer = !!profile.primaryTenantId;
  const effectiveProfile = isRoomSharer && profile.primaryTenant ? profile.primaryTenant : profile;
  const effectiveUser = isRoomSharer && profile.primaryTenant ? profile.primaryTenant.user : user;

  // ── Pre-active status screens ──
  if (effectiveUser.status === "PENDING") {
    return <PreActiveScreen type="pending" room={room} profile={effectiveProfile} primaryTenantName={isRoomSharer ? effectiveProfile.user?.name : null} />;
  }
  if (effectiveUser.status === "AWAITING_PAYMENT") {
    const paymentsToCheck = isRoomSharer ? profile.primaryTenant?.payments || [] : payments;
    const hasRejected = paymentsToCheck.some(p => p.status === "REJECTED");
    return <PreActiveScreen type="awaiting_payment" room={room} profile={effectiveProfile} primaryTenantName={isRoomSharer ? effectiveProfile.user?.name : null} hasRejectedPayment={hasRejected} />;
  }
  if (effectiveUser.status === "PAYMENT_MADE") {
    const paymentsToCheck = isRoomSharer ? profile.primaryTenant.payments : payments;
    const hasVerified = paymentsToCheck.some(p => p.status === "VERIFIED" || p.status === "SUCCESS");
    return <PreActiveScreen type={hasVerified ? "payment_approved" : "payment_review"} room={room} profile={effectiveProfile} primaryTenantName={isRoomSharer ? effectiveProfile.user?.name : null} />;
  }
  if (effectiveUser.status === "EXPIRED") {
    const paymentsToCheck = isRoomSharer ? profile.primaryTenant?.payments || [] : payments;
    const hasRejected = paymentsToCheck.some(p => p.status === "REJECTED");
    return <PreActiveScreen type="expired" room={room} profile={effectiveProfile} primaryTenantName={isRoomSharer ? effectiveProfile.user?.name : null} hasRejectedPayment={hasRejected} />;
  }
  if (effectiveUser.status === "REJECTED") {
    return <PreActiveScreen type="rejected" room={room} profile={effectiveProfile} primaryTenantName={isRoomSharer ? effectiveProfile.user?.name : null} />;
  }

  // ── ACTIVE dashboard ──
  const targetPayments = isRoomSharer && profile.primaryTenant ? profile.primaryTenant.payments : profile.payments;

  const hasVerifiedPayment = targetPayments.some(p => p.status === "VERIFIED" || p.status === "SUCCESS");
  const hasPendingReceipt  = targetPayments.some(p => p.status === "PENDING");
  const hasRejectedReceipt = targetPayments.some(p => p.status === "REJECTED");
  const hasNoPayment       = !hasVerifiedPayment && !hasPendingReceipt;

  // Use the effective profile's rentExpiryDate (primary's if sharer)
  const effectiveExpiryDate = effectiveProfile.rentExpiryDate;
  const daysUntilExpiry = effectiveExpiryDate
    ? Math.ceil((new Date(effectiveExpiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpiringSoon  = daysUntilExpiry !== null && daysUntilExpiry <= 7  && daysUntilExpiry > 0;
  const isExpiringCrit  = daysUntilExpiry !== null && daysUntilExpiry <= 3  && daysUntilExpiry > 0;
  const showPaymentAlert = hasNoPayment || (hasPendingReceipt && !hasVerifiedPayment) || isExpiringSoon || hasRejectedReceipt;

  const greeting  = getGreeting();
  const firstName = user.name?.split(" ")[0] || "Tenant";

  // Payment status config
  let payLabel = "Paid";
  let payDot   = "bg-emerald-400";
  let payPill  = "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (hasNoPayment)                          { payLabel = "Unpaid";  payDot = "bg-red-400";   payPill = "bg-red-50 text-red-700 border-red-200"; }
  else if (hasPendingReceipt && !hasVerifiedPayment) { payLabel = "Pending"; payDot = "bg-amber-400"; payPill = "bg-amber-50 text-amber-700 border-amber-200"; }

  const canShare = room && !profile.primaryTenantId && room.tenants.length < room.capacity;
  const hasGuarantor = profile?.guarantorName && profile.guarantorName.trim() !== "" && profile.guarantorName.trim().toLowerCase() !== "null";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-16">

      {/* ── Alert Banners — shown for all tenants including sharers ── */}
      {showPaymentAlert && (
        <div className="space-y-2.5">
          {isExpiringSoon && (
            <div className={`rounded-2xl px-5 py-3.5 flex items-center justify-between gap-4 border ${isExpiringCrit ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
              <div className="flex items-center gap-3">
                <Calendar size={16} className={isExpiringCrit ? "text-red-500 shrink-0" : "text-amber-500 shrink-0"} />
                <p className={`text-sm font-semibold ${isExpiringCrit ? "text-red-800" : "text-amber-800"}`}>
                  {isExpiringCrit ? `Rent expires in ${daysUntilExpiry} day${daysUntilExpiry===1?"":"s"} — renew now` : `Rent expires in ${daysUntilExpiry} days`}
                </p>
              </div>
              {/* Primary tenant: Renew button. Sharer: contact prompt (plain text, no button) */}
              {isRoomSharer ? (
                <p className={`shrink-0 text-xs font-semibold ${isExpiringCrit ? "text-red-600" : "text-amber-600"}`}>
                  Contact {profile.primaryTenant?.user?.name?.split(" ")[0] || "your primary tenant"}
                </p>
              ) : (
                <Link href="/tenant/payments" className={`shrink-0 text-xs font-bold px-4 py-1.5 rounded-xl text-white ${isExpiringCrit ? "bg-red-600 hover:bg-red-700" : "bg-amber-500 hover:bg-amber-600"}`}>
                  Renew
                </Link>
              )}
            </div>
          )}
          {(hasNoPayment || (hasPendingReceipt && !hasVerifiedPayment)) && (
            <div className={`rounded-2xl px-5 py-3.5 flex items-center justify-between gap-4 border ${hasNoPayment ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
              <div className="flex items-center gap-3">
                {hasNoPayment ? <AlertCircle size={16} className="text-red-500 shrink-0" /> : <Clock size={16} className="text-amber-500 shrink-0" />}
                <p className={`text-sm font-semibold ${hasNoPayment ? "text-red-800" : "text-amber-800"}`}>
                  {hasNoPayment ? "No payment on record — please make a payment" : "Receipt submitted — awaiting landlord approval"}
                </p>
              </div>
              {hasNoPayment && !isRoomSharer && (
                <Link href="/tenant/payments" className="shrink-0 text-xs font-bold px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white">
                  Pay Now
                </Link>
              )}
            </div>
          )}
          {hasRejectedReceipt && (
            <div className="rounded-2xl px-5 py-3.5 flex items-center justify-between gap-4 border bg-red-50 border-red-200">
              <div className="flex items-center gap-3">
                <AlertCircle size={16} className="text-red-500 shrink-0" />
                <p className="text-sm font-semibold text-red-800">
                  {isRoomSharer 
                    ? `A payment receipt uploaded by ${profile.primaryTenant?.user?.name?.split(" ")[0] || "your primary tenant"} was rejected.`
                    : "One of your previously uploaded payment receipts was rejected."}
                </p>
              </div>
              {/* {!isRoomSharer && (
                <Link href="/tenant/payments" className="shrink-0 text-xs font-bold px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white">
                  View Details
                </Link>
              )} */}
            </div>
          )}
        </div>
      )}
      {/* ── Room Sharer Info Banner — shows when active tenant is a sharer ── */}
      {isRoomSharer && (
        <div className="rounded-2xl px-5 py-3.5 flex items-center gap-3 bg-blue-50 border border-blue-100">
          <ShieldCheck size={16} className="text-blue-500 shrink-0" />
          <p className="text-sm font-semibold text-blue-800">
            You are a room sharer. Billing is managed by your primary tenant.
          </p>
        </div>
      )}

      {/* ── Greeting Row ── */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div className="animate-in fade-in slide-in-from-left-8 duration-1000">
          {/* <p className="text-xs font-bold text-[#203090] uppercase tracking-widest mb-1">Tenant Portal</p> */}
          {/* <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {greeting}, <span className="text-[#203090]">{firstName}</span> 👋
          </h1> */}
            <h1 className="text-2xl lg:text-3xl font-display font-semibold text-slate-800 ">
              {getGreeting()}, <span className="text-primary font-medium">{session?.user?.name?.split(' ')[0] || "Tenant"}</span>👋
           </h1>
            <p className="text-slate-500 text-base mb-1">Lets have a productive day.</p>
        </div>
        {/* Status pills */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <span className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border ${payPill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${payDot}`} />
            {payLabel}
          </span>
          {effectiveExpiryDate && (
            <span className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border ${
              isExpiringCrit ? "bg-red-50 text-red-700 border-red-200" :
              isExpiringSoon ? "bg-amber-50 text-amber-700 border-amber-200" :
              "bg-slate-50 text-slate-600 border-slate-200"
            }`}>
              <Calendar size={11} />
              {daysUntilExpiry !== null && daysUntilExpiry > 0
                ? `${daysUntilExpiry}d left`
                : new Date(effectiveExpiryDate).toLocaleDateString("en-GB", { day:"numeric", month:"short" })}
            </span>
          )}
          {profile.stayHistory?.length > 0 && (
            <StayHistoryModalButton stayHistory={profile.stayHistory} />
          )}
        </div>
      </div>

      {/* ── 2-col layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Room card + actions ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Room Identity Card */}
          <div className="relative bg-[#203090] rounded-3xl overflow-hidden min-h-[220px] flex flex-col justify-between p-7 text-white shadow-xl shadow-[#203090]/25">
            {/* Watermark */}
            <div className="absolute -right-4 -bottom-8 font-black text-white/[0.06] leading-none select-none pointer-events-none"
              style={{ fontSize: "clamp(7rem, 18vw, 14rem)" }}>
              {room ? room.roomNumber : "—"}
            </div>
            {/* Top row */}
            <div className="relative z-10">
              {/* <div className="flex items-center gap-2 mb-3">
                <Image src="/convenant-hostel-logo.png" alt="CH" width={28} height={28} className="rounded-lg opacity-90" />
                <span className="text-blue-300 text-[10px] font-bold uppercase tracking-widest">Covenant Hostel</span>
              </div> */}
              <h2 className="font-display text-3xl font-semibold tracking-tight mb-2">
                {room ? `Room ${room.roomNumber}` : "Not Allocated"}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                {room?.block?.name && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-xl text-xs font-semibold text-blue-100">
                    <MapPin size={11} /> {room.block.name}
                  </span>
                )}
                {room?.block?.address && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-xl text-xs font-semibold text-blue-100">
                    <Home size={11} /> {room.block.address}
                  </span>
                )}
              </div>
            </div>
            {/* Bottom stats row */}
            <div className="relative z-10 mt-6 grid grid-cols-3 gap-3">
              <div className="bg-white/10 rounded-2xl p-3.5">
                <p className="text-[9px] font-bold text-blue-300 uppercase tracking-widest mb-1">Rent</p>
                <p className="text-base font-display font-semibold text-white leading-tight">
                  ₦{baseRentAmount.toLocaleString()}
                  <span className="text-blue-300 text-[10px] font-semibold ml-0.5">/{rentFrequencyShorthand}</span>
                </p>
              </div>
              <div className="bg-white/10 rounded-2xl p-3.5">
                <p className="text-[9px] font-bold text-blue-300 uppercase tracking-widest mb-1">Since</p>
                <p className="text-base font-display font-semibold text-white leading-tight">
                  {(effectiveProfile.rentStartDate ? new Date(effectiveProfile.rentStartDate) : new Date(effectiveProfile.createdAt))
                    .toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"2-digit" })}
                </p>
              </div>
              <div className="bg-white/10 rounded-2xl p-3.5">
                <p className="text-[9px] font-bold text-blue-300 uppercase tracking-widest mb-1">Expires</p>
                <p className={`text-base font-display font-semibold leading-tight ${isExpiringCrit ? "text-red-300" : isExpiringSoon ? "text-amber-300" : "text-white"}`}>
                  {effectiveProfile.rentExpiryDate
                    ? new Date(effectiveProfile.rentExpiryDate).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"2-digit" })
                    : "TBD"}
                </p>
              </div>
            </div>
          </div>

          {/* Action Cards — 3-col: Maintenance, Complaints, Emergency */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Maintenance — deep blue tint */}
            <Link href="/tenant/maintenance" className="group relative bg-[#EEF2FF] rounded-3xl p-5 flex flex-col justify-between overflow-hidden min-h-[140px] hover:-translate-y-1 hover:shadow-xl hover:shadow-[#203090]/15 transition-all duration-300">
              {/* Big bg icon */}
              <Wrench
                size={72}
                className="absolute -bottom-3 -right-3 text-[#203090]/10 group-hover:text-[#203090]/20 transition-colors duration-500"
                strokeWidth={1.5}
              />
              <div className="relative z-10 w-10 h-10 bg-[#203090] rounded-2xl flex items-center justify-center shadow-md shadow-[#203090]/30">
                <Wrench size={18} className="text-white" />
              </div>
              <div className="relative z-10 mt-4">
                <p className="text-sm font-black text-[#203090] leading-tight">Fix it.</p>
                <p className="text-[10px] font-semibold text-[#203090]/50 mt-0.5">Log a request</p>
              </div>
            </Link>

            {/* Complaints — warm rose */}
            <Link href="/tenant/complaints" className="group relative bg-[#FFF1F2] rounded-3xl p-5 flex flex-col justify-between overflow-hidden min-h-[140px] hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/15 transition-all duration-300">
              <MessageSquareWarning
                size={72}
                className="absolute -bottom-3 -right-3 text-rose-400/15 group-hover:text-rose-400/25 transition-colors duration-500"
                strokeWidth={1.5}
              />
              <div className="relative z-10 w-10 h-10 bg-rose-500 rounded-2xl flex items-center justify-center shadow-md shadow-rose-500/30">
                <MessageSquareWarning size={18} className="text-white" />
              </div>
              <div className="relative z-10 mt-4">
                <p className="text-sm font-black text-rose-700 leading-tight">Speak up.</p>
                <p className="text-[10px] font-semibold text-rose-400 mt-0.5">File a complaint</p>
              </div>
            </Link>

            {/* Emergency — dial on mobile, copy on desktop */}
            <EmergencyCard />

          </div>
        </div>

        {/* ── RIGHT: Sidebar ── */}
        <div className="justify-between space-y-2">

          {/* Tenant Identity Card */}
          <div className="relative bg-white rounded-3xl overflow-hidden p-5 border border-slate-100 shadow-sm">
            {/* Ghost initial watermark */}
            <div className="absolute -right-4 -bottom-6 text-[7rem] font-black text-slate-100 leading-none select-none pointer-events-none">
              {user.name?.[0]?.toUpperCase() || "T"}
            </div>
            <div className="relative z-10">
              {/* Avatar row */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-[#203090] text-xl shrink-0 border border-slate-100" style={{backgroundColor:'rgba(32,48,144,0.07)'}}>
                  {user.name?.[0]?.toUpperCase() || "T"}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate text-sm">{user.name}</p>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    profile.isStudent
                      ? "bg-blue-100 text-blue-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {profile.isStudent ? "Student" : profile.workType || "Professional"}
                  </span>
                </div>
              </div>
              {/* Info rows */}
              <div className="space-y-2">
                {profile.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone size={11} className="shrink-0 text-slate-300" />
                    <span className="font-medium">{profile.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Mail size={11} className="shrink-0 text-slate-300" />
                  <span className="font-medium truncate">{user.email}</span>
                </div>
                {profile.isStudent && profile.matricNumber && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck size={11} className="shrink-0 text-slate-300" />
                    <span className="font-medium truncate">{profile.matricNumber}{profile.department ? ` · ${profile.department}` : ""}</span>
                  </div>
                )}
                {profile.isStudent && !profile.matricNumber && profile.schoolName && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck size={11} className="shrink-0 text-slate-300" />
                    <span className="font-medium truncate">{profile.schoolName}{profile.schoolYear ? ` · ${profile.schoolYear}` : ""}</span>
                  </div>
                )}
                {!profile.isStudent && profile.companyName && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck size={11} className="shrink-0 text-slate-300" />
                    <span className="font-medium truncate">{profile.companyName}{profile.workType ? ` · ${profile.workType}` : ""}</span>
                  </div>
                )}
              </div>
              {/* Share room */}
              {canShare && (
                <div className="mt-0 pt-4 border-t border-slate-50">
                  <ShareRoomButton roomId={room.id} profileId={profile.id} fullWidth />
                </div>
              )}
            </div>
          </div>

          {/* Guarantor Card */}
          {hasGuarantor && (
            <div className="relative bg-white rounded-3xl overflow-hidden p-5 border border-slate-100 shadow-sm">
              {/* Ghost icon */}
              <User
                size={80}
                className="absolute -right-4 -bottom-4 text-slate-100"
                strokeWidth={1}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 mb-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Guarantor</p>
                </div>
                <p className="font-black text-slate-800 text-base leading-tight mb-0.5">{profile.guarantorName}</p>
                {profile.guarantorRelationship && (
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-3">{profile.guarantorRelationship}</p>
                )}
                <div className="space-y-1.5 text-xs text-slate-500">
                  <p className="flex items-center gap-1.5 font-medium">
                    <Phone size={11} className="shrink-0 text-slate-300" />
                    {profile.guarantorPhone}
                  </p>
                  {profile.guarantorAddress && (
                    <p className="flex items-start gap-1.5 font-medium">
                      <MapPin size={11} className="shrink-0 text-slate-300 mt-0.5" />
                      <span className="leading-relaxed">{profile.guarantorAddress}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Pre-active status screen (shared for all non-ACTIVE states) ──
function PreActiveScreen({ type, room, profile, primaryTenantName = null, hasRejectedPayment = false }) {
  const isRoomSharer = profile?.primaryTenantId != null || primaryTenantName != null;
  const primaryName = primaryTenantName || profile?.primaryTenant?.user?.name || "your primary tenant";

  const cfg = {
    pending: {
      top: "border-t-amber-400",
      gradFrom: "from-amber-50/60",
      icon: <Clock size={32} className="text-amber-500" />,
      title: "Application Under Review",
      body: "Your profile is being reviewed by the administration. You'll have full access once approved.",
      pill: "bg-amber-50 text-amber-700 border-amber-200",
      pillLabel: "Pending Approval",
      cta: null,
    },
    awaiting_payment: {
      top: "border-t-[#203090]",
      gradFrom: "from-blue-50/60",
      icon: <CreditCard size={32} className="text-[#203090]" />,
      title: isRoomSharer ? "Awaiting Primary Tenant Payment" : "Action Required",
      body: isRoomSharer 
        ? `Your application is approved. Please contact ${primaryName} to finalise the room payment so your tenancy can be activated.`
        : "Your application is approved. Proceed to payment to finalise your tenancy.",
      pill: "bg-blue-50 text-[#203090] border-blue-200",
      pillLabel: "Awaiting Payment",
      cta: isRoomSharer ? null : { href: "/tenant/payments", label: "Proceed to Payment", cls: "bg-[#203090] hover:bg-[#1a2673] shadow-[#203090]/20" },
    },
    payment_review: {
      top: "border-t-amber-400",
      gradFrom: "from-amber-50/60",
      icon: <Clock size={32} className="text-amber-500" />,
      title: "Payment Under Review",
      body: "Your receipt is submitted and awaiting landlord confirmation. You'll be notified once approved.",
      pill: "bg-amber-50 text-amber-700 border-amber-200",
      pillLabel: "Pending Approval",
      cta: null,
    },
    payment_approved: {
      top: "border-t-[#203090]",
      gradFrom: "from-blue-50/60",
      icon: <CheckCircle2 size={32} className="text-[#203090]" />,
      title: isRoomSharer ? "Awaiting Activation" : "Almost There!",
      body: isRoomSharer
        ? `Your primary tenant (${primaryName}) has completed the payment. Management will activate your portal shortly.`
        : "Your payment has been submitted. Management will review and activate your portal shortly.",
      pill: "bg-blue-50 text-[#203090] border-blue-200",
      pillLabel: "Awaiting Activation",
      cta: null,
    },
    expired: {
      top: "border-t-red-500",
      gradFrom: "from-red-50/60",
      icon: <AlertCircle size={32} className="text-red-500" />,
      title: "Tenancy Expired",
      body: isRoomSharer
        ? `The room tenancy managed by ${primaryName.split(" ")[0]} has expired. Please contact them to arrange renewal.`
        : profile?.rentExpiryDate
          ? `Your tenancy expired on ${new Date(profile.rentExpiryDate).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}. Renew to regain access.`
          : "Your tenancy has expired. Contact management to renew.",
      pill: "bg-red-50 text-red-700 border-red-200",
      pillLabel: "Expired",
      cta: isRoomSharer ? null : { href: "/tenant/payments", label: "Renew Tenancy", cls: "bg-red-600 hover:bg-red-700 shadow-red-500/20" },
      sharerContact: isRoomSharer ? primaryName : null,
    },
    rejected: {
      top: "border-t-red-500",
      gradFrom: "from-red-50/60",
      icon: <AlertCircle size={32} className="text-red-500" />,
      title: "Application Rejected",
      body: "Your application or payment has been rejected. Please contact management for more details or to resolve the issue.",
      pill: "bg-red-50 text-red-700 border-red-200",
      pillLabel: "Rejected",
      cta: null,
    },
  };

  const c = cfg[type];

  return (
    <div className={`min-h-[72vh] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-100 shadow-xl border-t-4 ${c.top} relative overflow-hidden`}>
      {hasRejectedPayment && (
        <div className="absolute top-0 left-0 w-full bg-red-50 border-b border-red-200 px-6 py-4 flex items-start sm:items-center justify-between gap-4 z-20">
          <div className="flex items-start sm:items-center gap-3">
            <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5 sm:mt-0" />
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-red-900">Payment Rejected</p>
              <p className="text-xs font-medium text-red-700">
                {isRoomSharer 
                  ? `A payment receipt uploaded by ${primaryName} was rejected. Please contact them.` 
                  : "Your previously uploaded payment receipt was rejected. Please review the requirements."}
              </p>
            </div>
          </div>
          {!isRoomSharer && (
            <Link href="/tenant/payments" className="shrink-0 text-xs font-bold px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-500/20 whitespace-nowrap">
              View Details
            </Link>
          )}
        </div>
      )}

      <div className={`absolute inset-0 bg-gradient-to-br ${c.gradFrom} to-transparent pointer-events-none`} />
      <div className="relative z-10 flex flex-col items-center text-center max-w-md gap-5">
        <Image src="/convenant-hostel-logo.png" alt="Covenant Hostel" width={64} height={64} className="rounded-2xl shadow-sm" />
        {/* <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">{c.icon}</div> */}
        <div>
          <h1 className="text-2xl font-display font-semibold text-slate-900 tracking-tight">{c.title}</h1>
          <p className="text-slate-500 mt-2 leading-relaxed text-sm">{c.body}</p>
        </div>
        {room && (
          <div className="flex flex-col md:flex-row items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm text-sm">
           <div className="flex items-center gap-2">
             <MapPin size={13} className="text-[#203090] shrink-0" />
            <span className="font-bold text-slate-700">Room {room.roomNumber}</span>
           </div>
            {room.block?.name && <span className="text-slate-400">· {room.block.name}</span>}
            {room.block?.address && <span className="text-slate-400 text-xs">· {room.block.address}</span>}
          </div>
        )}
        {c.cta && (
          <Link href={c.cta.href} className={`flex items-center gap-2 px-7 py-3.5 text-white text-sm font-bold rounded-2xl shadow-xl transition-all hover:-translate-y-0.5 ${c.cta.cls}`}>
            {c.cta.label} <ArrowRight size={16} />
          </Link>
        )}
        {c.sharerContact && (
          <p className="text-sm font-semibold text-red-500">
            Contact {c.sharerContact}
          </p>
        )}
        <span className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest ${c.pill}`}>
          {c.pillLabel}
        </span>
      </div>
    </div>
  );
}
