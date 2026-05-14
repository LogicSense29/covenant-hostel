"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, CreditCard, Wrench, Home, Info, CheckCheck, X } from "lucide-react";
import Link from "next/link";

const TYPE_ICON = {
  PAYMENT: CreditCard,
  MAINTENANCE: Wrench,
  TENANCY: Home,
  SYSTEM: Info,
};

const TYPE_COLOR = {
  PAYMENT: "text-blue-600 bg-blue-50",
  MAINTENANCE: "text-purple-600 bg-purple-50",
  TENANCY: "text-green-600 bg-green-50",
  SYSTEM: "text-slate-600 bg-slate-100",
};

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {}
  };

  // Poll every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const markOneRead = async (id) => {
    await fetch("/api/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleOpen = () => {
    setOpen(o => !o);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all relative"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/60 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell size={24} className="text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const Icon = TYPE_ICON[n.type] || Info;
                const colorClass = TYPE_COLOR[n.type] || TYPE_COLOR.SYSTEM;
                const content = (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? "bg-blue-50/40" : ""}`}
                    onClick={() => !n.read && markOneRead(n.id)}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${colorClass}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold ${n.read ? "text-slate-600" : "text-slate-900"}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                    )}
                  </div>
                );

                return n.link ? (
                  <Link key={n.id} href={n.link} onClick={() => { markOneRead(n.id); setOpen(false); }}>
                    {content}
                  </Link>
                ) : (
                  <div key={n.id}>{content}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
