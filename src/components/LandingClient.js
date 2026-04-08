"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Building2, X, Star, Users, ChevronDown, MapPin, Menu, Shield, Zap, CalendarCheck, ChevronRight } from "lucide-react";
import PublicRoomCard from "@/components/PublicRoomCard";

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
          <div className="hidden md:flex items-center border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-shadow px-4 py-2 gap-3 cursor-pointer flex-1 max-w-md">
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
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/book-inspection" className="hidden md:block text-sm font-semibold text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-full transition-colors">
              Book Inspection
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
            <Link href="/book-inspection" className="text-sm font-semibold text-gray-700 py-2">Book Inspection</Link>
            <Link href="/login" className="text-sm font-semibold text-gray-700 py-2">Log in</Link>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative h-[360px] md:h-[420px] overflow-hidden">
        <img
          src="/hostel_hero_bg.png"
          alt="Hostel hero"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/50 to-black/60" />

        <div className="relative z-10 h-[360px] md:h-[420px] flex flex-col items-center justify-center text-center px-4 space-y-4">
          <p className="text-white/80 text-sm font-semibold uppercase tracking-widest">Housing & Living</p>
          {/* Student Housing · Campus Living */}
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tighter tracking-none drop-shadow-lg">
            Find Your Perfect {' '}
            <span className="text-[]">Space</span>
          </h1>
          <p className="text-white/80 text-base md:text-lg max-w-xl font-medium">
            Browse available rooms across all blocks. Transparent pricing, instant availability.
          </p>

          {/* Hero search bar */}
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-2 flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-3 flex-1 px-4 py-2">
              <MapPin size={18} className="text-[#0b69ff] shrink-0" />
              <input
                type="text"
                placeholder="Search by location..."
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
      </section>

      {/* ── How It Works ── */}
      <section className="pt-15 md:pt-20 px-4 bg-white overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <p className="text-xs font-black text-[#0b69ff] uppercase tracking-widest mb-3">Simple process</p>
            <h2 className="text-2xl md:text-3xl font-black text-[#102a43] leading-tight">
              From browsing to<br className="block" /> moving in — in 3 steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-0 relative">
            {/* Connector line (desktop only) */}
            {/* <div className="hidden md:block absolute top-10 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px bg-gray-200 z-0" /> */}

            {[
              {
                step: "01",
                icon: <Search size={22} className="text-white" />,
                title: "Browse available rooms",
                desc: "Filter by block, check real-time bed availability, and view photos and pricing — all before leaving your seat.",
                cta: "Start browsing",
                href: "#rooms",
              },
              {
                step: "02",
                icon: <CalendarCheck size={22} className="text-white" />,
                title: "Schedule an inspection",
                desc: "Pick a date, pay the small inspection fee, and come see the room in person. No surprises.",
                cta: "Book inspection",
                href: "/book-inspection",
              },
              {
                step: "03",
                icon: <Shield size={22} className="text-white" />,
                title: "Register & move in",
                desc: "Create your account, complete your profile, sign the tenancy agreement, and you're home.",
                cta: "Create account",
                href: "/register",
              },
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col gap-5 p-8 md:p-10 group">
                {/* Step number + icon */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#0b69ff] flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                    {step.icon}
                  </div>
                  <span className="text-4xl font-black text-gray-100 select-none">{step.step}</span>
                </div>

                <div>
                  <h3 className="text-base font-black text-[#102a43] mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>

                <Link
                  href={step.href}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-[#0b69ff] uppercase tracking-widest hover:gap-3 transition-all duration-200"
                >
                  {step.cta} <ChevronRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Block Filter Chips + Room Grid ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-15 md:py-20">

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
          <Link href="/book-inspection" className="text-sm font-semibold text-[#0b69ff] hover:underline flex items-center gap-1">
            <CalendarCheck size={14} /> Book an inspection
          </Link>
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
              <Link href="/book-inspection" className="hover:text-white transition-colors">Book Inspection</Link>
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
  const photo = room.photos?.length > 0 ? room.photos[0] : room.imageUrl;
  const isVideo = photo && /\.(mp4|mov|webm|ogg|avi)(\?|$)/i.test(photo);
  const bedsLeft = room.capacity - (room.tenants?.length ?? 0);

  return (
    <Link href={`/rooms/${room.id}`} className="group block">
      {/* Photo */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-3">
        {photo ? (
          isVideo ? (
            <video
              src={photo}
              muted
              playsInline
              loop
              autoPlay
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <img
              src={photo}
              alt={`Room ${room.roomNumber}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
            <Building2 size={36} strokeWidth={1.5} />
            <span className="text-xs mt-2 font-medium">No photo</span>
          </div>
        )}

        {/* Beds left badge */}
        {bedsLeft <= 2 && bedsLeft > 0 && (
          <div className="absolute top-3 left-3 bg-white text-gray-900 text-xs font-bold px-3 py-1 rounded-full shadow">
            Only {bedsLeft} bed{bedsLeft > 1 ? "s" : ""} left
          </div>
        )}

        {/* Available dot */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
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
              {room.capacity} bed room · {bedsLeft} space{bedsLeft !== 1 ? "s" : ""} free
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0 text-xs text-gray-700 font-semibold">
            <Star size={12} className="fill-gray-900 text-gray-900" />
            New
          </div>
        </div>
        <p className="text-sm text-gray-900 font-bold mt-2">
          ₦{room.rentAmount.toLocaleString()} <span className="font-normal text-gray-500">/ year</span>
        </p>
      </div>
    </Link>
  );
}
