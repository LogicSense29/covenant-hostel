"use client";

import { useState, useEffect } from "react";
import { Save, Settings2, CreditCard } from "lucide-react";

export default function SettingsPage() {
  const [fee, setFee] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        if (data.INSPECTION_FEE) {
          setFee(data.INSPECTION_FEE);
        }
        if (data.INSPECTION_FEE_ENABLED !== undefined) {
          setIsEnabled(data.INSPECTION_FEE_ENABLED === "true");
        }
        if (data.BANK_NAME) {
          setBankName(data.BANK_NAME);
        }
        if (data.ACCOUNT_NUMBER) {
          setAccountNumber(data.ACCOUNT_NUMBER);
        }
        if (data.ACCOUNT_NAME) {
          setAccountName(data.ACCOUNT_NAME);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      // Save Fee Amount
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "INSPECTION_FEE",
          value: fee.toString(),
          description: "The fee charged for prospective guests to book a physical inspection tour of the hostel.",
        }),
      });

      // Save Enabled Status
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "INSPECTION_FEE_ENABLED",
          value: isEnabled.toString(),
          description: "Whether or not to charge for guest inspections.",
        }),
      });

      // Save Bank Details Settings
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "BANK_NAME",
          value: bankName,
          description: "The bank name for manual transfer payments.",
        }),
      });

      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "ACCOUNT_NUMBER",
          value: accountNumber,
          description: "The account number for manual transfer payments.",
        }),
      });

      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "ACCOUNT_NAME",
          value: accountName,
          description: "The account name for manual transfer payments.",
        }),
      });

      setMessage({ text: "Settings saved successfully!", type: "success" });
    } catch (err) {
      console.error(err);
      setMessage({ text: "An error occurred.", type: "error" });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  if (loading) return <div className="p-8 text-slate-500 font-medium">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage global system variables and preferences.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center gap-3">
           <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
             <Settings2 size={20} />
           </div>
           <h2 className="font-bold text-slate-900 text-lg">Financial Configuration</h2>
        </div>
        
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-8">
          
          {message.text && (
            <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              {message.text}
            </div>
          )}

          {/* Toggle Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${isEnabled ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-200 text-slate-500'}`}>
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 leading-none">Inspection Fee</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Toggle whether guests pay to book inspections.</p>
              </div>
            </div>
            
            <button
               type="button"
               onClick={() => setIsEnabled(!isEnabled)}
               className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
            >
              <span
                className={`${isEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-5 w-5 transform rounded-full bg-white transition-transform`}
              />
            </button>
          </div>

          <div className={`max-w-md space-y-4 transition-all duration-300 ${isEnabled ? 'opacity-100 scale-100' : 'opacity-40 scale-95 pointer-events-none'}`}>
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-widest mb-2">Guest Inspection Fee (₦)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-400 font-bold text-sm">₦</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className="w-full pl-10 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-900"
                  placeholder="e.g. 5000"
                  required={isEnabled}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium italic">Amount to be charged via Paystack on the registration form.</p>
            </div>
          </div>
          
          {/* Divider */}
          <div className="border-t border-slate-100 my-6" />

          {/* Bank Transfer Details Section */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <CreditCard size={18} />
              </span>
              Bank Transfer Account Details
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Specify the bank details that tenants will see when they select the "Upload Receipt" payment option to make manual bank transfers.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-widest mb-2">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-950"
                  placeholder="e.g. GTBank, Access Bank"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-widest mb-2">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-950"
                  placeholder="e.g. 0123456789"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-widest mb-2">Account Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-950"
                  placeholder="e.g. Covenant Hostel Ltd"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Provider Management • (C) 2026</p>
            <button 
              type="submit" 
              disabled={saving}
              className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all text-sm flex items-center gap-2 disabled:bg-slate-100 disabled:text-slate-400 shadow-xl shadow-blue-500/10 active:scale-95"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <>
                  <Save size={18} />
                  Save Settings
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
