"use client";

import { useState, useEffect, useRef } from "react";
import { 
  X, 
  Send, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Star
} from "lucide-react";
import toast from "react-hot-toast";

export default function TicketChatDrawer({ isOpen, onClose, ticket, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  // Rating state
  const [rating, setRating] = useState(ticket?.tenantRating || 0);
  const [feedback, setFeedback] = useState(ticket?.tenantFeedback || "");
  const [submittingRating, setSubmittingRating] = useState(false);

  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async (showLoader = false) => {
    if (!ticket?.id) return;
    if (showLoader) setFetching(true);
    
    try {
      const res = await fetch(`/api/maintenance/tickets/${ticket.id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      if (showLoader) setFetching(false);
    }
  };

  useEffect(() => {
    if (isOpen && ticket) {
      document.body.style.overflow = "hidden";
      fetchMessages(true);
      
      // Start polling
      pollIntervalRef.current = setInterval(() => {
        fetchMessages(false);
      }, 5000);
    } else {
      document.body.style.overflow = "unset";
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }

    return () => {
      document.body.style.overflow = "unset";
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isOpen, ticket]);

  useEffect(() => {
    // Scroll to bottom whenever messages update
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !ticket) return;

    const tempMessage = {
      id: "temp-" + Date.now(),
      ticketId: ticket.id,
      senderId: currentUser.id,
      senderRole: currentUser.role,
      content: newMessage,
      createdAt: new Date().toISOString()
    };

    // Optimistic update
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage("");
    setLoading(true);

    try {
      const res = await fetch(`/api/maintenance/tickets/${ticket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser.id,
          senderRole: currentUser.role,
          content: tempMessage.content
        })
      });

      if (!res.ok) throw new Error("Failed to send message");
      
      // Fetch fresh to get real DB id
      await fetchMessages();
    } catch (error) {
      toast.error("Failed to send message");
      // Revert optimistic update
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setNewMessage(tempMessage.content);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast.error("Please select a star rating first");
      return;
    }

    setSubmittingRating(true);
    try {
      const res = await fetch(`/api/maintenance/tickets/${ticket.id}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, feedback })
      });

      if (!res.ok) throw new Error("Failed to submit rating");
      toast.success("Thank you for your feedback!");
      
      // Update local ticket object so UI reflects it immediately
      ticket.tenantRating = rating;
      ticket.tenantFeedback = feedback;
    } catch (error) {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmittingRating(false);
    }
  };

  if (!isOpen || !ticket) return null;

  const isResolved = ticket.status === "RESOLVED";
  const isTenant = currentUser.role === "TENANT";
  const needsRating = isResolved && isTenant && (!ticket.tenantRating || ticket.tenantRating === 0);
  const hasRated = isResolved && ticket.tenantRating > 0;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed h-screen inset-0 bg-slate-900/40 backdrop-blur-sm z-40 animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-x-0 bottom-0 top-16 md:top-0 md:bottom-0 md:inset-auto md:right-0 md:w-full md:max-w-md bg-slate-50 z-50 rounded-t-3xl md:rounded-none md:rounded-l-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom md:slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex flex-col p-5 border-b border-slate-200 bg-white sticky top-0 rounded-t-3xl md:rounded-tl-3xl z-10 shrink-0 shadow-sm">
           <div className="flex items-start justify-between mb-3">
             <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl border ${
                  ticket.status === 'OPEN' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                  ticket.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                  'bg-green-50 text-green-600 border-green-200'
                }`}>
                  {ticket.status === 'OPEN' ? <AlertCircle size={20} /> :
                   ticket.status === 'IN_PROGRESS' ? <Loader2 size={20} className="animate-spin" /> :
                   <CheckCircle2 size={20} />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-none mb-1">Ticket Chat</h2>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                    {ticket.status.replace("_", " ")}
                  </span>
                </div>
             </div>
             
             <button 
               onClick={onClose}
               className="p-2 bg-slate-50 text-slate-500 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors"
             >
               <X size={20} />
             </button>
           </div>
           
           {/* Original Issue Context Box */}
           <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700">
             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Original Issue</span>
             {ticket.issueDescription}
           </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto w-full flex flex-col relative px-4 py-6">
          {fetching ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="animate-spin text-slate-300" size={32} />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 pb-10">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
                <AlertCircle size={24} className="text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">No messages yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Send a message to start communicating about this ticket.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              {messages.map((msg, i) => {
                const isMe = msg.senderId === currentUser.id;
                
                // Grouping messages visually
                const prevMsg = i > 0 ? messages[i - 1] : null;
                const showAvatar = !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId);

                return (
                  <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                    {!isMe && showAvatar && (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 pl-1">
                        {msg.senderRole.replace("_", " ")}
                      </span>
                    )}
                    <div className={`
                      px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed relative
                      ${isMe 
                        ? 'bg-blue-600 text-white rounded-tr-sm shadow-md shadow-blue-500/20' 
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm shadow-sm'
                      }
                    `}>
                      {msg.content}
                    </div>
                    {/* Timestamp */}
                    <span className="text-[9px] font-semibold text-slate-400 mt-1 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Rating/Feedback UI or Chat Input */}
        <div className="bg-white border-t border-slate-200 p-4 shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
          {isResolved ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {needsRating ? (
                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex flex-col items-center text-center space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 border-b border-blue-100 pb-2 mb-2">Issue Resolved</h4>
                    <p className="text-xs text-slate-500 font-medium">How was your experience with this repair?</p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button 
                        key={star}
                        onClick={() => setRating(star)}
                        className={`transition-colors p-1 ${rating >= star ? 'text-amber-400' : 'text-slate-300 hover:text-amber-200'}`}
                      >
                        <Star className="fill-current" size={28} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Optional feedback..."
                    className="w-full bg-white border border-blue-100 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[60px]"
                  />
                  <button 
                    onClick={handleSubmitRating}
                    disabled={submittingRating || rating === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingRating ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              ) : hasRated ? (
                <div className="bg-green-50/50 border border-green-100 p-4 rounded-2xl flex flex-col items-center flex-col text-center space-y-2">
                  <div className="flex gap-1 text-amber-400 mb-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} size={16} className={ticket.tenantRating >= star ? "fill-current" : "text-green-200"} />
                    ))}
                  </div>
                  {ticket.tenantFeedback && (
                    <p className="text-xs text-slate-600 font-medium italic">"{ticket.tenantFeedback}"</p>
                  )}
                  <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 size={12} /> Feedback Submitted
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col items-center text-center">
                   <CheckCircle2 size={24} className="text-slate-400 mb-2" />
                   <p className="text-sm font-bold text-slate-600">This ticket has been resolved.</p>
                   <p className="text-xs text-slate-400 mt-1">The chat thread is now closed.</p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
              <div className="flex-1 bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-500/10 rounded-2xl flex items-center px-2 transition-all p-1">
                <button 
                  type="button" 
                  title="Attach image (Coming Soon)"
                  className="p-2.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
                >
                  <ImageIcon size={20} />
                </button>
                {/* Text Area for Input */}
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="text-black flex-1 max-h-32 min-h-[44px] bg-transparent border-none outline-none resize-none text-sm py-3 px-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
              </div>
              <button 
                type="submit"
                disabled={!newMessage.trim() || loading}
                className="bg-blue-600 text-white p-3.5 rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-md shadow-blue-500/20 shrink-0"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
