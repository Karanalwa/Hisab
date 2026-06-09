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

  // build debit (invoice) / credit (payment) entries
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
    <div>
      <LedgerActions />

      <div className="inv-page">
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, borderBottom: "3px solid #6366f1", paddingBottom: 14, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: ".5px" }}>Statement of Account</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{customer.name}</div>
            <div style={{ fontSize: 12, color: "#555" }}>
              {customer.phone}{customer.state ? " · " + customer.state : ""}{customer.gstin ? " · GSTIN " + customer.gstin : ""}
            </div>
            {customer.address && <div style={{ fontSize: 12, color: "#555" }}>{customer.address}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#888" }}>Outstanding Balance</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: balance > 0.5 ? "var(--red)" : "var(--green)" }}>{money(balance)}</div>
          </div>
        </div>

        <div className="row-3" style={{ marginBottom: 16 }}>
          <Stat label="Total Billed" value={money(totalBilled)} />
          <Stat label="Total Paid" value={money(totalPaid)} />
          <Stat label="Balance Due" value={money(balance)} />
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
                    <td>{fmtDate(e.date)}</td>
                    <td>{e.type}</td>
                    <td>{e.ref}</td>
                    <td className="r">{e.debit ? money(e.debit) : "—"}</td>
                    <td className="r">{e.credit ? money(e.credit) : "—"}</td>
                    <td className="r" style={{ fontWeight: 700 }}>{money(running)}</td>
                  </tr>
                );
              })}
              {!entries.length && <tr><td colSpan={6} style={{ color: "var(--mut)" }}>No transactions yet.</td></tr>}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid #1c1a3a", fontWeight: 800 }}>
                <td colSpan={3}>Total</td>
                <td className="r">{money(totalBilled)}</td>
                <td className="r">{money(totalPaid)}</td>
                <td className="r" style={{ color: balance > 0.5 ? "var(--red)" : "var(--green)" }}>{money(balance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ fontSize: 11, color: "var(--mut)", textTransform: "uppercase", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 800, marginTop: 4 }}>{value}</div>
    </div>
  );
}
