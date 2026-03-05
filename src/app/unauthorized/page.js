"use client";

import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "#f0f4f8", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "3rem", color: "#e53e3e", marginBottom: "1rem" }}>403 - Unauthorized</h1>
      <p style={{ fontSize: "1.2rem", color: "#334e68", marginBottom: "2rem" }}>You do not have permission to view this page.</p>
      <Link href="/dashboard" style={{ padding: "12px 24px", backgroundColor: "#0b69ff", color: "white", textDecoration: "none", borderRadius: "8px", fontWeight: "bold" }}>
        Return to Dashboard
      </Link>
    </div>
  );
}
