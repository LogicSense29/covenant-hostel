"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MessageCircle,
  Send,
  User,
  CheckCheck,
  Check,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Clock,
  Phone,
  ExternalLink,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

function formatTime(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString("en-GB", { weekday: "short" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatMessageTime(date) {
  return new Date(date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatMessageDate(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function MessagesClient({ conversations: initialConversations, activeConversation: initialActive }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState(initialConversations || []);
  const [active, setActive] = useState(initialActive || null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [search, setSearch] = useState("");
  const [showMobileThread, setShowMobileThread] = useState(!!initialActive);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const pollRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [active?.messages, scrollToBottom]);

  // Poll for new messages every 5 seconds when a conversation is open
  useEffect(() => {
    if (!active) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/whatsapp/conversations?id=${active.id}`);
        if (!res.ok) return;
        const data = await res.json();
        setActive(data);
        // Update unread count in sidebar list
        setConversations(prev =>
          prev.map(c => c.id === data.id ? { ...c, unreadCount: 0, lastMessageAt: data.lastMessageAt, messages: data.messages.slice(-1) } : c)
        );
      } catch { /* silent */ }
    };

    pollRef.current = setInterval(poll, 5000);
    return () => clearInterval(pollRef.current);
  }, [active?.id]);

  // Poll conversations list every 10s for new incoming conversations
  useEffect(() => {
    const pollList = async () => {
      try {
        const res = await fetch("/api/whatsapp/conversations");
        if (!res.ok) return;
        const data = await res.json();
        setConversations(data);
      } catch { /* silent */ }
    };

    const id = setInterval(pollList, 10000);
    return () => clearInterval(id);
  }, []);

  const openConversation = async (conv) => {
    setShowMobileThread(true);
    router.replace(`/landlord/messages?id=${conv.id}`, { scroll: false });

    try {
      const res = await fetch(`/api/whatsapp/conversations?id=${conv.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setActive(data);
      setConversations(prev =>
        prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c)
      );
    } catch {
      toast.error("Failed to load conversation");
    }
  };

  const handleSend = async () => {
    if (!reply.trim() || !active || sending) return;

    const messageText = reply.trim();
    setReply("");

    // Optimistic — add message to thread immediately
    const optimistic = {
      id: `temp-${Date.now()}`,
      body: messageText,
      direction: "OUTBOUND",
      createdAt: new Date().toISOString(),
      read: true,
    };
    setActive(prev => ({ ...prev, messages: [...(prev.messages || []), optimistic] }));

    setSending(true);
    try {
      const res = await fetch("/api/whatsapp/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: active.id, message: messageText }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to send message");
        // Remove optimistic message on failure
        setActive(prev => ({
          ...prev,
          messages: prev.messages.filter(m => m.id !== optimistic.id),
        }));
        setReply(messageText); // Restore input
      } else {
        toast.success("Message sent", { duration: 2000 });
      }
    } catch {
      toast.error("Error sending message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResolve = async () => {
    if (!active || resolving) return;
    const newStatus = active.status === "OPEN" ? "RESOLVED" : "OPEN";
    setResolving(true);
    try {
      const res = await fetch("/api/whatsapp/conversations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: active.id, status: newStatus }),
      });
      if (res.ok) {
        setActive(prev => ({ ...prev, status: newStatus }));
        setConversations(prev => prev.map(c => c.id === active.id ? { ...c, status: newStatus } : c));
        toast.success(newStatus === "RESOLVED" ? "Marked as resolved" : "Reopened", { duration: 2000 });
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setResolving(false);
    }
  };

  const filteredConversations = conversations.filter(c => {
    if (!search) return true;
    const name = (c.displayName || c.phone).toLowerCase();
    return name.includes(search.toLowerCase()) || c.phone.includes(search);
  });

  // Group messages by date
  const groupedMessages = (active?.messages || []).reduce((groups, msg) => {
    const date = formatMessageDate(msg.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div className="flex h-[calc(100vh-5rem)] -m-4 md:-m-8 overflow-hidden rounded-none md:rounded-3xl border border-slate-200 bg-white shadow-sm">

      {/* ── LEFT: Conversation List ── */}
      <div className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-100 shrink-0 ${showMobileThread ? "hidden md:flex" : "flex"}`}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-slate-900">Messages</h1>
              {totalUnread > 0 && (
                <p className="text-xs text-slate-500">{totalUnread} unread</p>
              )}
            </div>
            <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center">
              <MessageCircle size={18} className="text-white" />
            </div>
          </div>
          {/* Search */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none w-full text-slate-700 placeholder-slate-400"
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X size={14} className="text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <MessageCircle size={24} className="text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-500">
                {search ? "No conversations match your search" : "No messages yet"}
              </p>
              {!search && (
                <p className="text-xs text-slate-400 mt-1">
                  When tenants message on WhatsApp, conversations will appear here.
                </p>
              )}
            </div>
          ) : (
            filteredConversations.map(conv => {
              const isActive = active?.id === conv.id;
              const lastMsg = conv.messages?.[0];
              const name = conv.displayName || conv.phone;
              const initials = name?.charAt(0)?.toUpperCase() || "?";
              const isTenant = !!conv.tenantId;

              return (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className={`w-full px-4 py-3.5 flex items-start gap-3 text-left border-b border-slate-50 transition-colors ${
                    isActive ? "bg-blue-50" : "hover:bg-slate-50"
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    isTenant ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                  }`}>
                    {initials}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-sm font-semibold truncate ${isActive ? "text-blue-700" : "text-slate-900"}`}>
                        {name}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <p className="text-xs text-slate-500 truncate">
                        {lastMsg
                          ? (lastMsg.direction === "OUTBOUND" ? "You: " : "") + lastMsg.body
                          : conv.phone}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="text-[10px] font-black bg-green-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none shrink-0">
                          {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      {isTenant ? (
                        <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-bold border border-blue-100">Tenant</span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded font-bold border border-slate-200">Enquiry</span>
                      )}
                      {conv.status === "RESOLVED" && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded font-bold border border-emerald-100">Resolved</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT: Thread View ── */}
      <div className={`flex-1 flex flex-col min-w-0 ${showMobileThread ? "flex" : "hidden md:flex"}`}>
        {!active ? (
          // Empty state
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-20 h-20 rounded-3xl bg-green-50 flex items-center justify-center mb-4 border border-green-100">
              <MessageCircle size={36} className="text-green-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Select a conversation</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-xs">
              Choose a conversation from the left to view the messages and reply.
            </p>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 shrink-0 bg-white">
              {/* Mobile back button */}
              <button
                className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                onClick={() => { setShowMobileThread(false); setActive(null); router.replace("/landlord/messages", { scroll: false }); }}
              >
                <ArrowLeft size={18} className="text-slate-500" />
              </button>

              {/* Avatar */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                active.tenantId ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
              }`}>
                {(active.displayName || active.phone)?.charAt(0)?.toUpperCase() || "?"}
              </div>

              {/* Name + phone */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {active.displayName || active.phone}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Phone size={10} /> {active.phone}
                  </p>
                  {active.tenantId && (
                    <Link
                      href={`/landlord/tenants/${active.tenantId}`}
                      className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 font-semibold"
                    >
                      View Profile <ExternalLink size={9} />
                    </Link>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleResolve}
                  disabled={resolving}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    active.status === "RESOLVED"
                      ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                  }`}
                >
                  {active.status === "RESOLVED" ? (
                    <><Clock size={12} /> Reopen</>
                  ) : (
                    <><CheckCircle2 size={12} /> Resolve</>
                  )}
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-slate-50/40">
              {Object.keys(groupedMessages).length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-slate-400">No messages yet</p>
                </div>
              ) : (
                Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date} className="space-y-2">
                    {/* Date separator */}
                    <div className="flex items-center gap-3 my-3">
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{date}</span>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>

                    {msgs.map(msg => {
                      const isOutbound = msg.direction === "OUTBOUND";
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            isOutbound
                              ? "bg-blue-600 text-white rounded-br-sm"
                              : "bg-white text-slate-800 border border-slate-100 shadow-sm rounded-bl-sm"
                          }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>
                            <div className={`flex items-center gap-1 mt-1 ${isOutbound ? "justify-end" : "justify-start"}`}>
                              <span className={`text-[10px] ${isOutbound ? "text-blue-200" : "text-slate-400"}`}>
                                {formatMessageTime(msg.createdAt)}
                              </span>
                              {isOutbound && (
                                msg.read
                                  ? <CheckCheck size={12} className="text-blue-200" />
                                  : <Check size={12} className="text-blue-200" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Input */}
            {active.status === "RESOLVED" ? (
              <div className="px-5 py-4 border-t border-slate-100 bg-white text-center">
                <p className="text-xs text-slate-500">
                  This conversation is resolved.{" "}
                  <button onClick={handleResolve} className="text-blue-600 font-semibold hover:underline">
                    Reopen to reply
                  </button>
                </p>
              </div>
            ) : (
              <div className="px-4 py-3 border-t border-slate-100 bg-white shrink-0">
                <div className="flex items-end gap-3 bg-slate-50 rounded-2xl border border-slate-200 px-4 py-2.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                  <textarea
                    ref={textareaRef}
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                    rows={1}
                    className="flex-1 bg-transparent text-sm outline-none resize-none text-slate-800 placeholder-slate-400 leading-relaxed max-h-32 overflow-y-auto"
                    style={{ height: "auto" }}
                    onInput={e => {
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!reply.trim() || sending}
                    className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 flex items-center justify-center transition-colors shrink-0 mb-0.5"
                  >
                    {sending ? (
                      <RefreshCw size={15} className="text-white animate-spin" />
                    ) : (
                      <Send size={15} className={reply.trim() ? "text-white" : "text-slate-400"} />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 px-1">
                  Sending as Covenant Hostel via WhatsApp
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
