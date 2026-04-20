"use client";

import { Suspense } from "react";
import RegisterForm from "./RegisterForm";

export default function RegisterFormWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
