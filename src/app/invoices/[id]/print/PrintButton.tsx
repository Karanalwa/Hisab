"use client";
import Link from "next/link";

export default function PrintButton({ id, customerPhone }: { id: string; customerPhone?: string }) {
  function shareWhatsApp() {
    const url = `${window.location.origin}/i/${id}`;
    const msg = `Here is your invoice from our shop:\n${url}`;
    const phone = (customerPhone || "").replace(/\D/g, "");
    const wa = phone
      ? `https://wa.me/91${phone.slice(-10)}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(wa, "_blank");
  }
  async function copyLink() {
    const url = `${window.location.origin}/i/${id}`;
    try { await navigator.clipboard.writeText(url); alert("Invoice link copied:\n" + url); }
    catch { prompt("Copy this invoice link:", url); }
  }

  return (
    <div className="no-print" style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", margin: "18px 0" }}>
      <button className="btn btn-primary" onClick={() => window.print()}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        Print / Save PDF
      </button>
      <button className="btn btn-green" onClick={shareWhatsApp}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
        WhatsApp
      </button>
      <button className="btn" onClick={copyLink}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
        Copy link
      </button>
      <Link href={`/invoices/${id}/edit`} className="btn" style={{ textDecoration: "none" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Edit
      </Link>
      <Link href="/invoices" className="btn" style={{ textDecoration: "none" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back
      </Link>
    </div>
  );
}
