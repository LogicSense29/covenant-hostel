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
          tenants: { 
            where: { user: { status: { notIn: ["REJECTED", "EXPIRED"] } } },
            select: { id: true } 
          }, // need count for share eligibility
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-white/80 backdrop-blur-3xl rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group animate-in fade-in duration-700">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent opacity-50"></div>
        <Image src="/convenant-hostel-logo.png" alt="Covenant Hostel" width={80} height={80} className="rounded-3xl mb-8 shadow-sm relative z-10 group-hover:scale-105 transition-transform duration-500" />
        <h1 className="text-4xl font-extrabold text-slate-900 text-center tracking-tight relative z-10">Application Review</h1>
        <p className="text-base text-slate-500 mt-5 text-center max-w-lg leading-relaxed relative z-10">
          Your profile is currently being reviewed by the administration. You will have full access to your portal once your application is approved.
        </p>
        {room && (
          <div className="mt-8 flex items-center gap-3 px-6 py-3.5 bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl shadow-sm relative z-10">
            <div className="p-2 bg-[#203090]/5 rounded-xl"><MapPin size={18} className="text-[#203090]" /></div>
            <span className="font-bold text-slate-700 text-base">Room {room.roomNumber}</span>
            {room.block?.name && <span className="text-slate-400 font-medium">· {room.block.name}</span>}
          </div>
        )}
        <div className="mt-8 p-5 bg-amber-50/50 backdrop-blur-md rounded-2xl border border-amber-100/50 w-full max-w-sm text-center relative z-10">
          <p className="text-xs font-bold text-amber-600/70 uppercase tracking-widest mb-1.5">Current Status</p>
          <p className="text-base font-extrabold text-amber-600 uppercase tracking-wider">Pending Approval</p>
        </div>
      </div>
    );
  }

  if (user.status === "AWAITING_PAYMENT") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-white/80 backdrop-blur-3xl rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group animate-in fade-in duration-700">
        <div className="absolute inset-0 bg-gradient-to-br from-[#203090]/5 to-transparent opacity-50"></div>
        <Image src="/convenant-hostel-logo.png" alt="Covenant Hostel" width={80} height={80} className="rounded-3xl mb-8 shadow-sm relative z-10 group-hover:scale-105 transition-transform duration-500" />
        <h1 className="text-4xl font-extrabold text-slate-900 text-center tracking-tight relative z-10">Action Required</h1>
        <p className="text-base text-slate-500 mt-5 text-center max-w-lg leading-relaxed relative z-10">
          Your application has been approved! To finalize your tenancy and activate your portal, please proceed to the payment section.
        </p>
        {room && (
          <div className="mt-8 flex items-center gap-3 px-6 py-3.5 bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl shadow-sm relative z-10">
            <div className="p-2 bg-[#203090]/5 rounded-xl"><MapPin size={18} className="text-[#203090]" /></div>
            <span className="font-bold text-slate-700 text-base">Room {room.roomNumber}</span>
            {room.block?.name && <span className="text-slate-500 font-medium">· {room.block.name}</span>}
            {room.block?.address && <span className="text-slate-400 text-sm">· {room.block.address}</span>}
          </div>
        )}
        <Link 
          href="/tenant/payments"
          className="mt-8 flex items-center gap-3 px-8 py-4 bg-[#203090] text-white rounded-2xl text-base font-bold hover:bg-[#1a2673] shadow-lg shadow-[#203090]/20 hover:shadow-xl hover:shadow-[#203090]/30 hover:-translate-y-1 transition-all duration-300 relative z-10"
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
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-white/80 backdrop-blur-3xl rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group animate-in fade-in duration-700">
          <div className="absolute inset-0 bg-gradient-to-br from-[#203090]/5 to-transparent opacity-50"></div>
          <Image src="/convenant-hostel-logo.png" alt="Covenant Hostel" width={80} height={80} className="rounded-3xl mb-8 shadow-sm relative z-10 group-hover:scale-105 transition-transform duration-500" />
          <h1 className="text-4xl font-extrabold text-slate-900 text-center tracking-tight relative z-10">Payment Approved</h1>
          <p className="text-base text-slate-500 mt-5 text-center max-w-lg leading-relaxed relative z-10">
            Your payment has been successfully verified! The management will activate your portal shortly.
          </p>
          {room && (
            <div className="mt-8 flex items-center gap-3 px-6 py-3.5 bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl shadow-sm relative z-10">
              <div className="p-2 bg-[#203090]/5 rounded-xl"><MapPin size={18} className="text-[#203090]" /></div>
              <span className="font-bold text-slate-700 text-base">Room {room.roomNumber}</span>
              {room.block?.name && <span className="text-slate-500 font-medium">· {room.block.name}</span>}
              {room.block?.address && <span className="text-slate-400 text-sm">· {room.block.address}</span>}
            </div>
          )}
          <div className="mt-8 p-5 bg-[#203090]/5 backdrop-blur-md rounded-2xl border border-[#203090]/10 w-full max-w-sm text-center relative z-10">
            <p className="text-xs font-bold text-[#203090]/70 uppercase tracking-widest mb-1.5">Current Status</p>
            <p className="text-base font-extrabold text-[#203090] uppercase tracking-wider">Awaiting Activation</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-white/80 backdrop-blur-3xl rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group animate-in fade-in duration-700">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent opacity-50"></div>
        <Image src="/convenant-hostel-logo.png" alt="Covenant Hostel" width={80} height={80} className="rounded-3xl mb-8 shadow-sm relative z-10 group-hover:scale-105 transition-transform duration-500" />
        <h1 className="text-4xl font-extrabold text-slate-900 text-center tracking-tight relative z-10">Payment Under Review</h1>
        <p className="text-base text-slate-500 mt-5 text-center max-w-lg leading-relaxed relative z-10">
          Your receipt has been submitted and is awaiting landlord confirmation. Your tenancy will be activated once approved.
        </p>
        {room && (
          <div className="mt-8 flex items-center gap-3 px-6 py-3.5 bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl shadow-sm relative z-10">
            <div className="p-2 bg-emerald-50 rounded-xl"><MapPin size={18} className="text-emerald-500" /></div>
            <span className="font-bold text-slate-700 text-base">Room {room.roomNumber}</span>
            {room.block?.name && <span className="text-slate-500 font-medium">· {room.block.name}</span>}
            {room.block?.address && <span className="text-slate-400 text-sm">· {room.block.address}</span>}
          </div>
        )}
        <div className="mt-8 p-5 bg-amber-50/50 backdrop-blur-md rounded-2xl border border-amber-100/50 w-full max-w-sm text-center relative z-10">
          <p className="text-xs font-bold text-amber-600/70 uppercase tracking-widest mb-1.5">Current Status</p>
          <p className="text-base font-extrabold text-amber-600 uppercase tracking-wider">Pending Approval</p>
        </div>
      </div>
    );
  }

  // ── EXPIRED tenant ──
  if (user.status === "EXPIRED") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-white/80 backdrop-blur-3xl rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group animate-in fade-in duration-700">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-transparent opacity-50"></div>
        <Image src="/convenant-hostel-logo.png" alt="Covenant Hostel" width={80} height={80} className="rounded-3xl mb-8 shadow-sm relative z-10 group-hover:scale-105 transition-transform duration-500" />
        <h1 className="text-4xl font-extrabold text-slate-900 text-center tracking-tight relative z-10">Tenancy Expired</h1>
        <p className="text-base text-slate-500 mt-5 text-center max-w-lg leading-relaxed relative z-10">
          Your tenancy expired on{" "}
          <strong className="text-slate-700 font-bold">
            {profile.rentExpiryDate
              ? new Date(profile.rentExpiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
              : "N/A"}
          </strong>. Please contact the hostel management office to renew your tenancy.
        </p>
        {room && (
          <div className="mt-8 flex items-center gap-3 px-6 py-3.5 bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl shadow-sm relative z-10">
            <div className="p-2 bg-red-50 rounded-xl"><MapPin size={18} className="text-red-500" /></div>
            <span className="font-bold text-slate-700 text-base">Room {room.roomNumber}</span>
            {room.block?.name && <span className="text-slate-500 font-medium">· {room.block.name}</span>}
            {room.block?.address && <span className="text-slate-400 text-sm">· {room.block.address}</span>}
          </div>
        )}
        <Link
          href="/tenant/payments"
          className="mt-8 flex items-center gap-3 px-8 py-4 bg-red-600 text-white text-base font-bold rounded-2xl hover:bg-red-700 shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 hover:-translate-y-1 transition-all duration-300 relative z-10"
        >
          <CreditCard size={20} /> Renew Tenancy
        </Link>
        <div className="mt-6 p-5 bg-red-50/50 backdrop-blur-md rounded-2xl border border-red-100/50 w-full max-w-sm text-center relative z-10">
          <p className="text-xs font-bold text-red-600/70 uppercase tracking-widest mb-1.5">Current Status</p>
          <p className="text-base font-extrabold text-red-600 uppercase tracking-wider">Expired</p>
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
  let rentStatusColor = "text-emerald-500";
  let rentStatusBg = "bg-white/60 border-emerald-200 text-emerald-600 backdrop-blur-md shadow-sm";
  let rentStatusIcon = <ShieldCheck size={18} />;

  if (hasPendingReceipt && !hasVerifiedPayment) {
    rentStatusLabel = "Pending";
    rentStatusColor = "text-amber-500";
    rentStatusBg = "bg-white/60 border-amber-200 text-amber-600 backdrop-blur-md shadow-sm";
    rentStatusIcon = <Clock size={18} />;
  } else if (hasNoPayment) {
    rentStatusLabel = "Unpaid";
    rentStatusColor = "text-red-500";
    rentStatusBg = "bg-white/60 border-red-200 text-red-600 backdrop-blur-md shadow-sm";
    rentStatusIcon = <AlertCircle size={18} />;
  }

  const showPaymentAlert = hasNoPayment || (hasPendingReceipt && !hasVerifiedPayment) || isExpiringSoon;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">

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
            <div className={`rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${
              hasNoPayment ? "bg-red-50/80 border-red-100" : "bg-amber-50/80 border-amber-100"
            }`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl shrink-0 ${hasNoPayment ? "bg-white text-red-600 shadow-sm shadow-red-500/10" : "bg-white text-amber-600 shadow-sm shadow-amber-500/10"}`}>
                  {hasNoPayment ? <AlertCircle size={24} /> : <Clock size={24} />}
                </div>
                <div>
                  <p className={`text-base font-bold ${hasNoPayment ? "text-red-900" : "text-amber-900"}`}>
                    {hasNoPayment ? "Payment required" : "Receipt pending approval"}
                  </p>
                  <p className={`text-sm mt-1 font-medium ${hasNoPayment ? "text-red-700" : "text-amber-700"}`}>
                    {hasNoPayment
                      ? "Your rent has not been paid yet. Please make a payment to keep your tenancy active."
                      : "Your uploaded receipt is awaiting landlord confirmation. You'll be notified once approved."}
                  </p>
                </div>
              </div>
              {hasNoPayment && (
                <Link
                  href="/tenant/payments"
                  className="shrink-0 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white text-sm font-bold rounded-2xl hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 hover:-translate-y-0.5"
                >
                  Pay Now <ArrowRight size={18} />
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-8 md:gap-10 pb-10">

        {/* Mobile Greeting */}
        <div className="lg:hidden">
          <h1 className="text-xl font-display font-medium text-slate-800 leading-snug mb-1 animate-in fade-in slide-in-from-left-4 duration-700">
            Good morning, <span className="text-[#203090]">{user.name.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-500 text-sm">Let's have a productive day.</p>
        </div>

        {/* ── Stat Cards Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

          {/* Active Status */}
          <div className="col-span-1 bg-gradient-to-br from-[#203090]/90 to-[#1a2673] rounded-2xl px-5 py-4 flex items-center gap-3 shadow-lg shadow-[#203090]/20">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse" />
            </div>
            <div>
              <p className="text-indigo-200/70 text-[10px] font-bold uppercase tracking-widest">Status</p>
              <p className="text-white text-sm font-semibold">Active</p>
            </div>
          </div>

          {/* Expiry Date */}
          <div className={`col-span-1 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm border ${
            isExpiringVerySoon
              ? "bg-red-50 border-red-100 shadow-red-100"
              : isExpiringSoon
              ? "bg-amber-50 border-amber-100 shadow-amber-100"
              : "bg-white/60 backdrop-blur-xl border-white/80"
          }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isExpiringVerySoon ? "bg-red-100 text-red-600" : isExpiringSoon ? "bg-amber-100 text-amber-600" : "bg-[#203090]/8 text-[#203090]"
            }`} style={(!isExpiringVerySoon && !isExpiringSoon) ? { backgroundColor: 'rgba(32,48,144,0.08)' } : {}}>
              <Calendar size={16} strokeWidth={2} />
            </div>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${isExpiringVerySoon ? "text-red-400" : isExpiringSoon ? "text-amber-400" : "text-slate-400"}`}>Expiry</p>
              <p className={`text-sm font-semibold ${isExpiringVerySoon ? "text-red-700" : isExpiringSoon ? "text-amber-700" : "text-slate-700"}`}>
                {profile.rentExpiryDate
                  ? (daysUntilExpiry !== null && daysUntilExpiry > 0
                    ? `${daysUntilExpiry}d left`
                    : "Expired")
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Rent Status */}
          <div className="col-span-1 bg-white/60 backdrop-blur-xl border border-white/80 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              rentStatusLabel === "Active" ? "bg-emerald-50 text-emerald-600" :
              rentStatusLabel === "Pending" ? "bg-amber-50 text-amber-600" :
              "bg-red-50 text-red-600"
            }`}>
              {rentStatusIcon}
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Rent</p>
              <p className={`text-sm font-semibold ${
                rentStatusLabel === "Active" ? "text-emerald-700" :
                rentStatusLabel === "Pending" ? "text-amber-700" :
                "text-red-700"
              }`}>{rentStatusLabel}</p>
            </div>
          </div>

          {/* Stay History */}
          <div className="col-span-1 bg-white/60 backdrop-blur-xl border border-white/80 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
            <StayHistoryModalButton stayHistory={profile.stayHistory} compact />
          </div>

        </div>

        {/* ── HERO: Welcome Home Card ── */}
        <div className={`relative rounded-3xl overflow-hidden shadow-2xl group ${profile?.guarantorName && profile.guarantorName.trim() !== "" && profile.guarantorName.trim().toLowerCase() !== "null" ? "xl:grid xl:grid-cols-12" : ""}`}>
          {/* Hero Image Side */}
          <div className={`relative overflow-hidden ${profile?.guarantorName && profile.guarantorName.trim() !== "" && profile.guarantorName.trim().toLowerCase() !== "null" ? "xl:col-span-8" : ""}`} style={{ minHeight: "380px" }}>
            <img
              src="/cozy_room_bg.png"
              alt="Your cozy room"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Warm dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/5" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

            {/* Watermark */}
            <div className="absolute -bottom-4 -right-4 text-[10rem] md:text-[14rem] font-bold text-white/[0.04] leading-none tracking-tighter pointer-events-none select-none">
              {room ? room.roomNumber : '?'}
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-between p-8" style={{ minHeight: "380px" }}>
              <div>
                <p className="text-indigo-300/90 font-semibold uppercase tracking-widest text-xs mb-2">Your Home 🏠</p>
                <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tight mb-4 drop-shadow-lg">
                  {room ? `Room ${room.roomNumber}` : 'Not Allocated'}
                </h2>
                {room && (
                  <div className="flex items-center gap-3 flex-wrap">
                    {room.block?.name && <span className="px-4 py-2 bg-white/15 backdrop-blur-xl border border-white/20 rounded-2xl text-sm font-medium text-white/90"><MapPin size={14} className="inline mr-1.5 text-indigo-300" />{room.block.name}</span>}
                    {room.block?.address && <span className="px-4 py-2 bg-white/15 backdrop-blur-xl border border-white/20 rounded-2xl text-sm font-medium text-white/90"><Home size={14} className="inline mr-1.5 text-indigo-300" />{room.block.address}</span>}
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-wrap gap-4 items-end">
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-5 rounded-2xl shadow-xl flex-1 min-w-[140px]">
                  <p className="text-[10px] font-bold text-indigo-300/80 uppercase tracking-widest mb-2">Monthly Rent</p>
                  <p className="text-2xl font-semibold text-white tracking-tight">
                    {room ? `₦${baseRentAmount.toLocaleString()}` : 'N/A'}
                    {room && <span className="text-sm font-medium text-white/50 ml-1">/{rentFrequencyShorthand}</span>}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-5 rounded-2xl shadow-xl flex-1 min-w-[140px]">
                  <p className="text-[10px] font-bold text-indigo-300/80 uppercase tracking-widest mb-2">Resident Since</p>
                  <p className="text-xl font-medium text-white/90 tracking-tight mt-1">{new Date(profile.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {room && !profile.primaryTenantId && room.tenants.length < room.capacity && (
                    <div className="flex-1 sm:flex-none"><ShareRoomButton roomId={room.id} profileId={profile.id} /></div>
                  )}
                  <Link href="/tenant/payments" className="flex-1 sm:flex-none px-7 py-4 bg-white/15 hover:bg-white/25 backdrop-blur-xl border border-white/25 text-white rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 shadow-xl group/btn font-semibold">
                    Payments <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Guarantor Panel */}
          {profile?.guarantorName && profile.guarantorName.trim() !== "" && profile.guarantorName.trim().toLowerCase() !== "null" && (
            <div className="xl:col-span-4 bg-white/90 backdrop-blur-2xl p-8 border-t xl:border-t-0 xl:border-l border-slate-100 flex flex-col justify-center relative overflow-hidden group/guarantor">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-amber-100/70 to-transparent rounded-bl-full pointer-events-none" />
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-6 relative z-10">Your Guarantor</p>
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 shrink-0 flex items-center justify-center shadow-inner group-hover/guarantor:scale-105 transition-transform duration-500">
                  <User size={28} strokeWidth={1.5} className="text-amber-500" />
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-xl font-semibold text-slate-800 tracking-tight mb-2 truncate">{profile.guarantorName}</h3>
                  <div className="flex flex-col gap-1.5 text-sm font-medium text-slate-500">
                    <span className="truncate flex items-center gap-2"><Phone size={14} className="text-slate-400 shrink-0" /> {profile.guarantorPhone}</span>
                    {profile.guarantorAddress && <span className="truncate flex items-center gap-2 mt-0.5"><MapPin size={14} className="text-slate-400 shrink-0" /> {profile.guarantorAddress}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Quick Action Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">

          {/* Maintenance */}
          <Link href="/tenant/maintenance" className="bg-white/70 backdrop-blur-2xl border border-white/60 rounded-3xl p-7 flex flex-col justify-between group hover:-translate-y-1.5 hover:shadow-xl hover:shadow-indigo-200/50 hover:bg-white/90 transition-all duration-300 relative overflow-hidden min-h-[200px] shadow-sm">
            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-indigo-100/70 to-transparent rounded-bl-full pointer-events-none" />
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-5 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 relative z-10 shadow-sm">
              <ShieldCheck size={22} strokeWidth={1.8} />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-semibold text-slate-800 tracking-tight mb-1">Maintenance</h3>
              <p className="text-slate-500 font-medium text-sm">Report an issue in your room</p>
            </div>
          </Link>

          {/* Complaints */}
          <Link href="/tenant/complaints" className="bg-white/70 backdrop-blur-2xl border border-white/60 rounded-3xl p-7 flex flex-col justify-between group hover:-translate-y-1.5 hover:shadow-xl hover:shadow-rose-200/50 hover:bg-white/90 transition-all duration-300 relative overflow-hidden min-h-[200px] shadow-sm">
            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-rose-100/70 to-transparent rounded-bl-full pointer-events-none" />
            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-500 mb-5 group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300 relative z-10 shadow-sm">
              <ShieldAlert size={22} strokeWidth={1.8} />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-semibold text-slate-800 tracking-tight mb-1">Complaints</h3>
              <p className="text-slate-500 font-medium text-sm">Lodge a grievance with management</p>
            </div>
          </Link>

          {/* Emergency */}
          <div className="bg-slate-900 rounded-3xl p-7 flex flex-col justify-between group hover:-translate-y-1.5 hover:shadow-xl hover:shadow-red-500/20 transition-all duration-300 relative overflow-hidden min-h-[200px]">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-rose-600/20 rounded-full blur-[50px] pointer-events-none animate-pulse" />
            <div className="flex items-start justify-between mb-5 relative z-10">
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                <p className="text-[10px] font-bold text-white/90 uppercase tracking-widest">Emergency</p>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-md group-hover:bg-rose-500 transition-colors shadow-inner">
                <Phone size={22} strokeWidth={1.8} />
              </div>
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-semibold text-white tracking-tight mb-1">+234 800-SOS</h3>
              <p className="text-sm font-medium text-slate-400">24/7 Support line</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
