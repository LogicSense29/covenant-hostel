"use client";

import { useState } from "react";
import { 
  FileText, CheckCircle2, Clock, XCircle, ChevronRight,
  Receipt, Layers, Calendar, DollarSign, Info
} from "lucide-react";

export default function InteractivePaymentTable({ payments, allPayments = null, showTime = false }) {
  const [selectedPayment, setSelectedPayment] = useState(null);

  // If allPayments is not provided, use the current payments list for group detection
  const referenceList = allPayments || payments;

  // Helper to extract the parent Paystack reference by stripping child suffixes
  const getBaseReference = (ref) => {
    if (!ref) return null;
    if (ref.includes("-rc-")) {
      return ref.split("-rc-")[0];
    }
    return ref;
  };

  // Helper to find other payments made in the same transaction
  const findTransactionGroup = (target) => {
    const targetBaseRef = getBaseReference(target.reference);

    return referenceList.filter(p => {
      if (p.id === target.id) return true;
      
      // Match by exact identical receiptUrl (for bank transfers)
      if (target.receiptUrl && p.receiptUrl === target.receiptUrl) return true;
      
      // Match by identical base reference prefix (for Paystack payments)
      const pBaseRef = getBaseReference(p.reference);
      if (targetBaseRef && pBaseRef && targetBaseRef === pBaseRef) return true;
      
      // Fallback: Match by timestamp within 5 seconds
      const tDiff = Math.abs(new Date(p.createdAt) - new Date(target.createdAt));
      if (tDiff < 5000) return true; 
      
      return false;
    });
  };

  const getPaymentTypeName = (pmt) => {
    if (pmt.paymentType === "PARTIAL") {
      return `Installment ${pmt.installmentNumber}/${pmt.totalInstallments}`;
    }
    if (pmt.paymentType === "RECURRING") {
      const chargeTitle = pmt.recurringCharge?.billingRule?.title || pmt.recurringCharge?.billingRule?.description || "Recurring Charge";
      return chargeTitle;
    }
    return "Base Room Rent";
  };

  const getStatusBadge = (status) => {
    const isSuccess = status === "SUCCESS" || status === "VERIFIED";
    const isPending = status === "PENDING";
    
    return (
      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tighter border ${
        isSuccess
          ? "bg-green-50 text-green-600 border-green-100"
          : isPending
          ? "bg-amber-50 text-amber-600 border-amber-100"
          : "bg-red-50 text-red-600 border-red-100"
      }`}>
        {status === "SUCCESS" ? "Confirmed" : status}
      </span>
    );
  };

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/30 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <th className="px-6 py-4">Reference</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Date {showTime && "/ Time"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map((pmt) => {
              const group = findTransactionGroup(pmt);
              const hasConsolidatedBreakdown = group.length > 1;
              const parentRef = getBaseReference(pmt.reference);

              return (
                <tr 
                  key={pmt.id} 
                  onClick={() => setSelectedPayment({ pmt, group })}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer group/row"
                >
                  {/* Reference / Receipt */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-500">
                          {parentRef ? `#${parentRef.toUpperCase()}` : "Bank Transfer"}
                        </span>
                        {hasConsolidatedBreakdown && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 tracking-tight uppercase animate-pulse" title="Part of a consolidated payment">
                            +{group.length - 1} more
                          </span>
                        )}
                      </div>
                      {pmt.receiptUrl && (
                        <a 
                          href={pmt.receiptUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline mt-0.5"
                        >
                          <FileText size={11} className="text-blue-500" />
                          View Receipt
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="px-6 py-4">
                    <span className="font-extrabold text-slate-900 text-sm">
                      ₦{pmt.amount.toLocaleString()}
                    </span>
                  </td>

                  {/* Type */}
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold text-slate-600">
                      {getPaymentTypeName(pmt)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    {getStatusBadge(pmt.status)}
                  </td>

                  {/* Date & Time */}
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs font-bold text-slate-500 block">
                      {new Date(pmt.createdAt).toLocaleDateString("en-GB", { 
                        day: "numeric", 
                        month: "short", 
                        year: "numeric" 
                      })}
                    </span>
                    {showTime && (
                      <span className="text-[10px] text-slate-400 block font-normal mt-0.5">
                        {new Date(pmt.createdAt).toLocaleTimeString("en-GB", { 
                          hour: "2-digit", 
                          minute: "2-digit" 
                        })}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modern Popover / Modal for Clicked Payment Breakdown and Details */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase rounded-lg tracking-wider">
                    Transaction Details
                  </span>
                  {getStatusBadge(selectedPayment.pmt.status)}
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  {getPaymentTypeName(selectedPayment.pmt)}
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                  <Calendar size={12} />
                  Paid on {new Date(selectedPayment.pmt.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <button 
                onClick={() => setSelectedPayment(null)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              
              {/* Receipt / Reference Header Box */}
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment Reference</p>
                  <p className="text-xs font-mono font-bold text-slate-700">
                    {getBaseReference(selectedPayment.pmt.reference) ? `#${getBaseReference(selectedPayment.pmt.reference).toUpperCase()}` : "Bank Transfer"}
                  </p>
                </div>
                {selectedPayment.pmt.receiptUrl && (
                  <a 
                    href={selectedPayment.pmt.receiptUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-xs font-bold text-blue-600 hover:text-blue-700 rounded-xl border border-slate-200 hover:border-slate-300 transition-all shadow-sm"
                  >
                    <FileText size={12} />
                    View Receipt File
                  </a>
                )}
              </div>

              {/* Single Payment Details */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Payment info</h4>
                <div className="bg-slate-50/30 border border-slate-100 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Payment Category</span>
                    <span className="font-bold text-slate-800">
                      {selectedPayment.pmt.paymentType === "RECURRING" ? "Service / Utility Fee" : "Accommodation Rent"}
                    </span>
                  </div>
                  <div className="h-px bg-slate-100" />
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Payment Value</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      ₦{selectedPayment.pmt.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Database-stored breakdown if it exists */}
              {selectedPayment.pmt.breakdown && Array.isArray(selectedPayment.pmt.breakdown) && selectedPayment.pmt.breakdown.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pl-1">
                    <Layers size={14} className="text-blue-600" />
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Itemized Payment Breakdown
                    </h4>
                  </div>
                  
                  <div className="border border-blue-100/70 rounded-2xl bg-blue-50/20 divide-y divide-blue-100/50 overflow-hidden">
                    {selectedPayment.pmt.breakdown.map((item, index) => (
                      <div 
                        key={index} 
                        className="p-3.5 flex items-center justify-between transition-colors hover:bg-blue-50/30"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                            <Receipt size={13} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              {item.name}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-slate-900">
                          ₦{item.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    
                    {/* Sum details */}
                    <div className="p-3.5 bg-blue-50/30 flex justify-between items-center border-t border-blue-100/70">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Paid</span>
                      <span className="text-sm font-black text-blue-900">
                        ₦{selectedPayment.pmt.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : selectedPayment.group.length > 1 ? (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 pl-1">
                    <Layers size={14} className="text-blue-600" />
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Consolidated Payment Breakdown
                    </h4>
                  </div>
                  
                  <div className="border border-blue-100/70 rounded-2xl bg-blue-50/20 divide-y divide-blue-100/50 overflow-hidden">
                    {selectedPayment.group.map((item) => {
                      const isSelf = item.id === selectedPayment.pmt.id;
                      const isRent = item.paymentType !== "RECURRING";
                      return (
                        <div 
                          key={item.id} 
                          className={`p-3.5 flex items-center justify-between transition-colors ${
                            isSelf ? "bg-blue-50/50" : "hover:bg-blue-50/30"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-lg ${
                              isRent ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                            }`}>
                              {isRent ? <Receipt size={13} /> : <Layers size={13} />}
                            </div>
                            <div>
                              <p className={`text-xs font-bold ${isSelf ? "text-blue-900" : "text-slate-800"}`}>
                                {getPaymentTypeName(item)}
                                {isSelf && (
                                  <span className="ml-1.5 text-[8px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                                    Viewing
                                  </span>
                                )}
                              </p>
                              <p className="text-[9px] text-slate-400 mt-0.5">
                                {isRent ? "Accommodation Rent Fee" : "Service & Utility Charge"}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-black text-slate-900">
                            ₦{item.amount.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                    
                    {/* Sum details */}
                    <div className="p-3.5 bg-blue-50/30 flex justify-between items-center border-t border-blue-100/70">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Consolidated Total Paid</span>
                      <span className="text-sm font-black text-blue-900">
                        ₦{selectedPayment.group.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-slate-400 italic text-center">
                    * The above payments were processed together under a single check-out transaction.
                  </p>
                </div>
              ) : null}
            </div>

            {/* Done Action */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button 
                onClick={() => setSelectedPayment(null)}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm transition-all shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
