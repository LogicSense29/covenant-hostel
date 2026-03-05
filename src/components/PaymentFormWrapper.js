"use client";

import dynamic from "next/dynamic";

const PaymentForm = dynamic(() => import("./PaymentForm"), {
  ssr: false,
  loading: () => (
    <div className="p-8 bg-slate-50 animate-pulse rounded-3xl h-64 border border-slate-100 flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs">
      Initializing Secure Checkout...
    </div>
  )
});

export default function PaymentFormWrapper(props) {
  return <PaymentForm {...props} />;
}
