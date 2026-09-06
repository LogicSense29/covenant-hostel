"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, Building2, X, Star, Menu, ChevronRight, SlidersHorizontal, Check } from "lucide-react";

// A room is "new" if it was added within the last 30 days
const NEW_ROOM_THRESHOLD_DAYS = 30;

function isNewRoom(createdAt) {
  if (!createdAt) return false;
  const diff = Date.now() - new Date(createdAt).getTime();
  return diff < NEW_ROOM_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
}

export default function LandingClient({ initialRooms }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBlock, setActiveBlock] = useState("All");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // 'block' | 'price' | 'features' | null
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const filtersRef = useRef(null);

  // Close any open dropdown when clicking outside the toolbar
  useEffect(() => {
    function handleClickOutside(e) {
      if (filtersRef.current && !filtersRef.current.contains(e.target)) {
        setFiltersOpen(false);
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (name) => setOpenDropdown((prev) => (prev === name ? null : name));

  // Derive unique blocks for filter dropdown
  const blocks = useMemo(() => {
    const names = initialRooms.map((r) => r.block?.name).filter(Boolean);
    return Array.from(new Set(names)).sort();
  }, [initialRooms]);

  // Derive all unique features across all rooms
  const allFeatures = useMemo(() => {
    const feats = initialRooms.flatMap((r) => r.features || []);
    return Array.from(new Set(feats)).sort();
  }, [initialRooms]);

  const toggleFeature = (feat) => {
    setSelectedFeatures((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  };

  // Count active filter groups for the badge
  const activeFilterCount = [
    activeBlock !== "All",
    priceMin !== "" || priceMax !== "",
    selectedFeatures.length > 0,
  ].filter(Boolean).length;

  const filteredRooms = useMemo(() => {
    return initialRooms.filter((room) => {
      const matchesSearch =
        !searchQuery ||
        room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.block?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.block?.address?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBlock =
        activeBlock === "All" || room.block?.name === activeBlock;

      const roomPrice = room.baseRentRule?.amount ?? room.rentAmount ?? 0;
      const matchesMin = priceMin === "" || roomPrice >= Number(priceMin);
      const matchesMax = priceMax === "" || roomPrice <= Number(priceMax);

      // OR logic: room must have at least one of the selected features
      const matchesFeatures =
        selectedFeatures.length === 0 ||
        selectedFeatures.some((f) => (room.features || []).includes(f));

      return matchesSearch && matchesBlock && matchesMin && matchesMax && matchesFeatures;
    });
  }, [searchQuery, activeBlock, priceMin, priceMax, selectedFeatures, initialRooms]);

  const clearAll = () => {
    setSearchQuery("");
    setActiveBlock("All");
    setPriceMin("");
    setPriceMax("");
    setSelectedFeatures([]);
  };

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Sticky Nav ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 group shrink-0">
            <img src="/convenant-hostel-logo.png" alt="Covenant Hostel" className="w-12 h-12 object-contain drop-shadow-md" />
            <span className="font-semibold text-primary hidden sm:block ">Covenant Hostel</span>
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
            <Link href="#availableRooms" className="hidden md:block text-sm font-semibold text-gray-500 hover:bg-gray-100 px-4 py-2 rounded-full transition-colors">
              Available Rooms
            </Link>
            <Link href="/login" className="text-sm font-semibold bg-primary text-white px-5 py-2 rounded-full hover:bg-blue-700 transition-colors">
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
          <div className="md:hidden absolute top-full left-0 right-0 border-t border-gray-100 bg-white shadow-lg px-4 py-4 flex flex-col gap-4 z-50 max-h-[80vh] overflow-y-auto">
            {/* Search */}
            <div className="flex items-center border border-gray-300 rounded-full px-4 py-2 gap-2">
              <Search size={16} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search rooms, blocks, address..."
                className="flex-1 bg-transparent outline-none text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { setMobileMenuOpen(false); } }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X size={14} className="text-gray-400" />
                </button>
              )}
            </div>

            {/* Block */}
            {blocks.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Block</p>
                <div className="flex flex-col gap-0.5 max-h-36 overflow-y-auto">
                  <button
                    onClick={() => setActiveBlock("All")}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeBlock === "All" ? "bg-primary/10 text-primary font-semibold" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    All blocks
                    {activeBlock === "All" && <Check size={13} />}
                  </button>
                  {blocks.map((block) => (
                    <button
                      key={block}
                      onClick={() => setActiveBlock(block)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeBlock === block ? "bg-primary/10 text-primary font-semibold" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="truncate pr-2">{block}</span>
                      {activeBlock === block && <Check size={13} />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price range */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Price Range</p>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">Min ₦</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <span className="text-gray-300 mt-5">—</span>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">Max ₦</label>
                  <input
                    type="number"
                    placeholder="Any"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            {allFeatures.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Features</p>
                <div className="flex flex-col gap-1">
                  {allFeatures.map((feat) => {
                    const active = selectedFeatures.includes(feat);
                    return (
                      <button
                        key={feat}
                        onClick={() => toggleFeature(feat)}
                        className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                          active ? "bg-primary/10 text-primary font-semibold" : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          active ? "bg-primary border-primary" : "border-gray-300"
                        }`}>
                          {active && <Check size={10} className="text-white" strokeWidth={3} />}
                        </div>
                        {feat}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              {activeFilterCount > 0 && (
                <button onClick={clearAll} className="text-sm text-primary font-semibold">Clear all filters</button>
              )}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="ml-auto text-sm font-semibold bg-primary text-white px-5 py-2 rounded-full"
              >
                Show {filteredRooms.length} room{filteredRooms.length !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-0 bg-white">
        <section className="relative overflow-hidden rounded-3xl">
          <img
            src="/hostel_hero_bg.png"
            alt="Hostel hero"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/50 to-black/70" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-12 pb-14 space-y-5">

          <h1 className="text-3xl md:text-4xl font-semibold text-white leading-snug max-w-lg drop-shadow">
            Comfortable rooms, transparent pricing, no stress.
          </h1>

          {/* CTA */}
          {/* <a
            href="#availableRooms"
            className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold text-sm px-6 py-3 rounded-full hover:bg-gray-100 transition-colors shadow-lg"
          >
            Browse Rooms
            <ChevronRight size={16} />
          </a> */}
        </div>
        </section>
      </div>

      {/* ── Block Filter Chips + Room Grid ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10" id='availableRooms'>

        {/* ── Desktop: Search + individual filter pills ── */}
        <div className="hidden md:flex items-center justify-between gap-4 mb-8" ref={filtersRef}>

          {/* Search input */}
          <div className="flex items-center gap-2 w-[40%] bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm hover:border-gray-300 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all shrink-0">
            <Search size={15} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search rooms or address..."
              className="flex-1 outline-none text-sm text-gray-800 placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-gray-300 hover:text-gray-500">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter pills group */}
          <div className="flex items-center gap-2">

          {/* Block pill */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("block")}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                activeBlock !== "All"
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
              }`}
            >
              {activeBlock !== "All" ? activeBlock : "Block"}
              <ChevronRight size={13} className={`transition-transform ${openDropdown === "block" ? "rotate-90" : "rotate-90 opacity-50"}`} />
            </button>
            {openDropdown === "block" && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl z-50">
                <div className="px-3 py-3 flex flex-col gap-0.5 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => { setActiveBlock("All"); setOpenDropdown(null); }}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                      activeBlock === "All" ? "bg-primary/10 text-primary font-semibold" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    All blocks
                    {activeBlock === "All" && <Check size={13} />}
                  </button>
                  {blocks.map((block) => (
                    <button
                      key={block}
                      onClick={() => { setActiveBlock(block); setOpenDropdown(null); }}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                        activeBlock === block ? "bg-primary/10 text-primary font-semibold" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="truncate pr-2">{block}</span>
                      {activeBlock === block && <Check size={13} />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Price pill */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("price")}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                priceMin || priceMax
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
              }`}
            >
              {priceMin || priceMax
                ? `₦${priceMin || "0"} – ${priceMax ? "₦" + Number(priceMax).toLocaleString() : "Any"}`
                : "Price"}
              <ChevronRight size={13} className={`transition-transform ${openDropdown === "price" ? "rotate-90" : "rotate-90 opacity-50"}`} />
            </button>
            {openDropdown === "price" && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Price Range</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">Min ₦</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <span className="text-gray-300 mt-5">—</span>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">Max ₦</label>
                    <input
                      type="number"
                      placeholder="Any"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
                {(priceMin || priceMax) && (
                  <button
                    onClick={() => { setPriceMin(""); setPriceMax(""); }}
                    className="mt-3 text-xs text-primary font-semibold hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Features pill */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("features")}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                selectedFeatures.length > 0
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
              }`}
            >
              {selectedFeatures.length > 0 ? `Features · ${selectedFeatures.length}` : "Features"}
              <ChevronRight size={13} className={`transition-transform ${openDropdown === "features" ? "rotate-90" : "rotate-90 opacity-50"}`} />
            </button>
            {openDropdown === "features" && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-3">
                <div className="flex flex-col gap-0.5">
                  {allFeatures.map((feat) => {
                    const active = selectedFeatures.includes(feat);
                    return (
                      <button
                        key={feat}
                        onClick={() => toggleFeature(feat)}
                        className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                          active ? "bg-primary/10 text-primary font-semibold" : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          active ? "bg-primary border-primary" : "border-gray-300"
                        }`}>
                          {active && <Check size={10} className="text-white" strokeWidth={3} />}
                        </div>
                        {feat}
                      </button>
                    );
                  })}
                </div>
                {selectedFeatures.length > 0 && (
                  <button
                    onClick={() => setSelectedFeatures([])}
                    className="mt-2 px-3 text-xs text-primary font-semibold hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Clear all — only when any filter active */}
          {(searchQuery || activeBlock !== "All" || priceMin || priceMax || selectedFeatures.length > 0) && (
            <button onClick={clearAll} className="text-sm text-gray-500 hover:text-gray-800 font-medium hover:underline ml-1">
              Clear all
            </button>
          )}
          </div> {/* end filter pills group */}
        </div>

        {/* ── Mobile: single Filters button (opens hamburger panel) ── */}
        <div className="flex md:hidden items-center gap-2 mb-8">
          <div className="flex items-center gap-2 flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm focus-within:border-primary transition-all">
            <Search size={15} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search rooms or address..."
              className="flex-1 outline-none text-sm text-gray-800 placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-gray-300 hover:text-gray-500">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold shrink-0 transition-all ${
              activeFilterCount > 0
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            <SlidersHorizontal size={15} />
            {/* Filters */}
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-primary text-xs font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Mobile filters panel ── */}
        {filtersOpen && (
          <div className="md:hidden mb-6 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-bold text-gray-900">Filters</p>
              {activeFilterCount > 0 && (
                <button onClick={clearAll} className="text-xs text-primary font-semibold hover:underline">Clear all</button>
              )}
            </div>
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
              {/* Block */}
              <div className="px-4 py-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Block</p>
                <div className="flex flex-col gap-0.5 max-h-36 overflow-y-auto">
                  <button onClick={() => setActiveBlock("All")} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${activeBlock === "All" ? "bg-primary/10 text-primary font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>
                    All blocks {activeBlock === "All" && <Check size={13} />}
                  </button>
                  {blocks.map((b) => (
                    <button key={b} onClick={() => setActiveBlock(b)} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left ${activeBlock === b ? "bg-primary/10 text-primary font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>
                      <span className="truncate pr-2">{b}</span>{activeBlock === b && <Check size={13} />}
                    </button>
                  ))}
                </div>
              </div>
              {/* Price */}
              <div className="px-4 py-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Price Range</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1"><label className="text-xs text-gray-500 mb-1 block">Min ₦</label><input type="number" placeholder="0" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" /></div>
                  <span className="text-gray-300 mt-5">—</span>
                  <div className="flex-1"><label className="text-xs text-gray-500 mb-1 block">Max ₦</label><input type="number" placeholder="Any" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" /></div>
                </div>
              </div>
              {/* Features */}
              {allFeatures.length > 0 && (
                <div className="px-4 py-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Features</p>
                  <div className="flex flex-col gap-0.5">
                    {allFeatures.map((feat) => {
                      const active = selectedFeatures.includes(feat);
                      return (
                        <button key={feat} onClick={() => toggleFeature(feat)} className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors text-left ${active ? "bg-primary/10 text-primary font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${active ? "bg-primary border-primary" : "border-gray-300"}`}>{active && <Check size={10} className="text-white" strokeWidth={3} />}</div>
                          {feat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-gray-100">
              <button onClick={() => setFiltersOpen(false)} className="w-full bg-primary text-white text-sm font-bold py-2.5 rounded-xl">
                Show {filteredRooms.length} room{filteredRooms.length !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500 font-medium">
            <span className="font-black text-gray-900">{filteredRooms.length}</span> room{filteredRooms.length !== 1 ? "s" : ""} available
            {(searchQuery || activeBlock !== "All" || priceMin || priceMax || selectedFeatures.length > 0) && (
              <button onClick={clearAll} className="ml-3 text-primary font-semibold hover:underline text-xs">
                Clear filters
              </button>
            )}
          </p>
        </div>

        {/* Room grid */}
        {filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
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
            <p className="text-gray-500 text-sm max-w-sm">Try a different block or clear your search filter. If you believe a room should be listed, contact management directly.</p>
            <button
              onClick={() => { setSearchQuery(""); setActiveBlock("All"); }}
              className="mt-6 text-[#0b69ff] font-semibold text-sm hover:underline"
            >
              Clear filters
            </button>
            <a
              href="mailto:management@covenanthouse.com"
              className="mt-3 text-gray-500 text-sm hover:text-gray-700 hover:underline"
            >
              Contact management →
            </a>
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
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#203090] to-[#1a2673] flex items-center justify-center shadow-md shadow-[#203090]/30 group-hover:shadow-xl group-hover:shadow-[#203090]/40 transition-all duration-300 group-hover:scale-110 border border-[#1a2673]/50">
               <img src="/convenant-hostel-logo.png" alt="Covenant Hostel" className="w-6 h-6 object-contain brightness-0 invert drop-shadow-md" />
             </div>
              <span className="text-white font-semibold text-lg">Covenant</span>
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
  const roomIsNew = isNewRoom(room.createdAt);
  
  // The ticked BASE_RENT rule has both the correct amount AND frequency.
  // Use it directly — no need for room.rentAmount or fallback guessing.
  const baseRentRule = room.baseRentRule || null;
  const frequencyMap = {
    ONCE: "once",
    DAILY: "day",
    MONTHLY: "month",
    QUARTERLY: "quarter",
    YEARLY: "year",
    PER_SEMESTER: "semester",
  };
  const rentAmount = baseRentRule ? baseRentRule.amount : room.rentAmount;
  const frequency = baseRentRule ? (frequencyMap[baseRentRule.frequency] || baseRentRule.frequency?.toLowerCase()) : null;

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
        {/* <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">Available</span>
        </div> */}
      </div>

      {/* Info */}
      <div className="px-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {room.block?.name ? `${room.block.name} · ` : ""}Room {room.roomNumber}
            </p>
            <p className="text-gray-500 text-xs truncate mt-0.5">
              {room.block?.address || "Main Campus"}
            </p>
            <p className="text-gray-400 text-xs mt-0.5">
              {bedsLeft} bed{bedsLeft !== 1 ? "s" : ""} left · {room.capacity} capacity
            </p>
          </div>
          {roomIsNew && (
            <div className="flex items-center gap-1 shrink-0 text-xs text-gray-700 font-semibold">
              <Star size={12} className="fill-gray-900 text-gray-900" />
              New
            </div>
          )}
        </div>
        <p className="text-sm text-gray-900 font-semibold mt-2">
          ₦{rentAmount.toLocaleString()}
          {frequency && <span className="font-normal text-gray-500"> / {frequency}</span>}
        </p>
        
        {/* Action buttons */}
        {/* <div className="flex gap-2 mt-3">
          <Link
            href={`/register?roomId=${room.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 py-2 bg-primary hover:bg-blue-700 text-white text-xs font-bold rounded-lg text-center transition-colors"
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
        </div> */}
      </div>
    </Link>
  );
}
