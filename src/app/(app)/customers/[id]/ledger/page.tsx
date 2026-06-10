import { createClient } from "@/lib/supabase/server";
import { money, fmtDate } from "@/lib/gst";
import type { Customer, Invoice } from "@/lib/types";
import { notFound } from "next/navigation";
import LedgerActions from "./LedgerActions";

export const dynamic = "force-dynamic";

type Entry = { date: string; type: string; ref: string; debit: number; credit: number };

export default async function CustomerLedger({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: cust }, { data: invData }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).single(),
    supabase.from("invoices").select("*").eq("customer_id", id),
  ]);
  if (!cust) notFound();
  const customer = cust as Customer;
  const invoices = (invData || []) as Invoice[];

  const entries: Entry[] = [];
  for (const i of invoices) {
    entries.push({ date: i.date, type: "Invoice", ref: i.no, debit: i.total || 0, credit: 0 });
    for (const p of i.payments || []) {
      if (p.amount > 0) entries.push({ date: p.date, type: `Payment (${p.mode})`, ref: i.no, debit: 0, credit: p.amount });
    }
  }
  entries.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const totalBilled = entries.reduce((s, e) => s + e.debit, 0);
  const totalPaid = entries.reduce((s, e) => s + e.credit, 0);
  const balance = totalBilled - totalPaid;

  let running = 0;

  return (
    <div className="animate-fade-in">
      <LedgerActions />

      <div className="inv-page">
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 14, borderBottom: "3px solid var(--brand)", paddingBottom: 16, marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".5px", fontWeight: 700 }}>Statement of Account</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4, letterSpacing: -0.3 }}>{customer.name}</div>
            <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 4 }}>
              {customer.phone}{customer.state ? " · " + customer.state : ""}{customer.gstin ? " · GSTIN " + customer.gstin : ""}
            </div>
            {customer.address && <div style={{ fontSize: 12.5, color: "#64748b" }}>{customer.address}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>Outstanding Balance</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: balance > 0.5 ? "var(--red)" : "var(--green)", letterSpacing: -0.5, marginTop: 4 }}>{money(balance)}</div>
          </div>
        </div>

        <div className="row-3" style={{ marginBottom: 18 }}>
          <Stat label="Total Billed" value={money(totalBilled)} />
          <Stat label="Total Paid" value={money(totalPaid)} />
          <Stat label="Balance Due" value={money(balance)} danger={balance > 0.5} />
        </div>

        <div className="inv-table-wrap">
          <table className="inv-table tbl" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Date</th><th>Particulars</th><th>Ref</th>
                <th className="r">Debit</th><th className="r">Credit</th><th className="r">Balance</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, idx) => {
                running += e.debit - e.credit;
                return (
                  <tr key={idx}>
                    <td style={{ color: "#64748b" }}>{fmtDate(e.date)}</td>
                    <td style={{ fontWeight: 600 }}>{e.type}</td>
                    <td style={{ color: "#64748b" }}>{e.ref}</td>
                    <td className="r" style={{ fontWeight: 600 }}>{e.debit ? money(e.debit) : "—"}</td>
                    <td className="r" style={{ fontWeight: 600 }}>{e.credit ? money(e.credit) : "—"}</td>
                    <td className="r" style={{ fontWeight: 800, color: running > 0.5 ? "var(--red)" : "var(--green)" }}>{money(running)}</td>
                  </tr>
                );
              })}
              {!entries.length && <tr><td colSpan={6} style={{ color: "var(--mut)", padding: "20px 12px" }}>No transactions yet.</td></tr>}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid #0f172a", fontWeight: 800 }}>
                <td colSpan={3} style={{ paddingTop: 10 }}>Total</td>
                <td className="r" style={{ paddingTop: 10 }}>{money(totalBilled)}</td>
                <td className="r" style={{ paddingTop: 10 }}>{money(totalPaid)}</td>
                <td className="r" style={{ color: balance > 0.5 ? "var(--red)" : "var(--green)", paddingTop: 10 }}>{money(balance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 11.5, color: "var(--mut)", textTransform: "uppercase", fontWeight: 700, letterSpacing: ".5px" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, marginTop: 6, letterSpacing: -0.3, color: danger ? "var(--red)" : "var(--txt)" }}>{value}</div>
    </div>
  );
}
