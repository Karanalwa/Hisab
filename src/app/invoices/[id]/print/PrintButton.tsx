"use client";
import Link from "next/link";

export default function PrintButton({ id }: { id: string }) {
  return (
    <div className="no-print" style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", margin: "16px 0" }}>
      <button className="btn btn-primary" onClick={() => window.print()}>🖨 Print / Save PDF</button>
      <Link href={`/invoices/${id}/edit`} className="btn">✏️ Edit</Link>
      <Link href="/invoices" className="btn">← Back to invoices</Link>
    </div>
  );
}
