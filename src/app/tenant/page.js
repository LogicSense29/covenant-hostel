import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { 
  Home, 
  MapPin, 
  Calendar, 
  User, 
  ShieldCheck, 
  ShieldAlert,
  Phone,
  ArrowRight,
  AlertCircle,
  Clock,
  CreditCard
} from "lucide-react";
import Link from "next/link";
import ShareRoomButton from "@/components/ShareRoomButton";
import StayHistoryModalButton from "@/components/StayHistoryModalButton";

export const dynamic = "force-dynamic";

export default async function TenantDashboard() {
  const session = await getServerSession(authOptions);
  
  const profile = await prisma.tenantProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      room: {
        include: {
          block: true,
          tenants: { select: { id: true } }, // need count for share eligibility
        },
      },
      user: true,
      payments: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      stayHistory: {
        include: { room: { include: { block: true } } },
        orderBy: { startDate: "desc" },
      },
    }
  });

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200 shadow-xl border-t-4 border-t-amber-500 animate-in fade-in duration-700">
        <div className="bg-amber-50 p-4 rounded-2xl mb-6">
          <AlertCircle size={48} className="text-amber-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 text-center">Profile Not Found</h1>
        <p className="text-slate-500 mt-4 text-center max-w-md leading-relaxed">
          We could not find a tenant profile associated with your account. Please contact support if you believe this is an error.
        </p>
      </div>
    );
  }

  const { room, user, payments } = profile;

  // Determine rent amount and frequency from the ticked BASE_RENT rule connected to this room.
  // This is the single source of truth — not room.rentAmount which may differ.
  const matchingRules = profile.roomId ? await prisma.billingRule.findMany({
    where: {
      type: { in: ["Base Rent", "Base_Rent", "BaseRent", "Rent", "RENT", "BASE_RENT"] },
      rooms: { some: { id: profile.roomId } },
    },
  }) : [];

  const rentRule = matchingRules[0] || null;

  // Use the ticked rule's amount; fall back to room.rentAmount if no rule is ticked
  const baseRentAmount = rentRule ? rentRule.amount : (room?.rentAmount ?? 0);
  const rentFrequency = rentRule?.frequency || "YEARLY";

  const frequencyLabelMap = {
    DAILY: "per day",
    MONTHLY: "per month",
    QUARTERLY: "per quarter",
    YEARLY: "per annum",
    PER_SEMESTER: "per semester",
    ONCE: "one-time"
  };
  const rentFrequencyLabel = frequencyLabelMap[rentFrequency] || "per annum";

  const frequencyShorthandMap = {
    DAILY: "day",
    MONTHLY: "mo",
    QUARTERLY: "qtr",
    YEARLY: "yr",
    PER_SEMESTER: "sem",
    ONCE: "once"
  };
  const rentFrequencyShorthand = frequencyShorthandMap[rentFrequency] || "yr";

  if (user.status === "PENDING") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200 shadow-xl border-t-4 border-t-amber-500 animate-in fade-in duration-700">
        <Image src="/convenant-hostel-logo.png" alt="Covenant Hostel" width={72} height={72} className="rounded-2xl mb-6 shadow-sm" />
        <h1 className="text-3xl font-extrabold text-slate-900 text-center">Profile Under Review</h1>
        <p className="text-slate-500 mt-4 text-center max-w-md leading-relaxed">
          Your profile is currently being reviewed by the administration. You will have full access to your portal once your application is approved.
        </p>
        {room && (
          <div className="mt-6 flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-600">
            <MapPin size={14} className="text-blue-500 shrink-0" />
            <span className="font-semibold">Room {room.roomNumber}</span>
            {room.block?.name && <span className="text-slate-400">· {room.block.name}</span>}
          </div>
        )}
        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 w-full max-w-sm text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
          <p className="text-sm font-bold text-amber-600 uppercase tracking-tight">Pending Approval</p>
        </div>
      </div>
    );
  }

  if (user.status === "AWAITING_PAYMENT") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200 shadow-xl border-t-4 border-t-blue-500 animate-in fade-in duration-700">
        <Image src="/convenant-hostel-logo.png" alt="Covenant Hostel" width={72} height={72} className="rounded-2xl mb-6 shadow-sm" />
        <h1 className="text-3xl font-extrabold text-slate-900 text-center">Action Required: Payment</h1>
        <p className="text-slate-500 mt-4 text-center max-w-md leading-relaxed">
          Your application has been approved! To finalize your tenancy and activate your portal, please proceed to the payment section.
        </p>
        {room && (
          <div className="mt-6 flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-sm text-slate-700">
            <MapPin size={14} className="text-blue-500 shrink-0" />
            <span className="font-semibold">Room {room.roomNumber}</span>
            {room.block?.name && <span className="text-slate-500">· {room.block.name}</span>}
            {room.block?.address && <span className="text-slate-400 text-xs">· {room.block.address}</span>}
          </div>
        )}
        <Link 
          href="/tenant/payments"
          className="mt-6 flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
        >
          Proceed to Payment <ArrowRight size={20} />
        </Link>
      </div>
    );
  }

  if (user.status === "PAYMENT_MADE") {
    const hasUnverifiedPayment = payments.some(p => p.status === "PENDING");
    const hasVerifiedPayment = payments.some(p => p.status === "VERIFIED" || p.status === "SUCCESS");

    if (!hasUnverifiedPayment && hasVerifiedPayment) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200 shadow-xl border-t-4 border-t-blue-500 animate-in fade-in duration-700">
          <Image src="/convenant-hostel-logo.png" alt="Covenant Hostel" width={72} height={72} className="rounded-2xl mb-6 shadow-sm" />
          <h1 className="text-3xl font-extrabold text-slate-900 text-center">Payment Approved</h1>
          <p className="text-slate-500 mt-4 text-center max-w-md leading-relaxed">
            Your payment has been successfully verified! The management will activate your portal shortly.
          </p>
          {room && (
            <div className="mt-6 flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-sm text-slate-700">
              <MapPin size={14} className="text-blue-500 shrink-0" />
              <span className="font-semibold">Room {room.roomNumber}</span>
              {room.block?.name && <span className="text-slate-500">· {room.block.name}</span>}
              {room.block?.address && <span className="text-slate-400 text-xs">· {room.block.address}</span>}
            </div>
          )}
          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 w-full max-w-sm text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
            <p className="text-sm font-bold text-blue-600 uppercase tracking-tight">Awaiting Activation</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200 shadow-xl border-t-4 border-t-emerald-500 animate-in fade-in duration-700">
        <Image src="/convenant-hostel-logo.png" alt="Covenant Hostel" width={72} height={72} className="rounded-2xl mb-6 shadow-sm" />
        <h1 className="text-3xl font-extrabold text-slate-900 text-center">Payment Under Review</h1>
        <p className="text-slate-500 mt-4 text-center max-w-md leading-relaxed">
          Your receipt has been submitted and is awaiting landlord confirmation. Your tenancy will be activated once approved.
        </p>
        {room && (
          <div className="mt-6 flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-slate-700">
            <MapPin size={14} className="text-emerald-500 shrink-0" />
            <span className="font-semibold">Room {room.roomNumber}</span>
            {room.block?.name && <span className="text-slate-500">· {room.block.name}</span>}
            {room.block?.address && <span className="text-slate-400 text-xs">· {room.block.address}</span>}
          </div>
        )}
        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 w-full max-w-sm text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
          <p className="text-sm font-bold text-amber-600 uppercase tracking-tight">Pending Approval</p>
        </div>
      </div>
    );
  }

  // ── EXPIRED tenant ──
  if (user.status === "EXPIRED") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200 shadow-xl border-t-4 border-t-red-500 animate-in fade-in duration-700">
        <Image src="/convenant-hostel-logo.png" alt="Covenant Hostel" width={72} height={72} className="rounded-2xl mb-6 shadow-sm" />
        <h1 className="text-3xl font-extrabold text-slate-900 text-center">Tenancy Expired</h1>
        <p className="text-slate-500 mt-4 text-center max-w-md leading-relaxed">
          Your tenancy expired on{" "}
          <strong className="text-slate-700">
            {profile.rentExpiryDate
              ? new Date(profile.rentExpiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
              : "N/A"}
          </strong>. Please contact the hostel management office to renew your tenancy.
        </p>
        {room && (
          <div className="mt-6 flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl text-sm text-slate-700">
            <MapPin size={14} className="text-red-400 shrink-0" />
            <span className="font-semibold">Room {room.roomNumber}</span>
            {room.block?.name && <span className="text-slate-500">· {room.block.name}</span>}
            {room.block?.address && <span className="text-slate-400 text-xs">· {room.block.address}</span>}
          </div>
        )}
        <Link
          href="/tenant/payments"
          className="mt-6 flex items-center gap-2 px-8 py-4 bg-red-600 text-white text-sm font-bold rounded-2xl hover:bg-red-700 shadow-xl shadow-red-500/20 transition-all"
        >
          <CreditCard size={18} /> Renew Tenancy
        </Link>
        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 w-full max-w-sm text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
          <p className="text-sm font-bold text-red-600 uppercase tracking-tight">Expired</p>
        </div>
      </div>
    );
  }

  // ── ACTIVE tenant ──
  const latestPayment = payments[0] || null;
  const hasPendingReceipt = payments.some(p => p.status === "PENDING" && p.receiptUrl);
  const hasVerifiedPayment = payments.some(p => p.status === "VERIFIED" || p.status === "SUCCESS");
  const hasNoPayment = payments.length === 0;

  // Days until rent expires
  const daysUntilExpiry = profile.rentExpiryDate
    ? Math.ceil((new Date(profile.rentExpiryDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  const isExpiringVerySoon = daysUntilExpiry !== null && daysUntilExpiry <= 3 && daysUntilExpiry > 0;

  // Rent status label + color
  let rentStatusLabel = "Active";
  let rentStatusColor = "text-green-600";
  let rentStatusBg = "bg-green-50 text-green-600";
  let rentStatusIcon = <ShieldCheck size={20} />;

  if (hasPendingReceipt && !hasVerifiedPayment) {
    rentStatusLabel = "Pending";
    rentStatusColor = "text-amber-600";
    rentStatusBg = "bg-amber-50 text-amber-600";
    rentStatusIcon = <Clock size={20} />;
  } else if (hasNoPayment) {
    rentStatusLabel = "Unpaid";
    rentStatusColor = "text-red-600";
    rentStatusBg = "bg-red-50 text-red-600";
    rentStatusIcon = <AlertCircle size={20} />;
  }

  const showPaymentAlert = hasNoPayment || (hasPendingReceipt && !hasVerifiedPayment) || isExpiringSoon;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Alert banners ── */}
      {showPaymentAlert && (
        <div className="space-y-3">
          {/* Expiry warning — shown when ≤ 7 days left */}
          {isExpiringSoon && (
            <div className={`rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border ${
              isExpiringVerySoon ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${isExpiringVerySoon ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                  <Calendar size={20} />
                </div>
                <div>
                  <p className={`text-sm font-bold ${isExpiringVerySoon ? "text-red-800" : "text-amber-800"}`}>
                    {isExpiringVerySoon
                      ? `Rent expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"} — action required`
                      : `Rent expires in ${daysUntilExpiry} days`}
                  </p>
                  <p className={`text-xs mt-0.5 ${isExpiringVerySoon ? "text-red-600" : "text-amber-600"}`}>
                    {isExpiringVerySoon
                      ? "Please renew immediately to avoid losing portal access."
                      : "Start your renewal process soon to avoid any disruption."}
                  </p>
                </div>
              </div>
              <Link
                href="/tenant/payments"
                className={`shrink-0 flex items-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-xl transition-colors ${
                  isExpiringVerySoon ? "bg-red-600 hover:bg-red-700" : "bg-amber-500 hover:bg-amber-600"
                }`}
              >
                Renew Now <ArrowRight size={16} />
              </Link>
            </div>
          )}

          {/* Payment / receipt banner */}
          {(hasNoPayment || (hasPendingReceipt && !hasVerifiedPayment)) && (
            <div className={`rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border ${
              hasNoPayment ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${hasNoPayment ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                  {hasNoPayment ? <AlertCircle size={20} /> : <Clock size={20} />}
                </div>
                <div>
                  <p className={`text-sm font-bold ${hasNoPayment ? "text-red-800" : "text-amber-800"}`}>
                    {hasNoPayment ? "Payment required" : "Receipt pending approval"}
                  </p>
                  <p className={`text-xs mt-0.5 ${hasNoPayment ? "text-red-600" : "text-amber-600"}`}>
                    {hasNoPayment
                      ? "Your rent has not been paid yet. Please make a payment to keep your tenancy active."
                      : "Your uploaded receipt is awaiting landlord confirmation. You'll be notified once approved."}
                  </p>
                </div>
              </div>
              {hasNoPayment && (
                <Link
                  href="/tenant/payments"
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors"
                >
                  Pay Now <ArrowRight size={16} />
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">Welcome, {user.name}</h1>
          <p className="text-slate-500 mt-2 flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              Profile Active · Tenant Portal
            </span>
            {profile.rentExpiryDate && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                isExpiringVerySoon
                  ? "bg-red-50 text-red-600 border-red-200"
                  : isExpiringSoon
                  ? "bg-amber-50 text-amber-600 border-amber-200"
                  : "bg-slate-50 text-slate-500 border-slate-200"
              }`}>
                <Calendar size={11} />
                {daysUntilExpiry !== null && daysUntilExpiry > 0
                  ? `Expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}`
                  : `Expires ${new Date(profile.rentExpiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StayHistoryModalButton stayHistory={profile.stayHistory} />
          <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center gap-4">
             <div className="text-right">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rent Status</p>
               <p className={`text-sm font-bold ${rentStatusColor}`}>{rentStatusLabel}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden group">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white relative">
              <div className="relative z-10">
                <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Your Allocation</p>
                <h2 className="text-4xl font-bold mb-4 group-hover:scale-105 transition-transform origin-left duration-500">
                  {room ? `Room ${room.roomNumber}` : 'Not Allocated'}
                </h2>
                {room && (
                  <div className="flex items-center gap-4 text-blue-100/80 text-sm font-medium flex-wrap">
                    {room.block?.name && <span className="flex items-center gap-1"><MapPin size={16} /> {room.block.name}</span>}
                    {room.block?.address && <span className="flex items-center gap-1"><Home size={16} /> {room.block.address}</span>}
                  </div>
                )}
              </div>
              <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                 <Home size={120} strokeWidth={1} />
              </div>
            </div>
            
            <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rent Amount</p>
                <p className="text-lg font-bold text-slate-900">
                  {room ? `₦${baseRentAmount.toLocaleString()}/${rentFrequencyShorthand}` : 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entry Date</p>
                <p className="text-lg font-bold text-slate-900">{new Date(profile.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expiry Date</p>
                <p className="text-lg font-bold text-slate-900">
                  {profile.rentExpiryDate ? new Date(profile.rentExpiryDate).toLocaleDateString() : 'TBD'}
                </p>
              </div>
              <div className="flex items-center justify-end gap-2">
                {room && !profile.primaryTenantId && room.tenants.length < room.capacity && (
                  <ShareRoomButton roomId={room.id} profileId={profile.id} />
                )}
                <Link href="/tenant/payments" className="p-3 bg-slate-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                  <ArrowRight size={24} />
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl">
                   <ShieldCheck size={28} />
                </div>
                <div>
                   <p className="text-sm font-bold text-slate-900">Maintenance</p>
                   <p className="text-xs text-slate-500">Requests handled instantly</p>
                   <Link href="/tenant/maintenance" className="text-xs font-bold text-purple-600 hover:underline mt-2 inline-block">Report Issue</Link>
                </div>
             </div>
             <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl">
                   <ShieldAlert size={28} />
                </div>
                <div>
                   <p className="text-sm font-bold text-slate-900">Complaint Center</p>
                   <p className="text-xs text-slate-500">Report issues or grievances</p>
                   <Link href="/tenant/complaints" className="text-xs font-bold text-red-600 hover:underline mt-2 inline-block">File Complaint</Link>
                </div>
             </div>
          </div>
        </div>


        {/* Sidebar / Additional Info */}
        <div className="space-y-8">
           {/* Guarantor Info */}
{
  profile?.guarantorName && profile.guarantorName.trim() !== "" && profile.guarantorName.trim().toLowerCase() !== "null" && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden border-t-4 border-t-indigo-500">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Guarantor Information</h3>
                <User size={18} className="text-slate-400" />
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                     G
                   </div>
                   <div>
                     <p className="text-sm font-bold text-slate-900">{profile.guarantorName}</p>
                     <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{profile.guarantorRelationship}</p>
                   </div>
                </div>
                <div className="space-y-2 pt-2">
                   <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Phone size={14} className="text-slate-400" />
                      {profile.guarantorPhone}
                   </div>
                   {profile.guarantorAddress && (
                     <div className="flex items-start gap-2 text-xs text-slate-600 pt-1">
                        <MapPin size={14} className="text-slate-400 shrink-0" />
                        <span className="leading-relaxed">{profile.guarantorAddress}</span>
                     </div>
                   )}
                </div>
              </div>
           </div>
  )
}

           {/* Emergency Contact */}
           <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
             <div className="relative z-10">
               <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Emergency Support</h4>
               <p className="text-2xl font-black mb-2 tracking-tight">+234 (0) 800-CHMS-SOS</p>
               <p className="text-xs text-slate-400 leading-relaxed font-medium">Available 24/7 for urgent facility issues and emergency assistance.</p>
             </div>
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Phone size={64} />
             </div>
           </div>


        </div>
      </div>
    </div>
  );
}


