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
            <h4 className="text-white font-bold text-sm mb-4 tracking-wide">Contact</h4>
            <div className="flex flex-col gap-3 text-xs leading-relaxed">
              <div>
                <p className="text-white font-semibold">Covenant Hostel</p>
                <p className="text-gray-400 mt-0.5">Ogbomosho, Oyo State</p>
              </div>
              <div>
                <p className="text-white font-semibold mb-1.5">Get in Touch</p>
                <a 
                  href="https://wa.me/2348090791947?text=Hello%2C%20I%20have%20an%20inquiry%20about%20Covenant%20Hostel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors group"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span className="group-hover:underline">WhatsApp Chat</span>
                </a>
                <p className="text-gray-500 mt-1">+234 809 079 1947</p>
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
