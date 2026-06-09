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
    <div className="no-print" style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", margin: "16px 0" }}>
      <button className="btn btn-primary" onClick={() => window.print()}>🖨 Print / Save PDF</button>
      <button className="btn btn-green" onClick={shareWhatsApp}>🟢 WhatsApp</button>
      <button className="btn" onClick={copyLink}>🔗 Copy link</button>
      <Link href={`/invoices/${id}/edit`} className="btn">✏️ Edit</Link>
      <Link href="/invoices" className="btn">← Back</Link>
    </div>
  );
}
