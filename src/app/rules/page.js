import { FileText, ShieldCheck, Info, AlertCircle, Scale, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PublicRulesPage() {
  const rules = [
    {
      title: "General Conduct",
      icon: <Scale className="text-blue-600" size={24} />,
      items: [
        "Tenants must maintain a high standard of personal hygiene and cleanliness within their rooms and common areas.",
        "Noise levels must be kept to a minimum, especially between 10:00 PM and 6:00 AM (Quiet Hours).",
        "Illegal substances, firearms, and hazardous materials are strictly prohibited on hostel premises.",
        "Fighting, bullying, or any form of harassment towards other tenants or staff is grounds for immediate eviction."
      ]
    },
    {
      title: "Facility Maintenance",
      icon: <ShieldCheck className="text-emerald-600" size={24} />,
      items: [
        "Tenants are responsible for the furniture and fittings provided in their respective rooms.",
        "Damage to hostel property must be reported immediately via the Maintenance portal. Tenants may be billed for damages caused by negligence.",
        "Modifications to rooms (painting, drilling, electrical changes) are not allowed without written consent from management.",
        "Electrical appliances (heaters, hot plates) must be used with caution. Unauthorized high-wattage appliances are prohibited."
      ]
    },
    {
      title: "Visitors & Security",
      icon: <Info className="text-amber-600" size={24} />,
      items: [
        "All visitors must be registered at the security gate and leave the premises by 8:00 PM.",
        "Overnight visitors are not permitted without prior approval from the Hostel Warden.",
        "Tenants must always carry their Hostel ID and present it to security personnel when requested.",
        "Lost keys must be reported immediately. The cost of replacement locks and keys will be borne by the tenant."
      ]
    },
    {
      title: "Rent & Payments",
      icon: <AlertCircle className="text-purple-600" size={24} />,
      items: [
        "Rent for the full session/year must be settled before moving in.",
        "Late payments may incur a penalty fee as stipulated in the billing rules.",
        "Refunds for early departure are generally not provided, except under exceptional circumstances approved by management.",
        "Sub-letting of hostel rooms is strictly prohibited and will result in immediate termination of the tenancy."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-10 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             {/* <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
               <FileText size={32} />
             </div> */}
             <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tenancy Agreement</h1>
          </div>
          <p className="text-slate-500 max-w-xl text-lg leading-relaxed">
            Please review the rules and regulations governing your stay at Covenant Hostel. These rules ensure a safe and productive environment for all residents.
          </p>
        </div>
      </div>

      <div className="space-y-12 pb-20">
        {rules.map((section, idx) => (
          <div key={idx} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-slate-50/30">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                {section.icon}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
            </div>
            <div className="p-8">
              <ul className="space-y-6">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-4 group">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-blue-500 transition-colors shrink-0"></div>
                    <p className="text-slate-600 leading-relaxed font-medium">
                      {item}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}

        <div className="flex justify-center mt-12">
          <Link 
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-50 text-blue-600 rounded-2xl font-bold hover:bg-blue-100 transition-all"
          >
            <ArrowLeft size={20} />
            Back to Registration
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
}
