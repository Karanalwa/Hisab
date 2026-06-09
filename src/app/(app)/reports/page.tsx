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
    { l: "Invoices", v: String(list.length) },
    { l: "Taxable Value", v: money(taxable) },
    { l: "Total Sales", v: money(total) },
    { l: "Collected", v: money(collected) },
    { l: "CGST", v: money(cgst) },
    { l: "SGST", v: money(sgst) },
    { l: "IGST", v: money(igst) },
    { l: "Total GST", v: money(cgst + sgst + igst) },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 23, fontWeight: 800, marginBottom: 4 }}>Reports</h2>
      <p style={{ color: "var(--mut)", fontSize: 13, marginBottom: 18 }}>Sales &amp; GST summary, ready for filing</p>

      <form className="card" style={{ padding: "14px 20px", marginBottom: 18, display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div><label className="fld">From</label><input className="inp" type="date" name="from" defaultValue={sp.from || ""} /></div>
        <div><label className="fld">To</label><input className="inp" type="date" name="to" defaultValue={sp.to || ""} /></div>
        <button className="btn btn-primary" type="submit">Apply</button>
      </form>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 14, marginBottom: 18 }}>
        {cards.map((c) => (
          <div key={c.l} className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: "var(--mut)", textTransform: "uppercase", fontWeight: 700 }}>{c.l}</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{c.v}</div>
          </div>
        ))}
      </div>

      <div className="grid-2 rev">
        <div className="card" style={{ padding: "16px 20px" }}>
          <h3 style={{ fontWeight: 800, marginBottom: 12 }}>By Payment Mode</h3>
          <table className="tbl">
            <tbody>
              {Object.entries(byMode).map(([m, v]) => <tr key={m}><td>{m}</td><td className="r">{money(v)}</td></tr>)}
              {!Object.keys(byMode).length && <tr><td style={{ color: "var(--mut)" }}>No data in range.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: "16px 20px" }}>
          <h3 style={{ fontWeight: 800, marginBottom: 12 }}>Invoice Register</h3>
          <table className="tbl">
            <thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th className="r">Taxable</th><th className="r">GST</th><th className="r">Total</th></tr></thead>
            <tbody>
              {list.map((i) => (
                <tr key={i.id}>
                  <td style={{ fontWeight: 700 }}>{i.no}</td>
                  <td>{fmtDate(i.date)}</td>
                  <td>{i.customer_name}</td>
                  <td className="r">{money(i.taxable)}</td>
                  <td className="r">{money((i.cgst || 0) + (i.sgst || 0) + (i.igst || 0))}</td>
                  <td className="r">{money(i.total)}</td>
                </tr>
              ))}
              {!list.length && <tr><td colSpan={6} style={{ color: "var(--mut)" }}>No invoices in range.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
