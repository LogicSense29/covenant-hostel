"use client";

import { useState } from "react";
import { User, Phone, Lock, Save, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";

export default function TenantSettingsClient({ profile, userEmail }) {
  const [name, setName] = useState(profile?.user?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/tenant/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      if (res.ok) toast.success("Profile updated");
      else {
        const err = await res.text();
        toast.error(err || "Failed to update profile");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/tenant/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        toast.success("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const err = await res.text();
        toast.error(err || "Failed to change password");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-1 text-sm">Manage your account details and security.</p>
      </div>

      {/* Profile section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-[#0b69ff] rounded-xl">
            <User size={18} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Personal Information</h2>
            <p className="text-xs text-slate-400 mt-0.5">Update your name and contact number</p>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-[#0b69ff] transition-all"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
            <input
              type="email"
              value={userEmail}
              disabled
              className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-400 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1.5">Email cannot be changed. Contact support if needed.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Phone Number</label>
            <div className="relative">
              <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-[#0b69ff] transition-all"
                placeholder="e.g. 08012345678"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 px-6 py-3 bg-[#0b69ff] text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Password section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-[#0b69ff] rounded-xl">
            <Lock size={18} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Change Password</h2>
            <p className="text-xs text-slate-400 mt-0.5">Keep your account secure with a strong password</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSave} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-[#0b69ff] transition-all"
                placeholder="Enter current password"
                required
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">New Password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-[#0b69ff] transition-all"
                placeholder="Min. 8 characters"
                required
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all ${
                confirmPassword && confirmPassword !== newPassword
                  ? "border-red-300 focus:border-red-400"
                  : "border-slate-200 focus:border-[#0b69ff]"
              }`}
              placeholder="Repeat new password"
              required
            />
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-xs text-red-500 font-medium mt-1.5">Passwords do not match</p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
              className="flex items-center gap-2 px-6 py-3 bg-[#102a43] text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
