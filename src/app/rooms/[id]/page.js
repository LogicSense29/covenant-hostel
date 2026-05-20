import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  MapPin,
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  Calendar,
  Users,
  ShieldCheck,
  Star,
  Zap,
  ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RoomDetailPage({ params }) {
  const { id } = params;

  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      block: true,
      tenants: {
        where: {
          user: { status: { in: ["ACTIVE", "PAYMENT_MADE"] } }
        },
        select: { id: true }
      },
      billingRules: true,
      specificRules: true,
    },
  });

  if (!room) return notFound();

  const photos =
    room.photos?.length > 0
      ? room.photos
      : room.imageUrl
      ? [room.imageUrl]
      : [];

  const availableBeds = room.capacity - room.tenants.length;

  // Fetch all applicable billing rules:
  // 1. Global rules (isGlobal: true)
  // 2. Block-level rules (blockId matches this room's block)
  // 3. Room-specific rules via both relations
  const allRulesRaw = await prisma.billingRule.findMany({
    where: {
      OR: [
        { isGlobal: true },
        { blockId: room.blockId ?? undefined },
        { rooms: { some: { id: room.id } } },
        { roomId: room.id },
      ],
    },
    orderBy: [{ isGlobal: "desc" }, { type: "asc" }],
  });

  // Sort rules by precedence: Room-specific > Block-level > Global
  const getPrecedenceScore = (rule) => {
    const isRoom = rule.roomId === room.id || 
                   room.billingRules?.some(br => br.id === rule.id) || 
                   room.specificRules?.some(sr => sr.id === rule.id);
    if (isRoom) return 3;
    if (rule.blockId === room.blockId) return 2;
    if (rule.isGlobal) return 1;
    return 0;
  };

  const isBaseRentRule = (r) => {
    const t = String(r.type || "").toUpperCase().replace(/_/g, " ").trim();
    return t === "BASE RENT" || t === "RENT";
  };

  // Group by base rent or title/description to apply overrides
  const rulesMap = {};
  allRulesRaw.forEach(rule => {
    const key = isBaseRentRule(rule) ? "BASE_RENT" : (rule.title || rule.description || rule.id);
    const score = getPrecedenceScore(rule);
    const existing = rulesMap[key];
    if (!existing || score > getPrecedenceScore(existing)) {
      rulesMap[key] = rule;
    }
  });

  const allRules = Object.values(rulesMap);

  const baseRentRule = allRules.find(isBaseRentRule);
  const frequencyMap = {
    ONCE: "once",
    DAILY: "day",
    MONTHLY: "month",
    QUARTERLY: "quarter",
    YEARLY: "year",
    PER_SEMESTER: "semester",
  };
  const rentFrequencyLabel = baseRentRule ? (frequencyMap[baseRentRule.frequency] || "year") : "year";

  const mergedFeatures = [
    ...new Set([
      ...(room.features || []),
      ...(room.block?.features || []),
    ])
  ];

  const additionalRules = allRules.filter(r => !isBaseRentRule(r));
  const totalSum = room.rentAmount + additionalRules.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to listings
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#0b69ff] rounded-lg flex items-center justify-center">
              <Building2 size={14} className="text-white" />
            </div>
            <span className="font-black text-[#102a43] hidden sm:block">Covenant</span>
          </div>
        </div>
      </header>

      {/* ── Photo Gallery ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {photos.length === 0 ? (
          <div className="w-full h-64 md:h-96 rounded-2xl bg-gray-100 flex flex-col items-center justify-center text-gray-300">
            <Building2 size={48} strokeWidth={1.5} />
            <span className="text-sm mt-3 font-medium">No photos available</span>
          </div>
        ) : photos.length === 1 ? (
          <div className="w-full h-64 md:h-[480px] rounded-2xl overflow-hidden">
            <MediaItem src={photos[0]} alt={`Room ${room.roomNumber}`} className="w-full h-full object-cover" />
          </div>
        ) : photos.length === 2 ? (
          /* 2 photos — side by side, equal width */
          <div className="grid grid-cols-2 gap-2 h-64 md:h-[480px] rounded-2xl overflow-hidden">
            {photos.map((src, i) => (
              <div key={i} className="overflow-hidden">
                <MediaItem src={src} alt={`Room photo ${i + 1}`} className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
              </div>
            ))}
          </div>
        ) : photos.length === 3 ? (
          /* 3 photos — 1 large left, 2 stacked right */
          <div className="grid grid-cols-2 gap-2 h-64 md:h-[480px] rounded-2xl overflow-hidden">
            <div className="row-span-2 overflow-hidden">
              <MediaItem src={photos[0]} alt={`Room ${room.roomNumber} main`} className="w-full h-full object-cover" />
            </div>
            <div className="overflow-hidden">
              <MediaItem src={photos[1]} alt="Room photo 2" className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
            </div>
            <div className="overflow-hidden">
              <MediaItem src={photos[2]} alt="Room photo 3" className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
            </div>
          </div>
        ) : photos.length === 4 ? (
          /* 4 photos — 1 large left, 3 stacked right (top one taller) */
          <div className="grid grid-cols-2 gap-2 h-64 md:h-[480px] rounded-2xl overflow-hidden">
            <div className="row-span-2 overflow-hidden">
              <MediaItem src={photos[0]} alt={`Room ${room.roomNumber} main`} className="w-full h-full object-cover" />
            </div>
            <div className="grid grid-rows-3 gap-2 h-full">
              {photos.slice(1, 4).map((src, i) => (
                <div key={i} className="overflow-hidden">
                  <MediaItem src={src} alt={`Room photo ${i + 2}`} className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* 5+ photos — original Airbnb-style grid: 1 large left, 4 thumbnails right */
          <div className="grid grid-cols-4 grid-rows-2 gap-2 h-64 md:h-[480px] rounded-2xl overflow-hidden">
            {/* Main large photo */}
            <div className="col-span-4 md:col-span-2 row-span-2">
              <MediaItem src={photos[0]} alt={`Room ${room.roomNumber} main`} className="w-full h-full object-cover" />
            </div>
            {/* Side thumbnails — only on md+ */}
            {photos.slice(1, 5).map((src, i) => (
              <div key={i} className="hidden md:block col-span-1 row-span-1 overflow-hidden">
                <MediaItem src={src} alt={`Room photo ${i + 2}`} className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Main Content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-12">

          {/* ── LEFT: Details ── */}
          <div className="flex-1 min-w-0">

            {/* Title row */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-gray-200">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-[#102a43] tracking-tight">
                  Room {room.roomNumber}
                  {room.block?.name && (
                    <span className="text-gray-400 font-semibold"> · {room.block.name}</span>
                  )}
                </h1>
                {room.block?.address && (
                  <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-1.5">
                    <MapPin size={14} className="text-[#0b69ff]" />
                    {room.block.address}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0 text-sm font-semibold text-gray-700">
                <Star size={14} className="fill-[#102a43] text-[#102a43]" />
                New listing
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-6 py-6 border-b border-gray-200">
              <Stat label="Maximum Capacity" value={`${room.capacity} person${room.capacity !== 1 ? "s" : ""}`} />
              {/* <Stat label="Available" value={`${availableBeds} space${availableBeds !== 1 ? "s" : ""}`} /> */}
              <Stat label="Block" value={room.block?.name || "Main Campus"} />
              {/* <Stat label="Status" value="Available" highlight /> */}
            </div>

            {/* Block description */}
            {room.block?.description && (
              <div className="py-8 border-b border-gray-200">
                <h2 className="text-lg font-black text-[#102a43] mb-3">About the block</h2>
                <p className="text-gray-600 leading-relaxed text-sm">{room.block.description}</p>
              </div>
            )}

            {/* What's included */}
            <div className="py-8 border-b border-gray-200">
              <h2 className="text-lg font-black text-[#102a43] mb-6">What's included</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mergedFeatures && mergedFeatures.length > 0 ? (
                  mergedFeatures.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-gray-700">
                      <CheckCircle2 size={18} className="text-[#0b69ff] shrink-0" />
                      <span className="font-medium">{feature}</span>
                    </div>
                  ))
                ) : (
                  [
                    { label: "Secure premises" },
                    { label: "Electricity supply" },
                    { label: "Shared facilities" },
                    { label: "Annual tenancy" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-gray-700">
                      <CheckCircle2 size={18} className="text-[#0b69ff] shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Billing rules */}
            {additionalRules.length > 0 && (
              <div className="py-8 border-b border-gray-200">
                <h2 className="text-lg font-black text-[#102a43] mb-6">Services & charges</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {additionalRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{rule.title || rule.description}</p>
                        <p className="text-xs text-gray-400 mt-0.5 capitalize">{rule.frequency?.toLowerCase() ?? "once"}</p>
                      </div>
                      <span className="text-sm font-black text-[#0b69ff] shrink-0 ml-4">
                        ₦{rule.amount.toLocaleString()}/{frequencyMap[rule.frequency] || "once"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            <div className="py-8">
              <h2 className="text-lg font-black text-[#102a43] mb-4">Location</h2>
              <div className="flex items-start gap-3 p-5 rounded-2xl bg-[#102a43] text-white">
                <MapPin size={20} className="text-[#0b69ff] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">{room.block?.name || "Main Campus"}</p>
                  <p className="text-gray-400 text-sm mt-0.5">{room.block?.address || "Campus grounds"}</p>
                </div>
              </div>
            </div>

          </div>

          {/* ── RIGHT: Booking Card ── */}
          <div className="lg:w-[380px] shrink-0">
            <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl shadow-xl p-6 md:p-8">

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-black text-[#102a43]">
                  ₦{room.rentAmount.toLocaleString()}
                </span>
                <span className="text-gray-500 text-sm font-medium">/ {rentFrequencyLabel}</span>
              </div>

              {/* Room details summary */}
              <div className="rounded-xl border border-gray-200 overflow-hidden mb-6">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Room</span>
                  <span className="text-sm font-bold text-gray-900">Room {room.roomNumber}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Maximum Capacity</span>
                  <span className="text-sm font-bold text-gray-900">{room.capacity} person{room.capacity !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Available</span>
                  <span className="text-sm font-bold text-green-600">{availableBeds} space{availableBeds !== 1 ? "s" : ""} free</span>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="mb-6 pt-6 border-t border-gray-100 space-y-2">
                <div className="flex justify-between items-start text-sm text-gray-600">
                  <div className="min-w-0 mr-4">
                    <span className="font-semibold text-gray-800 block truncate">Base Room Rent</span>
                  </div>
                  <span className="font-semibold shrink-0">₦{room.rentAmount.toLocaleString()}/{rentFrequencyLabel}</span>
                </div>
                {additionalRules.map((rule) => (
                  <div key={rule.id} className="flex justify-between items-start text-sm text-gray-600">
                    <div className="min-w-0 mr-4">
                      <span className="font-semibold text-gray-800 block truncate">{rule.title || rule.description}</span>
                    </div>
                    <span className="font-semibold shrink-0">₦{rule.amount.toLocaleString()}/{frequencyMap[rule.frequency] || "once"}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-black text-[#102a43] pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>
                    ₦{totalSum.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-3">
                <Link
                  href={`/register?roomId=${room.id}`}
                  className="w-full py-4 bg-[#0b69ff] hover:bg-blue-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
                >
                  Reserve this room <ChevronRight size={16} />
                </Link>
                <Link
                  href={`/book-inspection?roomId=${room.id}&roomNumber=${room.roomNumber}&blockName=${encodeURIComponent(room.block?.name || "")}&address=${encodeURIComponent(room.block?.address || "")}`}
                  className="w-full py-4 border-2 border-gray-200 hover:border-[#0b69ff] text-gray-800 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  Book an inspection
                </Link>
              </div>

              {/* Trust signals */}
              <div className="mt-6 space-y-2 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle2 size={14} className="text-green-500" />
                  No reservation fees required
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ShieldCheck size={14} className="text-[#0b69ff]" />
                  Verified listing
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 mt-12 py-8 px-4 text-center text-xs text-gray-400">
        <p>© 2026 Covenant. All rights reserved.</p>
      </footer>
    </div>
  );
}

// ── Helpers ──

function MediaItem({ src, alt, className }) {
  const isVideo = /\.(mp4|mov|webm|ogg|avi)(\?|$)/i.test(src);
  return isVideo ? (
    <video src={src} muted playsInline loop autoPlay className={className} />
  ) : (
    <img src={src} alt={alt} className={className} />
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-sm font-bold ${highlight ? "text-green-600" : "text-[#102a43]"}`}>{value}</p>
    </div>
  );
}
