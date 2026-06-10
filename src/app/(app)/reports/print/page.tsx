import { createClient } from "@/lib/supabase/server";
import { money, fmtDate } from "@/lib/gst";
import type { Invoice } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ReportsPrint({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const from = sp.from || "2000-01-01";
  const to = sp.to || "2099-12-31";

  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("*")
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: false });
  const list = (data || []) as Invoice[];

  const taxable = list.reduce((s, i) => s + (i.taxable || 0), 0);
  const cgst = list.reduce((s, i) => s + (i.cgst || 0), 0);
  const sgst = list.reduce((s, i) => s + (i.sgst || 0), 0);
  const igst = list.reduce((s, i) => s + (i.igst || 0), 0);
  const total = list.reduce((s, i) => s + (i.total || 0), 0);
  const collected = list.reduce((s, i) => s + (i.paid || 0), 0);

  const cards = [
    { l: "Invoices", v: String(list.length), c: "#0ea5e9" },
    { l: "Taxable Value", v: money(taxable), c: "#6366f1" },
    { l: "Total Sales", v: money(total), c: "#10b981" },
    { l: "Collected", v: money(collected), c: "#0ea5e9" },
    { l: "CGST", v: money(cgst), c: "#f59e0b" },
    { l: "SGST", v: money(sgst), c: "#f59e0b" },
    { l: "IGST", v: money(igst), c: "#ef4444" },
    { l: "Total GST", v: money(cgst + sgst + igst), c: "#6366f1" },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "30px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Sales & GST Report</h2>
          <p style={{ color: "var(--mut)", fontSize: 13 }}>
            {fmtDate(from)} — {fmtDate(to)} · {list.length} invoices
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginBottom: 24 }}>
          {cards.map((c) => (
            <div key={c.l} style={{ padding: 14, border: "1px solid var(--line)", borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: "var(--mut)", textTransform: "uppercase", fontWeight: 700, letterSpacing: ".5px" }}>{c.l}</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 6, color: c.c }}>{c.v}</div>
            </div>
          ))}
        </div>

        <table className="tbl" style={{ fontSize: 12 }}>
          <thead>
            <tr>
              <th>Invoice</th><th>Date</th><th>Customer</th><th className="r">Taxable</th>
              <th className="r">CGST</th><th className="r">SGST</th><th className="r">IGST</th><th className="r">Total</th><th>Mode</th>
            </tr>
          </thead>
          <tbody>
            {list.map((i) => (
              <tr key={i.id}>
                <td style={{ fontWeight: 700 }}>{i.no}</td>
                <td style={{ color: "var(--mut)" }}>{fmtDate(i.date)}</td>
                <td style={{ color: "var(--mut)" }}>{i.customer_name}</td>
                <td className="r" style={{ fontWeight: 600 }}>{money(i.taxable)}</td>
                <td className="r" style={{ fontWeight: 600 }}>{money(i.cgst)}</td>
                <td className="r" style={{ fontWeight: 600 }}>{money(i.sgst)}</td>
                <td className="r" style={{ fontWeight: 600 }}>{money(i.igst)}</td>
                <td className="r" style={{ fontWeight: 700 }}>{money(i.total)}</td>
                <td><span className="pill pill-info">{i.pay_mode}</span></td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={9} style={{ color: "var(--mut)", padding: "20px 12px" }}>No invoices in range.</td></tr>}
          </tbody>
        </table>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `setTimeout(() => window.print(), 400);` }} />
    </div>
  );
}
