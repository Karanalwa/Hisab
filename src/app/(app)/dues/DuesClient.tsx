"use client";
import { useState } from "react";
import { addPayment } from "@/actions/invoices";
import { money, fmtDate, invoiceDue, todayISO } from "@/lib/gst";
import type { Invoice } from "@/lib/types";

export default function DuesClient({ invoices }: { invoices: Invoice[] }) {
  const [active, setActive] = useState<Invoice | null>(null);
  const totalDue = invoices.reduce((s, i) => s + invoiceDue(i), 0);

  return (
    <div>
      <h2 style={{ fontSize: 23, fontWeight: 800, marginBottom: 4 }}>Dues &amp; Payments</h2>
      <p style={{ color: "var(--mut)", fontSize: 13, marginBottom: 18 }}>
        {invoices.length} unpaid invoices · <b style={{ color: "var(--red)" }}>{money(totalDue)}</b> outstanding
      </p>

      <div className="card" style={{ padding: "16px 20px" }}>
        <table className="tbl">
          <thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th className="r">Total</th><th className="r">Paid</th><th className="r">Due</th><th></th></tr></thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id}>
                <td style={{ fontWeight: 700 }}>{i.no}</td>
                <td>{fmtDate(i.date)}</td>
                <td>{i.customer_name}</td>
                <td className="r">{money(i.total)}</td>
                <td className="r">{money(i.paid)}</td>
                <td className="r" style={{ color: "var(--red)", fontWeight: 700 }}>{money(invoiceDue(i))}</td>
                <td className="r"><button className="btn btn-sm btn-green" onClick={() => setActive(i)}>Record Payment</button></td>
              </tr>
            ))}
            {!invoices.length && <tr><td colSpan={7} style={{ color: "var(--mut)" }}>No outstanding dues 🎉</td></tr>}
          </tbody>
        </table>
      </div>

      {active && (
        <div onClick={() => setActive(null)} style={modalBg}>
          <div onClick={(e) => e.stopPropagation()} className="card modal-box" style={modalBox}>
            <h3 style={{ fontWeight: 800, marginBottom: 6 }}>Record Payment</h3>
            <p style={{ fontSize: 13, color: "var(--mut)", marginBottom: 14 }}>
              <b>{active.no}</b> — {active.customer_name}<br />
              Total {money(active.total)} · Paid {money(active.paid)} · <b>Due {money(invoiceDue(active))}</b>
            </p>
            <form action={async (fd) => { await addPayment(fd); setActive(null); }}>
              <input type="hidden" name="invoice_id" value={active.id} />
              <div className="row-2">
                <div><label className="fld">Amount</label><input className="inp" name="amount" type="number" step="any" defaultValue={invoiceDue(active).toFixed(2)} required /></div>
                <div><label className="fld">Mode</label>
                  <select className="inp" name="mode" defaultValue="Cash"><option>Cash</option><option>UPI</option><option>Card</option><option>Cheque</option></select>
                </div>
              </div>
              <div style={{ marginTop: 12 }}><label className="fld">Date</label><input className="inp" name="date" type="date" defaultValue={todayISO()} /></div>
              {active.payments?.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <label className="fld">Payment history</label>
                  <table className="tbl" style={{ fontSize: 12 }}>
                    <tbody>{active.payments.map((p, k) => <tr key={k}><td>{fmtDate(p.date)}</td><td>{p.mode}</td><td className="r">{money(p.amount)}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
                <button type="button" className="btn" onClick={() => setActive(null)}>Cancel</button>
                <button type="submit" className="btn btn-green">Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const modalBg: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(28,26,58,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 };
const modalBox: React.CSSProperties = { width: 440, padding: 26, maxHeight: "90vh", overflow: "auto" };
