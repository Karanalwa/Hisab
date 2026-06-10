"use client";
import { useState } from "react";
import { addPayment } from "@/actions/invoices";
import { money, fmtDate, invoiceDue, todayISO } from "@/lib/gst";
import type { Invoice } from "@/lib/types";

export default function DuesClient({ invoices }: { invoices: Invoice[] }) {
  const [active, setActive] = useState<Invoice | null>(null);
  const totalDue = invoices.reduce((s, i) => s + invoiceDue(i), 0);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, letterSpacing: -0.3 }}>Dues &amp; Payments</h2>
        <p style={{ color: "var(--mut)", fontSize: 13.5 }}>
          {invoices.length} unpaid invoices · <b style={{ color: "var(--red)" }}>{money(totalDue)}</b> outstanding
        </p>
      </div>

      <div className="card" style={{ padding: "18px 22px" }}>
        <table className="tbl">
          <thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th className="r">Total</th><th className="r">Paid</th><th className="r">Due</th><th></th></tr></thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id}>
                <td style={{ fontWeight: 700, color: "var(--txt)" }}>{i.no}</td>
                <td style={{ color: "var(--mut)" }}>{fmtDate(i.date)}</td>
                <td style={{ color: "var(--mut)" }}>{i.customer_name}</td>
                <td className="r" style={{ fontWeight: 600 }}>{money(i.total)}</td>
                <td className="r" style={{ color: "var(--mut)" }}>{money(i.paid)}</td>
                <td className="r" style={{ color: "var(--red)", fontWeight: 700 }}>{money(invoiceDue(i))}</td>
                <td className="r"><button className="btn btn-sm btn-green" onClick={() => setActive(i)}>Record Payment</button></td>
              </tr>
            ))}
            {!invoices.length && <tr><td colSpan={7} style={{ color: "var(--mut)", padding: "20px 12px" }}>No outstanding dues 🎉</td></tr>}
          </tbody>
        </table>
      </div>

      {active && (
        <div onClick={() => setActive(null)} className="modal-bg">
          <div onClick={(e) => e.stopPropagation()} className="card modal-box">
            <h3 style={{ fontWeight: 800, marginBottom: 8, fontSize: 17 }}>Record Payment</h3>
            <p style={{ fontSize: 13.5, color: "var(--mut)", marginBottom: 16 }}>
              <b style={{ color: "var(--txt)" }}>{active.no}</b> — {active.customer_name}<br />
              Total {money(active.total)} · Paid {money(active.paid)} · <b style={{ color: "var(--red)" }}>Due {money(invoiceDue(active))}</b>
            </p>
            <form action={async (fd) => { await addPayment(fd); setActive(null); }}>
              <input type="hidden" name="invoice_id" value={active.id} />
              <div className="row-2">
                <div><label className="fld">Amount</label><input className="inp" name="amount" type="number" step="any" defaultValue={invoiceDue(active).toFixed(2)} required /></div>
                <div><label className="fld">Mode</label>
                  <select className="inp" name="mode" defaultValue="Cash"><option>Cash</option><option>UPI</option><option>Card</option><option>Cheque</option></select>
                </div>
              </div>
              <div style={{ marginTop: 14 }}><label className="fld">Date</label><input className="inp" name="date" type="date" defaultValue={todayISO()} /></div>
              {active.payments?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <label className="fld">Payment history</label>
                  <table className="tbl" style={{ fontSize: 12 }}>
                    <tbody>{active.payments.map((p, k) => <tr key={k}><td style={{ color: "var(--mut)" }}>{fmtDate(p.date)}</td><td style={{ color: "var(--mut)" }}>{p.mode}</td><td className="r" style={{ fontWeight: 700 }}>{money(p.amount)}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
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
