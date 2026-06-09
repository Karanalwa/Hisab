"use client";
import Link from "next/link";

export default function LedgerActions() {
  return (
    <div className="no-print" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
      <button className="btn btn-primary" onClick={() => window.print()}>🖨 Print / Save PDF</button>
      <Link href="/customers" className="btn">← Back to customers</Link>
    </div>
  );
}
