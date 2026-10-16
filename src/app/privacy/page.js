import Link from "next/link";
import { ShieldCheck, Lock, Eye, FileText, Bell, CheckCircle2, Building2 } from "lucide-react";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";

export const metadata = {
  title: "Privacy Policy | Covenant Hostel by Afaraade Nigeria Limited",
  description:
    "Privacy Policy for Covenant Hostel managed by Afaraade Nigeria Limited. Understand how resident data is collected, handled, and secured.",
};

export default function PrivacyPage() {
  const lastUpdated = "October 2026";

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans selection:bg-primary/20 selection:text-primary">
      {/* Reusable Navbar */}
      <PublicNavbar activePage="privacy" />

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">

        {/* Header Hero */}
        <div className="bg-white rounded-3xl border border-gray-200/90 p-8 sm:p-12 shadow-sm space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
            <Lock size={13} />
            <span>Data Protection & Privacy</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Privacy Policy
          </h1>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-gray-500 pt-1 border-t border-gray-100">
            <span>
              Effective Date: <strong className="text-gray-700">{lastUpdated}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-gray-700 font-medium">
              <Building2 size={14} className="text-primary" />
              <span>Covenant Hostel by <strong className="text-gray-900">Afaraade Nigeria Limited</strong></span>
            </span>
          </div>

          <p className="text-sm sm:text-base text-gray-600 leading-relaxed pt-2">
            This Privacy Policy governs how <strong>Covenant Hostel</strong>, as an accommodation facility and service operated by <strong>Afaraade Nigeria Limited</strong> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), collects, uses, protects, and discloses personal information obtained from prospective residents, registered tenants, guardians, and portal visitors.
          </p>
        </div>

        {/* Key Tenets Quick Summary */}
        <div className="grid sm:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-2 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Lawful Processing</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              We process personal information under the Nigeria Data Protection Regulation (NDPR) and applicable civil tenancy laws.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-2 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Eye size={20} />
            </div>
            <h3 className="text-sm font-bold text-gray-900">No Third-Party Resale</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Your contact numbers, national IDs, and billing credentials are never sold or rented to commercial third parties.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-2 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Lock size={20} />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Encrypted Transactions</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Online rent invoicing and payment processing use secure tokenization and bank-grade SSL encryption.
            </p>
          </div>
        </div>

        {/* Detailed Policy Sections */}
        <div className="bg-white rounded-3xl border border-gray-200/90 p-8 sm:p-12 shadow-sm space-y-10 text-gray-700 text-sm sm:text-base leading-relaxed">

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">1</span>
              <span>Data Controller Identity & Corporate Governance</span>
            </h2>
            <p>
              The primary data controller responsible for personal information collected through this application and on-site at Covenant Hostel is:
            </p>
            <div className="bg-slate-50 border border-gray-200 rounded-2xl p-5 space-y-1 text-sm">
              <p className="font-bold text-gray-900">Afaraade Nigeria Limited</p>
              <p className="text-xs text-gray-600">Operating entity for Covenant Hostel</p>
              <p className="text-xs text-gray-600">Incorporated with the Corporate Affairs Commission (CAC), Federal Republic of Nigeria</p>
              <p className="text-xs text-gray-600">Email: <span className="font-mono text-primary">management@convenanthostel.com</span></p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">2</span>
              <span>Information We Collect</span>
            </h2>
            <p>
              To process tenancy applications, allocate bedspaces, maintain facility security, and manage rent billing, we collect:
            </p>
            <ul className="space-y-2 text-sm pl-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Identification & Contact Data:</strong> Full legal name, date of birth, gender, phone number, email address, student matriculation number / institution or employer name.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Next of Kin & Guarantor Details:</strong> Name, relationship, phone number, and physical contact of parents, guardians, or sponsors for emergency and tenancy verification.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Tenancy & Billing Records:</strong> Allocated room/block, tenancy agreement term, rent dues, transaction references, payment receipts, and maintenance logs.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Facility Security Data:</strong> Hostel gate logs, guest visit registrations, and authorized access records required to ensure resident safety.</span>
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">3</span>
              <span>How We Use Your Information</span>
            </h2>
            <p>
              Personal data collected by Afaraade Nigeria Limited for Covenant Hostel is utilized solely for:
            </p>
            <ul className="space-y-1.5 text-sm list-disc pl-5 text-gray-600">
              <li>Verifying eligibility and issuing valid residential tenancy agreements.</li>
              <li>Generating itemized invoices, payment notifications, and official receipts.</li>
              <li>Dispatching facility maintenance artisans to resolve logged room repairs.</li>
              <li>Contacting designated emergency contacts or institutional officials when urgent welfare situations arise.</li>
              <li>Fulfilling legal, tax, and property governance regulations in Nigeria.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">4</span>
              <span>Data Protection & Retention</span>
            </h2>
            <p className="text-sm">
              We apply technical and organizational safeguards including encrypted database connections, authenticated role-based staff access, and regular vulnerability audits. Personal tenancy files are retained throughout the active tenancy period and for a statutory period required by Nigerian accounting and commercial property records, after which they are securely purged.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">5</span>
              <span>Your Statutory Rights</span>
            </h2>
            <p className="text-sm">
              Under applicable data protection guidelines, residents and prospective tenants have the right to request access to their stored personal file, request corrections of outdated contact or guarantor information, and lodge inquiries directly with the management of Afaraade Nigeria Limited.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">6</span>
              <span>Contact Us Regarding Privacy</span>
            </h2>
            <p className="text-sm">
              If you have any questions, clarifications, or requests concerning this Privacy Policy, please reach out to the administrative desk of <strong>Afaraade Nigeria Limited</strong>:
            </p>
            <div className="pt-2">
              <Link
                href="/about#contact"
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-blue-700 hover:underline"
              >
                <span>Visit Management Contact Directory</span>
                <span>→</span>
              </Link>
            </div>
          </section>

        </div>

      </main>

      {/* Reusable Footer */}
      <PublicFooter />
    </div>
  );
}
