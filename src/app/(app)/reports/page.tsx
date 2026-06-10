import { createClient } from "@/lib/supabase/server";
import { money, fmtDate } from "@/lib/gst";
import type { Invoice } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
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

  const byMode: Record<string, number> = {};
  list.forEach((i) => { byMode[i.pay_mode] = (byMode[i.pay_mode] || 0) + (i.total || 0); });

  const cards = [
    { l: "Invoices", v: String(list.length), c: "#0ea5e9", s: "#e0f2fe" },
    { l: "Taxable Value", v: money(taxable), c: "#6366f1", s: "#e0e7ff" },
    { l: "Total Sales", v: money(total), c: "#10b981", s: "#d1fae5" },
    { l: "Collected", v: money(collected), c: "#0ea5e9", s: "#e0f2fe" },
    { l: "CGST", v: money(cgst), c: "#f59e0b", s: "#fef3c7" },
    { l: "SGST", v: money(sgst), c: "#f59e0b", s: "#fef3c7" },
    { l: "IGST", v: money(igst), c: "#ef4444", s: "#fee2e2" },
    { l: "Total GST", v: money(cgst + sgst + igst), c: "#6366f1", s: "#e0e7ff" },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, letterSpacing: -0.3 }}>Reports</h2>
        <p style={{ color: "var(--mut)", fontSize: 13.5 }}>Sales &amp; GST summary, ready for filing</p>
      </div>

      <form className="card" style={{ padding: "16px 22px", marginBottom: 20, display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div><label className="fld">From</label><input className="inp" type="date" name="from" defaultValue={sp.from || ""} /></div>
        <div><label className="fld">To</label><input className="inp" type="date" name="to" defaultValue={sp.to || ""} /></div>
        <button className="btn btn-primary" type="submit">Apply</button>
      </form>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 14, marginBottom: 20 }}>
        {cards.map((c) => (
          <div key={c.l} className="card card-hover" style={{ padding: 18 }}>
            <div style={{ fontSize: 11.5, color: "var(--mut)", textTransform: "uppercase", fontWeight: 700, letterSpacing: ".5px" }}>{c.l}</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 6, letterSpacing: -0.3, color: c.c }}>{c.v}</div>
          </div>
        ))}
      </div>

      <div className="grid-2 rev">
        <div className="card" style={{ padding: "18px 22px" }}>
          <h3 style={{ fontWeight: 800, marginBottom: 14, fontSize: 15 }}>By Payment Mode</h3>
          <table className="tbl">
            <tbody>
              {Object.entries(byMode).map(([m, v]) => <tr key={m}><td style={{ fontWeight: 600 }}>{m}</td><td className="r" style={{ fontWeight: 700 }}>{money(v)}</td></tr>)}
              {!Object.keys(byMode).length && <tr><td style={{ color: "var(--mut)", padding: "16px 12px" }}>No data in range.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: "18px 22px" }}>
          <h3 style={{ fontWeight: 800, marginBottom: 14, fontSize: 15 }}>Invoice Register</h3>
          <table className="tbl">
            <thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th className="r">Taxable</th><th className="r">GST</th><th className="r">Total</th></tr></thead>
            <tbody>
              {list.map((i) => (
                <tr key={i.id}>
                  <td style={{ fontWeight: 700, color: "var(--txt)" }}>{i.no}</td>
                  <td style={{ color: "var(--mut)" }}>{fmtDate(i.date)}</td>
                  <td style={{ color: "var(--mut)" }}>{i.customer_name}</td>
                  <td className="r" style={{ fontWeight: 600 }}>{money(i.taxable)}</td>
                  <td className="r" style={{ fontWeight: 600 }}>{money((i.cgst || 0) + (i.sgst || 0) + (i.igst || 0))}</td>
                  <td className="r" style={{ fontWeight: 700 }}>{money(i.total)}</td>
                </tr>
              ))}
              {!list.length && <tr><td colSpan={6} style={{ color: "var(--mut)", padding: "16px 12px" }}>No invoices in range.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
