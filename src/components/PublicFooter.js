import Link from "next/link";
import { ShieldCheck, MapPin } from "lucide-react";

export default function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 border-b border-gray-800 pb-12">
          
          {/* Brand & Parent Company */}
          <div className="md:col-span-1 space-y-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#203090] to-[#102a43] flex items-center justify-center p-1.5 border border-white/10 group-hover:scale-105 transition-transform shadow-md">
                <img 
                  src="/convenant-hostel-logo.png" 
                  alt="Covenant Hostel" 
                  className="w-full h-full object-contain brightness-0 invert" 
                />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-lg leading-tight">
                  Covenant Hostel
                </span>
                <span className="text-[11px] text-blue-400 font-medium">
                  By Afaraade Nigeria Limited
                </span>
              </div>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed pt-1">
              Premium student and residential accommodation managed with institutional standards, transparent billing, and dedicated resident welfare.
            </p>
            {/* <div className="pt-2 flex items-center gap-2 text-xs text-emerald-400">
              <ShieldCheck size={14} />
              <span>CAC Registered Enterprise</span>
            </div> */}
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 tracking-wide">Explore</h4>
            <div className="flex flex-col gap-2.5 text-xs sm:text-sm">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <Link href="/#availableRooms" className="hover:text-white transition-colors">Available Rooms</Link>
              <Link href="/about" className="hover:text-white transition-colors">About Covenant Hostel</Link>
            </div>
          </div>

          {/* Portals & Management */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 tracking-wide">Portal</h4>
            <div className="flex flex-col gap-2.5 text-xs sm:text-sm">
              <Link href="/login" className="hover:text-white transition-colors">Resident Portal Login</Link>
              {/* <Link href="/login" className="hover:text-white transition-colors">Staff & Admin Access</Link>
              <Link href="/about#contact" className="hover:text-white transition-colors">Management Desk</Link> */}
            </div>
          </div>

          {/* Legal & Governance */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 tracking-wide">Legal</h4>
            <div className="flex flex-col gap-2.5 text-xs sm:text-sm">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Use</Link>
            </div>
          </div>

          {/* Address */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 tracking-wide">Address</h4>
            <div className="flex flex-col gap-3 text-xs leading-relaxed">
              <div>
                <p className="text-white font-semibold">Covenant Hostel</p>
                <p className="text-gray-400 mt-0.5">Ogbomosho, Oyo State</p>
              </div>
              <div>
                <p className="text-white font-semibold">Afaraade Nigeria Limited</p>
                <p className="text-gray-400 mt-0.5">
                  No.3. block 2 Lister Building, Ring Road Ibadan South West Oyo State
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-gray-400">
          <p>
            © {currentYear} <span className="text-white font-semibold">Covenant Hostel</span>. A brand of{" "}
            <span className="text-white font-semibold">Afaraade Nigeria Limited</span>. All rights reserved.
          </p>
          {/* <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-gray-400">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Hostel Management Systems Active</span>
            </div>
          </div> */}
        </div>

      </div>
    </footer>
  );
}
