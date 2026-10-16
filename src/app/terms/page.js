import Link from "next/link";
import { FileText, ShieldAlert, CheckCircle2, Building2, Scale, AlertCircle } from "lucide-react";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";

export const metadata = {
  title: "Terms of Use & Tenancy Rules | Covenant Hostel - Afaraade Nigeria Limited",
  description:
    "Terms of Use and residential occupancy guidelines for Covenant Hostel, managed and operated by Afaraade Nigeria Limited.",
};

export default function TermsPage() {
  const lastUpdated = "October 2026";

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans selection:bg-primary/20 selection:text-primary">
      {/* Reusable Navbar */}
      <PublicNavbar activePage="terms" />

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">

        {/* Header Hero */}
        <div className="bg-white rounded-3xl border border-gray-200/90 p-8 sm:p-12 shadow-sm space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
            <Scale size={13} />
            <span>Legal Agreement & Tenancy Guidelines</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Terms of Use & Tenancy Regulations
          </h1>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-gray-500 pt-1 border-t border-gray-100">
            <span>
              Last Updated: <strong className="text-gray-700">{lastUpdated}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-gray-700 font-medium">
              <Building2 size={14} className="text-primary" />
              <span>Covenant Hostel by <strong className="text-gray-900">Afaraade Nigeria Limited</strong></span>
            </span>
          </div>

          <p className="text-sm sm:text-base text-gray-600 leading-relaxed pt-2">
            These Terms of Use and Residential Rules govern your access to the Covenant Hostel web portal and your occupancy of premises managed by <strong>Afaraade Nigeria Limited</strong>. By registering an account, reserving a room, or occupying a bedspace, you acknowledge and agree to be bound by these provisions.
          </p>
        </div>

        {/* Quick Highlights Summary */}
        <div className="grid sm:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-2 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
              <FileText size={20} />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Authorized Tenancy</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Bedspace allocations are strictly personal to registered residents and cannot be sublet or transferred.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-2 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Digital Invoicing</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              All rent payments and utility collections are valid only through authorized official channels of Afaraade Nigeria Limited.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-2 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldAlert size={20} />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Community Safety</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Quiet hours, guest registration, and non-violence policies are strictly enforced for mutual welfare.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="bg-white rounded-3xl border border-gray-200/90 p-8 sm:p-12 shadow-sm space-y-10 text-gray-700 text-sm sm:text-base leading-relaxed">

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">1</span>
              <span>Managing Entity & Legal Scope</span>
            </h2>
            <p>
              Covenant Hostel accommodation blocks, digital tenant portals, and associated facilities are developed, maintained, and operated exclusively under the corporate oversight of:
            </p>
            <div className="bg-slate-50 border border-gray-200 rounded-2xl p-5 space-y-1 text-sm">
              <p className="font-bold text-gray-900">Afaraade Nigeria Limited</p>
              <p className="text-xs text-gray-600">Landlord, Developer & Managing Enterprise</p>
              <p className="text-xs text-gray-600">Registered with the Corporate Affairs Commission (CAC), Nigeria</p>
            </div>
            <p className="text-xs text-gray-500">
              All binding tenancy agreements, payment authorizations, and notices originate from and belong to Afaraade Nigeria Limited.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">2</span>
              <span>Room Allocations, Reservations & Non-Subletting</span>
            </h2>
            <ul className="space-y-2 text-sm pl-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                <span><strong>Personal License:</strong> The allocation of a room or bedspace confers a non-transferable residential license to the specified applicant only.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                <span><strong>No Unauthorized Subletting:</strong> Tenants are strictly forbidden from subletting, renting out, or transferring their assigned bedspace to any other individual without written authorization from Afaraade Nigeria Limited.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                <span><strong>Capacity Limits:</strong> Every room possesses a designated bed capacity. Overcrowding, harboring squatters, or unauthorized long-term occupants is grounds for immediate lease termination.</span>
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">3</span>
              <span>Rent Payments, Renewal & Invoicing</span>
            </h2>
            <p className="text-sm">
              Rent charges, caution deposits, and utility fees are computed transparently based on the published rates for each room category.
            </p>
            <ul className="space-y-2 text-sm pl-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Payment Due Dates:</strong> Rent must be settled prior to check-in or renewal deadline. Renewal notices are dispatched electronically via the resident portal.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Official Receipts:</strong> Payments are verified digitally. Only receipts generated through the official Covenant Hostel portal or issued in the name of Afaraade Nigeria Limited are recognized. Cash handovers to unverified third parties are not recognized.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Early Renewals:</strong> Residents retain priority renewal rights to their bedspace provided notice and renewal payment are remitted within the renewal window.</span>
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">4</span>
              <span>Hostel Code of Conduct & Safety</span>
            </h2>
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-5 space-y-3 text-xs sm:text-sm text-amber-950">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertCircle size={16} className="text-amber-700" />
                <span>Standard Resident Obligations</span>
              </div>
              <ul className="space-y-1.5 list-disc pl-5">
                <li>Respect designated quiet hours to allow fellow residents uninterrupted study and sleep.</li>
                <li>Ensure all non-resident guests adhere to daytime visiting hours and register at the security gate.</li>
                <li>Illegal substances, firearms, fireworks, and hazardous chemicals are strictly prohibited on all hostel premises.</li>
                <li>Tampering with electrical distribution panels, backup generators, or plumbing infrastructure is strictly prohibited.</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">5</span>
              <span>Maintenance & Facility Care</span>
            </h2>
            <p className="text-sm">
              Afaraade Nigeria Limited is committed to maintaining clean common areas, steady water supply, and structural safety. Routine wear and tear is serviced by our management. However, damage arising from resident negligence or willful misuse will be charged directly to the responsible resident&apos;s account.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">6</span>
              <span>Governing Law</span>
            </h2>
            <p className="text-sm">
              These terms and all residential tenancy contracts entered into through this portal are governed by and construed in accordance with the laws of the Federal Republic of Nigeria.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3 pt-2 border-t border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Questions Regarding Terms?</h2>
            <p className="text-sm text-gray-600">
              For tenancy clarifications or administrative assistance, please contact the legal and property desk of <strong>Afaraade Nigeria Limited</strong>:
            </p>
            {/* <div className="pt-2">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-blue-700 hover:underline"
              >
                <span>Read About Our Management Team</span>
                <span>→</span>
              </Link>
            </div> */}
          </section>

        </div>

      </main>

      {/* Reusable Footer */}
      <PublicFooter />
    </div>
  );
}
