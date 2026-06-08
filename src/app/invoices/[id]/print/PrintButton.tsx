"use client";
import Link from "next/link";

export default function PrintButton() {
  return (
    <div className="no-print" style={{ display: "flex", gap: 10, justifyContent: "center", margin: "16px 0" }}>
      <button className="btn btn-primary" onClick={() => window.print()}>🖨 Print / Save PDF</button>
      <Link href="/invoices" className="btn">Back to invoices</Link>
    </div>
  );
}
