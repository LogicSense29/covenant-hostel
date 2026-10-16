import Link from "next/link";
import { 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  ArrowRight, 
  KeyRound, 
  Wrench, 
  Clock, 
  Award,
  Layers 
} from "lucide-react";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";

export default function AboutClient() {

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans selection:bg-primary/20 selection:text-primary">

      {/* ── Reusable Navigation Bar ── */}
      <PublicNavbar activePage="about" />

      {/* ── Main Content Container ── */}
      <main className="space-y-12 sm:space-y-16 pb-16">

        {/* ── Hero Section (Consistent with Home Page Hero Canvas) ── */}
        {/* <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="relative overflow-hidden rounded-3xl bg-secondary shadow-xl min-h-[380px] sm:min-h-[440px] flex items-center justify-center">
            Background Image with Home Page Visual Texture
            <img
              src="/hostel_hero_bg.png"
              alt="Covenant Hostel Campus"
              className="absolute inset-0 w-full h-full object-cover scale-105 filter brightness-[0.7] contrast-105"
            />
            Deep Navy/Black Gradient Overlay
            <div className="absolute inset-0 bg-gradient-to-r from-[#102a43]/95 via-[#102a43]/85 to-[#0b69ff]/75" />

            Glowing Accent Blobs
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />

            Hero Copy
            <div className="relative z-10 max-w-3xl mx-auto text-center px-4 py-12 sm:py-16 space-y-6">
              <div className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wider text-blue-100 uppercase transition-colors">
                <Sparkles size={13} className="text-yellow-300" />
                <span>Premier Student & Professional Living</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight drop-shadow-sm">
                A Safe, Comfortable Home Managed With Professional Excellence.
              </h1>

              <p className="text-base sm:text-lg text-blue-100/90 max-w-2xl mx-auto font-normal leading-relaxed">
                <span className="font-semibold text-white">Covenant Hostel</span> is a dedicated student and residential community proudly owned and operated by <span className="font-semibold text-white">Afaraade Nigeria Limited</span>, delivering secure facilities, transparent rent management, and prompt resident care.
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/#availableRooms"
                  className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold text-sm px-6 py-3 rounded-full hover:bg-gray-100 active:scale-95 transition-all shadow-lg shadow-black/20"
                >
                  <span>Browse Available Rooms</span>
                  <ArrowRight size={15} />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold text-sm px-6 py-3 rounded-full backdrop-blur-md border border-white/20 transition-all"
                >
                  <KeyRound size={15} />
                  <span>Tenant Portal</span>
                </Link>
              </div>
            </div>
          </div>
        </section> */}

        {/* ── Key Metrics & Credibility Bar ── */}
        {/* <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-sm grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
            <div className="pt-3 lg:pt-0 lg:px-4 flex flex-col items-center text-center">
              <span className="text-3xl sm:text-4xl font-extrabold text-primary">100%</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-800 mt-1">Verified Spaces</span>
              <span className="text-xs text-gray-400 mt-0.5">Every room physically inspected</span>
            </div>
            <div className="pt-3 lg:pt-0 lg:px-4 flex flex-col items-center text-center">
              <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">24 / 7</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-800 mt-1">Security & Access</span>
              <span className="text-xs text-gray-400 mt-0.5">Monitored residential environment</span>
            </div>
            <div className="pt-3 lg:pt-0 lg:px-4 flex flex-col items-center text-center">
              <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600">0</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-800 mt-1">Hidden Surcharges</span>
              <span className="text-xs text-gray-400 mt-0.5">Clear billing & instant receipts</span>
            </div>
            <div className="pt-3 lg:pt-0 lg:px-4 flex flex-col items-center text-center">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#102a43]">CAC</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-800 mt-1">Registered Entity</span>
              <span className="text-xs text-gray-400 mt-0.5">Afaraade Nigeria Limited</span>
            </div>
          </div>
        </section> */}

        {/* ── Corporate Identity & Parent Company Spotlight ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#102a43] via-[#0f243b] to-[#071524] text-white p-8 sm:p-12 shadow-xl border border-white/10">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-3 py-1 rounded-lg text-xs font-semibold text-blue-200 uppercase tracking-widest">
                  <Building2 size={13} className="text-primary" />
                  Parent Enterprise & Governance
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                  Afaraade Nigeria Limited
                </h2>

                <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-2xl">
                  Afaraade Nigeria Limited is an incorporated Nigerian property development, management, and investment firm registered under the Corporate Affairs Commission (CAC). Covenant Hostel represents its flagship specialized student and young professional living division.
                </p>

                <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">
                  Under the stewardship of Afaraade Nigeria Limited, every hostel block adheres to rigid construction safety, routine civil maintenance, fair landlord-tenant policies, and modern digital accountability.
                </p>

                <div className="pt-2 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-gray-200">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    <span>CAC Registered Company</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-gray-200">
                    <Award size={14} className="text-amber-400" />
                    <span>Real Estate & Facilities Management</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-gray-200">
                    <Layers size={14} className="text-blue-400" />
                    <span>Centralized Quality Assurance</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col justify-center">
                <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-6 space-y-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
                    <Building2 size={32} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">Corporate Ownership</h3>
                    <p className="text-xs text-blue-200 mt-1">Covenant Hostel is managed with institutional integrity.</p>
                  </div>
                  <div className="pt-2 border-t border-white/10">
                    <p className="text-[11px] text-gray-400 font-mono tracking-wider">
                      RC · FEDERAL REPUBLIC OF NIGERIA
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Our Core Values & Living Standards ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">The Covenant Standard</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Why Residents Choose Covenant Hostel
            </h2>
            <p className="text-sm text-gray-500">
              We eliminate the traditional frustrations of hostel accommodations through modern facility management and digital systems.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Value Card 1 */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-7 shadow-sm hover:shadow-md hover:border-primary/40 transition-all group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="font-bold text-lg text-gray-900">
                  Safety, Security & Peace of Mind
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Controlled entry access, vetted on-site personnel, and a peaceful study-friendly atmosphere so students and professionals can focus without distraction.
                </p>
              </div>
              <ul className="mt-6 pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-500">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Secure gates & perimeter fencing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Respectful residential guidelines</span>
                </li>
              </ul>
            </div>

            {/* Value Card 2 */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-7 shadow-sm hover:shadow-md hover:border-primary/40 transition-all group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Wrench size={24} />
                </div>
                <h3 className="font-bold text-lg text-gray-900">
                  Responsive Maintenance Support
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  No running after caretakers. Tenants lodge plumbing, electrical, and facility repair requests straight from their digital portal with tracked resolution.
                </p>
              </div>
              <ul className="mt-6 pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-500">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Prompt resolution by certified artisans</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Digital status tracking & updates</span>
                </li>
              </ul>
            </div>

            {/* Value Card 3 */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-7 shadow-sm hover:shadow-md hover:border-primary/40 transition-all group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Clock size={24} />
                </div>
                <h3 className="font-bold text-lg text-gray-900">
                  Transparent Digital Billing
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Zero unexpected or unofficial levies. Pay rent online, view payment breakdown schedules, generate receipts, and renew with ease before term expiration.
                </p>
              </div>
              <ul className="mt-6 pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-500">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Instant receipt generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Transparent itemized billing breakdown</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── Visual Experience & Facilities Showcase ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm grid lg:grid-cols-2 items-center">
            {/* Visual Mosaic */}
            <div className="relative h-72 sm:h-96 lg:h-full min-h-[340px] bg-gray-100 overflow-hidden">
              <img
                src="/cozy_room_bg.png"
                alt="Cozy room interior"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-yellow-300">
                  Thoughtful Interiors
                </span>
                <p className="font-bold text-lg text-white">
                  Equipped rooms designed for study, rest, and comfort
                </p>
                <p className="text-xs text-gray-200">
                  Well-ventilated spaces with individual bedspaces and dedicated amenities.
                </p>
              </div>
            </div>

            {/* Content & Benefits */}
            <div className="p-8 sm:p-12 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Resident Experience</span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                  Everything You Need For A Productive Stay
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  We understand how important quiet focus and uninterrupted utilities are for student success. That is why our facilities are maintained with proactive checklists.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Reliable Power & Clean Water</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Backup power arrangements and steady borehole/water storage systems.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Direct Digital Communication</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Contact hostel managers, submit notices, and view updates on the go.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Convenient Campus Accessibility</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Strategically situated within convenient commuting radius to lecture halls and transit hubs.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  href="/#availableRooms"
                  className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-blue-700 hover:underline"
                >
                  <span>Explore room options and pricing</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Official Inquiries & Contact Hub ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Get In Touch</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Contact & Inquiries
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Have questions regarding bed availability, corporate leasing, or property inspection? Reach out directly.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0">
                <Building2 size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Corporate Parent</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">Afaraade Nigeria Ltd.</p>
                <p className="text-xs text-gray-500 mt-1">Property Development & Real Estate Services</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Phone size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Resident Helpline</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">Management Desk</p>
                <p className="text-xs text-gray-500 mt-1">Available for inspections & booking inquiries</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <MapPin size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Location</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">Nigeria</p>
                <p className="text-xs text-gray-500 mt-1">
                  No.3. block 2 Lister Building, Ring Road Ibadan South West Oyo State
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Ready To Book Banner CTA ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-primary text-white p-8 sm:p-12 text-center space-y-6 relative overflow-hidden shadow-lg shadow-primary/25">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold">
                Looking For Your Next Semester Accommodations?
              </h2>
              <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
                Discover available bedspaces, inspect hostel amenities, and complete your reservation securely online.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <Link
                  href="/#availableRooms"
                  className="bg-white text-primary hover:bg-blue-50 font-bold text-sm px-7 py-3 rounded-full transition-all shadow-md active:scale-95"
                >
                  View Available Rooms
                </Link>
                <Link
                  href="/login"
                  className="bg-blue-700/80 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-full transition-all border border-blue-400/40"
                >
                  Existing Resident Login
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Reusable Footer ── */}
      <PublicFooter />

    </div>
  );
}
