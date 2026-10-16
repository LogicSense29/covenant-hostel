"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function PublicNavbar({ activePage = "" }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <img 
            src="/convenant-hostel-logo.png" 
            alt="Covenant Hostel" 
            className="w-11 h-11 sm:w-12 sm:h-12 object-contain drop-shadow-md" 
          />
          <div className="flex flex-col">
            <span className="font-semibold text-primary text-sm sm:text-base leading-tight">
              Covenant Hostel
            </span>
            <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium leading-tight">
              By Afaraade Nigeria Limited
            </span>
          </div>
        </Link>

        {/* Right actions - Exactly matching Home nav */}
        <div className="flex items-center gap-2 shrink-0">
          <Link 
            href="/about" 
            className={`hidden md:block text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
              activePage === "about"
                ? "bg-primary/10 text-primary"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            }`}
          >
            About
          </Link>
          <Link 
            href="/#availableRooms" 
            className="hidden md:block text-sm font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-4 py-2 rounded-full transition-colors"
          >
            Available Rooms
          </Link>
          <Link 
            href="/login" 
            className="text-sm font-semibold bg-primary text-white px-5 py-2 rounded-full hover:bg-blue-700 transition-colors"
          >
            Login
          </Link>
          <button
            className="md:hidden p-2 rounded-full border border-gray-200 hover:shadow-md transition-shadow"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={18} className="text-gray-700" /> : <Menu size={18} className="text-gray-700" />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 border-t border-gray-100 bg-white shadow-lg px-4 py-4 flex flex-col gap-3 z-50">
          <Link 
            href="/" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-semibold text-gray-700 hover:text-primary px-3 py-2 rounded-lg hover:bg-gray-50"
          >
            Home
          </Link>
          <Link 
            href="/about" 
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm font-semibold px-3 py-2 rounded-lg ${
              activePage === "about" ? "bg-primary/10 text-primary" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            About Us
          </Link>
          <Link 
            href="/#availableRooms" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-semibold text-gray-700 hover:text-primary px-3 py-2 rounded-lg hover:bg-gray-50"
          >
            Available Rooms
          </Link>
          <Link 
            href="/login" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-semibold text-center bg-primary text-white py-2 rounded-full hover:bg-blue-700 mt-2"
          >
            Login
          </Link>
        </div>
      )}
    </header>
  );
}
