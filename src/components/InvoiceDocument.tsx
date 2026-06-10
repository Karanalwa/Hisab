import { money, fmtDate, numWords } from "@/lib/gst";
import type { Invoice, CreditNote } from "@/lib/types";

export type InvoiceShop = {
  name: string;
  address: string;
  pin: string;
  gstin: string;
  state: string;
  phone: string;
  logo_url: string | null;
  upi_qr_url: string | null;
  upi_id: string;
  terms: string;
  signature_url: string | null;
};

const th: React.CSSProperties = { textAlign: "left", padding: "9px 10px", borderBottom: "2px solid #0f172a", fontSize: 12, fontWeight: 700 };
const td: React.CSSProperties = { padding: "9px 10px", borderBottom: "1px solid #e2e8f0", fontSize: 12.5 };

/** Pure presentational tax-invoice document. Used by the authed view and the public link. */
export default function InvoiceDocument({ inv, shop, creditNotes = [] }: { inv: Invoice; shop: InvoiceShop; creditNotes?: CreditNote[] }) {
  const totalReturns = creditNotes.reduce((s, cn) => s + (cn.total || 0), 0);

  return (
    <div className="inv-page">
      <div className="inv-head">
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {shop.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shop.logo_url} alt="logo" style={{ height: 56, borderRadius: 8, objectFit: "contain" }} />
          ) : <img src="/logo.svg" alt="logo" width={56} height={56} style={{ borderRadius: 8, display: "block" }} />}
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3 }}>{shop.name}</div>
            <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 2 }}>{shop.address}{shop.pin ? " - " + shop.pin : ""}</div>
            <div style={{ fontSize: 12.5, color: "#64748b" }}>{shop.state} · {shop.phone}</div>
            {shop.gstin && <div style={{ fontSize: 12.5, color: "#64748b" }}>GSTIN: {shop.gstin}</div>}
          </div>
        </div>
        <div className="inv-head-right">
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--brand)", letterSpacing: -0.3 }}>TAX INVOICE</div>
          <div style={{ fontSize: 13.5, marginTop: 6, fontWeight: 700 }}>{inv.no}</div>
          <div style={{ fontSize: 12.5, color: "#64748b" }}>{fmtDate(inv.date)}</div>
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".5px", fontWeight: 700 }}>Bill To</div>
        <div style={{ fontSize: 15.5, fontWeight: 700, marginTop: 4 }}>{inv.customer_name}</div>
        {inv.customer_address && <div style={{ fontSize: 12.5, color: "#64748b" }}>{inv.customer_address}</div>}
        <div style={{ fontSize: 12.5, color: "#64748b" }}>{inv.customer_state}{inv.customer_phone ? " · " + inv.customer_phone : ""}</div>
        {inv.customer_gstin && <div style={{ fontSize: 12.5, color: "#64748b" }}>GSTIN: {inv.customer_gstin}</div>}
      </div>

      <div className="inv-table-wrap">
        <table className="inv-table" style={{ width: "100%", borderCollapse: "collapse" }}>
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
                <td style={{ ...td, fontWeight: 700 }}>{l.name}</td>
                <td style={td}>{l.hsn}</td>
                <td style={{ ...td, textAlign: "right" }}>{l.qty}</td>
                <td style={{ ...td, textAlign: "right" }}>{money(l.price)}</td>
                <td style={{ ...td, textAlign: "right" }}>{l.disc || 0}</td>
                <td style={{ ...td, textAlign: "right" }}>{inv.no_tax ? "-" : l.gst}</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{money(l.amount ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creditNotes.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".5px", fontWeight: 700, marginBottom: 8 }}>Credit Notes / Returns</div>
          {creditNotes.map((cn) => (
            <div key={cn.id} style={{ marginBottom: 10, border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", background: "#f8fafc" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{cn.no}</span>
                <span style={{ fontSize: 12, color: "#64748b" }}>{fmtDate(cn.date)}</span>
              </div>
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                <tbody>
                  {cn.items.map((it, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: "3px 0" }}>{it.name}</td>
                      <td style={{ padding: "3px 0", textAlign: "right" }}>{it.qty} × {money(it.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ textAlign: "right", fontWeight: 800, fontSize: 13, marginTop: 4, color: "var(--red)" }}>− {money(cn.total)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="inv-totals">
        <div style={{ maxWidth: 320 }}>
          <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>Amount in words</div>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 4 }}>{numWords(inv.total)} Rupees Only</div>
          {shop.upi_qr_url && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>Scan to pay{shop.upi_id ? " · " + shop.upi_id : ""}</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shop.upi_qr_url} alt="UPI QR" style={{ height: 120, marginTop: 6, borderRadius: 8, border: "1px solid #e2e8f0" }} />
            </div>
          )}
        </div>
        <div style={{ minWidth: 260 }}>
          <Line label="Taxable" value={money(inv.taxable)} />
          {!inv.no_tax && inv.inter_state && <Line label="IGST" value={money(inv.igst)} />}
          {!inv.no_tax && !inv.inter_state && <><Line label="CGST" value={money(inv.cgst)} /><Line label="SGST" value={money(inv.sgst)} /></>}
          <Line label="Round off" value={money(inv.round)} />
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #0f172a", marginTop: 8, paddingTop: 10, fontSize: 18, fontWeight: 800 }}>
            <span>Total</span><span style={{ color: "var(--brand)" }}>{money(inv.total)}</span>
          </div>
          {totalReturns > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", color: "var(--red)" }}>
              <span>Returns</span><span style={{ fontWeight: 600 }}>− {money(totalReturns)}</span>
            </div>
          )}
          <Line label="Paid" value={money(inv.paid)} />
          <Line label="Due" value={money(Math.max(0, (inv.total || 0) - (inv.paid || 0) - totalReturns))} />
        </div>
      </div>

      <div className="inv-footer">
        <div className="inv-footer-col">
          {shop.terms && (
            <>
              <div className="inv-footer-heading">Terms & Conditions</div>
              <div className="inv-footer-text" style={{ whiteSpace: "pre-line" }}>{shop.terms}</div>
            </>
          )}
        </div>
        <div className="inv-footer-col" style={{ textAlign: "right" }}>
          {shop.signature_url && (
            <img src={shop.signature_url} alt="Signature" style={{ height: 56, objectFit: "contain", marginBottom: 8 }} />
          )}
          <div style={{ fontSize: 12.5 }}>For {shop.name}</div>
          <div style={{ fontSize: 11.5, opacity: 0.7 }}>Authorised Signatory</div>
        </div>
      </div>
      <div style={{ marginTop: 28, textAlign: "center", fontSize: 11.5, color: "var(--mut)" }}>Thank you for your business!</div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, padding: "4px 0", color: "#475569" }}>
      <span>{label}</span><span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
