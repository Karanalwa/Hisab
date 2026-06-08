import { createClient } from "@/lib/supabase/server";
import { getShop } from "@/lib/shop";
import { money, fmtDate, numWords } from "@/lib/gst";
import type { Invoice } from "@/lib/types";
import { notFound } from "next/navigation";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

export default async function PrintInvoice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shop = await getShop();
  const supabase = await createClient();
  const { data } = await supabase.from("invoices").select("*").eq("id", id).single();
  if (!data || !shop) notFound();
  const inv = data as Invoice;

  const th: React.CSSProperties = { textAlign: "left", padding: "8px 10px", borderBottom: "2px solid #1c1a3a", fontSize: 12 };
  const td: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid #eee", fontSize: 12.5 };

  return (
    <div style={{ background: "#fff", minHeight: "100vh", padding: "24px 0" }}>
      <PrintButton />
      <div style={{ maxWidth: 800, margin: "0 auto", background: "#fff", padding: 36, border: "1px solid #eee" }}>
        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #6366f1", paddingBottom: 16, marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {shop.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shop.logo_url} alt="logo" style={{ height: 56, borderRadius: 8 }} />
            ) : <div style={{ fontSize: 40 }}>⚡</div>}
            <div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{shop.name}</div>
              <div style={{ fontSize: 12, color: "#555" }}>{shop.address}{shop.pin ? " - " + shop.pin : ""}</div>
              <div style={{ fontSize: 12, color: "#555" }}>{shop.state} · {shop.phone}</div>
              {shop.gstin && <div style={{ fontSize: 12, color: "#555" }}>GSTIN: {shop.gstin}</div>}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#6366f1" }}>TAX INVOICE</div>
            <div style={{ fontSize: 13, marginTop: 6 }}><b>{inv.no}</b></div>
            <div style={{ fontSize: 12, color: "#555" }}>{fmtDate(inv.date)}</div>
          </div>
        </div>

        {/* bill to */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: ".5px" }}>Bill To</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{inv.customer_name}</div>
          {inv.customer_address && <div style={{ fontSize: 12, color: "#555" }}>{inv.customer_address}</div>}
          <div style={{ fontSize: 12, color: "#555" }}>{inv.customer_state}{inv.customer_phone ? " · " + inv.customer_phone : ""}</div>
          {inv.customer_gstin && <div style={{ fontSize: 12, color: "#555" }}>GSTIN: {inv.customer_gstin}</div>}
        </div>

        {/* items */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>#</th><th style={th}>Item</th><th style={th}>HSN</th>
              <th style={{ ...th, textAlign: "right" }}>Qty</th>
              <th style={{ ...th, textAlign: "right" }}>Rate</th>
              <th style={{ ...th, textAlign: "right" }}>Disc%</th>
              <th style={{ ...th, textAlign: "right" }}>GST%</th>
              <th style={{ ...th, textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((l, idx) => (
              <tr key={idx}>
                <td style={td}>{idx + 1}</td>
                <td style={{ ...td, fontWeight: 600 }}>{l.name}</td>
                <td style={td}>{l.hsn}</td>
                <td style={{ ...td, textAlign: "right" }}>{l.qty}</td>
                <td style={{ ...td, textAlign: "right" }}>{money(l.price)}</td>
                <td style={{ ...td, textAlign: "right" }}>{l.disc || 0}</td>
                <td style={{ ...td, textAlign: "right" }}>{inv.no_tax ? "-" : l.gst}</td>
                <td style={{ ...td, textAlign: "right" }}>{money(l.amount ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* totals */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
          <div style={{ maxWidth: 320 }}>
            <div style={{ fontSize: 11, color: "#888" }}>Amount in words</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{numWords(inv.total)} Rupees Only</div>
            {shop.upi_qr_url && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, color: "#888" }}>Scan to pay{shop.upi_id ? " · " + shop.upi_id : ""}</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shop.upi_qr_url} alt="UPI QR" style={{ height: 110, marginTop: 4 }} />
              </div>
            )}
          </div>
          <div style={{ minWidth: 240 }}>
            <Line label="Taxable" value={money(inv.taxable)} />
            {!inv.no_tax && inv.inter_state && <Line label="IGST" value={money(inv.igst)} />}
            {!inv.no_tax && !inv.inter_state && <><Line label="CGST" value={money(inv.cgst)} /><Line label="SGST" value={money(inv.sgst)} /></>}
            <Line label="Round off" value={money(inv.round)} />
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #1c1a3a", marginTop: 6, paddingTop: 8, fontSize: 18, fontWeight: 800 }}>
              <span>Total</span><span style={{ color: "#6366f1" }}>{money(inv.total)}</span>
            </div>
            <Line label="Paid" value={money(inv.paid)} />
            <Line label="Due" value={money(Math.max(0, (inv.total || 0) - (inv.paid || 0)))} />
          </div>
        </div>

        <div style={{ marginTop: 36, textAlign: "right", fontSize: 12, color: "#555" }}>
          For {shop.name}<br /><br /><br />Authorised Signatory
        </div>
        <div style={{ marginTop: 24, textAlign: "center", fontSize: 11, color: "#999" }}>Thank you for your business!</div>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0", color: "#444" }}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
