"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Building2, X, Star, MapPin, Menu, Shield, CalendarCheck, ChevronRight } from "lucide-react";

export default function LandingClient({ initialRooms }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBlock, setActiveBlock] = useState("All");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Derive unique blocks for filter chips
  const blocks = useMemo(() => {
    const names = initialRooms
      .map((r) => r.block?.name)
      .filter(Boolean);
    return ["All", ...Array.from(new Set(names))];
  }, [initialRooms]);

  const filteredRooms = useMemo(() => {
    return initialRooms.filter((room) => {
      const matchesSearch =
        !searchQuery ||
        room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.block?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.block?.address?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBlock =
        activeBlock === "All" || room.block?.name === activeBlock;
      return matchesSearch && matchesBlock;
    });
  }, [searchQuery, activeBlock, initialRooms]);

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Sticky Nav ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-[#0b69ff] rounded-lg flex items-center justify-center">
              <Building2 size={16} className="text-white" />
            </div>
            <span className="text-lg font-black text-[#102a43] tracking-tight hidden sm:block">Covenant</span>
          </Link>

          {/* Center search pill (desktop) */}
          {/* <div className="hidden md:flex items-center border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-shadow px-4 py-2 gap-3 cursor-pointer flex-1 max-w-md">
            <Search size={16} className="text-gray-500 shrink-0" />
            <input
              type="text"
              placeholder="Search addresses..."
              className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-700">
                <X size={14} />
              </button>
            )}
          </div> */}

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="#availableRooms" className="hidden md:block text-sm font-semibold text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-full transition-colors">
              Available Rooms
            </Link>
            {/* <Link href="/login" className="hidden md:block text-sm font-semibold text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-full transition-colors">
              Log in
            </Link> */}
            <Link href="/login" className="text-sm font-semibold bg-[#0b69ff] text-white px-5 py-2 rounded-full hover:bg-blue-700 transition-colors">
              Login
            </Link>
            <button
              className="md:hidden p-2 rounded-full border border-gray-200 hover:shadow-md transition-shadow"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={18} className="text-gray-700" />
            </button>
          </div>
        </div>

        {/* Mobile menu — absolutely positioned so it overlays instead of pushing content */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 border-t border-gray-100 bg-white shadow-lg px-4 py-4 flex flex-col gap-3 z-50">
            <div className="flex items-center border border-gray-300 rounded-full px-4 py-2 gap-2">
              <Search size={16} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search rooms..."
                className="flex-1 bg-transparent outline-none text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* <Link href="/book-inspection" className="text-sm font-semibold text-gray-700 py-2">Book Inspection</Link> */}
            <Link href="/login" className="text-sm font-semibold text-gray-700 py-2">Log in</Link>
          </div>
        )}
      </header>

      {/* ── Hero — background image + How It Works overlay ── */}
      <section className="relative overflow-hidden">
        <img
          src="/hostel_hero_bg.png"
          alt="Hostel hero"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/55 to-black/70" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-16 pb-20 space-y-4">
          <p className="text-white/80 text-sm font-semibold uppercase tracking-widest">Housing & Living</p>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tighter tracking-none drop-shadow-lg">
            Find Your Perfect{' '}
            <span>Space</span>
          </h1>
          <p className="text-white/80 text-base md:text-lg max-w-xl font-medium">
            Browse available rooms across all blocks. Transparent pricing, instant availability.
          </p>

          {/* How It Works — inside hero */}
          <div className="w-full max-w-5xl mt-8">
            {/* <div className="mb-6">
              <p className="text-xs font-black text-blue-300 uppercase tracking-widest mb-2">Simple process</p>
              <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
                From browsing to moving in — in 3 steps
              </h2>
            </div> */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  step: "01",
                  icon: <Search size={22} className="text-white" />,
                  title: "Browse available rooms",
                  desc: "Filter by block, check real-time bed availability, and view photos and pricing — all before leaving your seat.",
                },
                {
                  step: "02",
                  icon: <CalendarCheck size={22} className="text-white" />,
                  title: "Schedule an inspection",
                  desc: "Pick a date, pay the small inspection fee, and come see the room in person. No surprises.",
                },
                {
                  step: "03",
                  icon: <Shield size={22} className="text-white" />,
                  title: "Register & move in",
                  desc: "Create your account, complete your profile, sign the tenancy agreement, and you're home.",
                },
              ].map((step, i) => (
                <div key={i} className="flex flex-col gap-3 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 text-left group hover:bg-white/15 transition-colors">
                  <div className="flex items-center gap-3">
                    {/* <div className="w-10 h-10 rounded-xl bg-[#0b69ff] flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                      {step.icon}
                    </div> */}
                    <span className="text-3xl font-black text-white/20 select-none">{step.step}</span>
                  </div>
                  <h3 className="text-sm font-black text-white">{step.title}</h3>
                  <p className="text-xs text-white/70 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Block Filter Chips + Room Grid ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-15 md:py-20" id='availableRooms'>

        {/* Search bar — above the listing */}
<div className="flex justify-center items-center">
          <div className="mb-8 w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-gray-100 p-2 flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-3 flex-1 px-4 py-2">
            <MapPin size={18} className="text-[#0b69ff] shrink-0" />
            <input
              type="text"
              placeholder="Search by room, block or location..."
              className="flex-1 outline-none text-sm text-gray-800 placeholder:text-gray-400 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-gray-300 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </div>
          <button className="flex items-center justify-center gap-2 bg-[#0b69ff] hover:bg-blue-700 text-white font-bold text-sm px-8 py-3 rounded-xl transition-colors">
            <Search size={16} />
            Search
          </button>
        </div>
</div>

        {/* Filter chips */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide mb-8">
          {blocks.map((block) => (
            <button
              key={block}
              onClick={() => setActiveBlock(block)}
              className={`shrink-0 px-5 py-2 rounded-full text-sm font-semibold border transition-all ${
                activeBlock === block
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
              }`}
            >
              {block}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500 font-medium">
            <span className="font-black text-gray-900">{filteredRooms.length}</span> rooms available
          </p>
          {/* <Link href="/book-inspection" className="text-sm font-semibold text-[#0b69ff] hover:underline flex items-center gap-1">
            <CalendarCheck size={14} /> Book an inspection
          </Link> */}
        </div>

        {/* Room grid */}
        {filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRooms.map((room) => (
              <AirbnbRoomCard key={room.id} room={room} />
            ))}
          </div>
        ) : (
          <div className="py-24 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No rooms found</h3>
            <p className="text-gray-500 text-sm max-w-sm">Try a different block or clear your search filter.</p>
            <button
              onClick={() => { setSearchQuery(""); setActiveBlock("All"); }}
              className="mt-6 text-[#0b69ff] font-semibold text-sm hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {/* ── CTA Banner ── */}
      {/* <section className="bg-[#102a43] py-16 px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-black text-white mb-4">Ready to find your room?</h2>
        <p className="text-blue-200 text-sm mb-8 max-w-md mx-auto">Register to apply for a room, track your tenancy, and manage payments — all in one place.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="bg-[#0b69ff] text-white font-bold px-8 py-3 rounded-full hover:bg-blue-700 transition-colors text-sm">
            Get Started
          </Link>
          <Link href="/book-inspection" className="border-2 border-white/30 text-white font-bold px-8 py-3 rounded-full hover:bg-white/10 transition-colors text-sm">
            Book an Inspection
          </Link>
        </div>
      </section> */}

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 border-b border-gray-800 pb-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#0b69ff] rounded-lg flex items-center justify-center">
                <Building2 size={16} className="text-white" />
              </div>
              <span className="text-white font-black text-lg">Covenant</span>
            </div>
            <p className="text-sm leading-relaxed">Premium student hostel management. Simplified discovery, transparent pricing.</p>
          </div>
          <div>
            <h4 className="text-white font-bold text-sm mb-4">Explore</h4>
            <div className="flex flex-col gap-3 text-sm">
              <Link href="/" className="hover:text-white transition-colors">Available Rooms</Link>
              {/* <Link href="/book-inspection" className="hover:text-white transition-colors">Book Inspection</Link> */}
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold text-sm mb-4">Account</h4>
            <div className="flex flex-col gap-3 text-sm">
              <Link href="/login" className="hover:text-white transition-colors">Log In</Link>
               <Link href="/register" className="hover:text-white transition-colors">Register</Link>
              {/* <Link href="/register" className="hover:text-white transition-colors">Sign Up</Link>
              <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link> */}
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold text-sm mb-4">Legal</h4>
            <div className="flex flex-col gap-3 text-sm">
              <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms of Use</Link>
              <Link href="#" className="hover:text-white transition-colors">Contact Support</Link>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© 2026 Covenant. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>All systems operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Airbnb-style room card ──
function AirbnbRoomCard({ room }) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const photos = room.photos?.length > 0 ? room.photos : (room.imageUrl ? [room.imageUrl] : []);
  const isVideo = photos[currentPhotoIndex] && /\.(mp4|mov|webm|ogg|avi)(\?|$)/i.test(photos[currentPhotoIndex]);
  const bedsLeft = room.capacity - (room.tenants?.length ?? 0);
  
  // Get base rent frequency from billing rules
  const baseRentRule = room.baseRentRule || [...(room.billingRules || []), ...(room.specificRules || [])].find(r => r.type === "BASE_RENT");
  const frequencyMap = {
    ONCE: "once",
    DAILY: "day",
    MONTHLY: "month",
    QUARTERLY: "quarter",
    YEARLY: "year",
    PER_SEMESTER: "semester",
  };
  const frequency = baseRentRule ? (frequencyMap[baseRentRule.frequency] || "year") : "year";

  const nextPhoto = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <Link href={`/rooms/${room.id}`} className="group block">
      {/* Photo */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-3">
        {photos.length > 0 ? (
          <>
            {isVideo ? (
              <video
                src={photos[currentPhotoIndex]}
                muted
                playsInline
                loop
                autoPlay
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <img
                src={photos[currentPhotoIndex]}
                alt={`Room ${room.roomNumber}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}

            {/* Carousel navigation */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <ChevronRight size={16} className="rotate-180 text-gray-800" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <ChevronRight size={16} className="text-gray-800" />
                </button>

                {/* Photo indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {photos.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        idx === currentPhotoIndex ? "bg-white w-4" : "bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
            <Building2 size={36} strokeWidth={1.5} />
            <span className="text-xs mt-2 font-medium">No photo</span>
          </div>
        )}

        {/* Available dot */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">Available</span>
        </div>
      </div>

      {/* Info */}
      <div className="px-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">
              {room.block?.name ? `${room.block.name} · ` : ""}Room {room.roomNumber}
            </p>
            <p className="text-gray-500 text-xs truncate mt-0.5">
              {room.block?.address || "Main Campus"}
            </p>
            <p className="text-gray-400 text-xs mt-0.5">
              Max Capacity: {room.capacity} person{room.capacity !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0 text-xs text-gray-700 font-semibold">
            <Star size={12} className="fill-gray-900 text-gray-900" />
            New
          </div>
        </div>
        <p className="text-sm text-gray-900 font-bold mt-2">
          ₦{room.rentAmount.toLocaleString()} <span className="font-normal text-gray-500">/ {frequency}</span>
        </p>
        
        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <Link
            href={`/register?roomId=${room.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 py-2 bg-[#0b69ff] hover:bg-blue-700 text-white text-xs font-bold rounded-lg text-center transition-colors"
          >
            Reserve Room
          </Link>
          <Link
            href={`/book-inspection?roomNumber=${room.roomNumber}&blockName=${encodeURIComponent(room.block?.name || "")}&address=${encodeURIComponent(room.block?.address || "")}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 py-2 border border-gray-300 hover:border-[#0b69ff] text-gray-700 text-xs font-bold rounded-lg text-center transition-colors"
          >
            Book Inspection
          </Link>
        </div>
      </div>
    </Link>
  );
}
