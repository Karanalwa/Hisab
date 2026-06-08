import { createClient } from "@/lib/supabase/server";
import { money, fmtDate, invoiceStatus } from "@/lib/gst";
import { deleteInvoice } from "@/actions/invoices";
import type { Invoice } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

const pill = (s: string) => (s === "Paid" ? "pill pill-paid" : s === "Partial" ? "pill pill-partial" : "pill pill-unpaid");

export default async function InvoicesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("invoices").select("*").order("date", { ascending: false });
  const invoices = (data || []) as Invoice[];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h2 style={{ fontSize: 23, fontWeight: 800 }}>Invoices</h2>
          <p style={{ color: "var(--mut)", fontSize: 13 }}>{invoices.length} invoices</p>
        </div>
        <Link href="/billing" className="btn btn-primary">+ New Invoice</Link>
      </div>

      <div className="card" style={{ padding: "16px 20px" }}>
        <table className="tbl">
          <thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th className="r">Total</th><th className="r">Due</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {invoices.map((i) => {
              const st = invoiceStatus(i);
              return (
                <tr key={i.id}>
                  <td style={{ fontWeight: 700 }}>{i.no}</td>
                  <td>{fmtDate(i.date)}</td>
                  <td>{i.customer_name}</td>
                  <td className="r">{money(i.total)}</td>
                  <td className="r">{money(Math.max(0, (i.total || 0) - (i.paid || 0)))}</td>
                  <td><span className={pill(st)}>{st}</span></td>
                  <td className="r">
                    <Link href={`/invoices/${i.id}/print`} className="btn btn-sm">Print</Link>{" "}
                    <form action={deleteInvoice} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={i.id} />
                      <button className="btn btn-sm btn-red" type="submit">Del</button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {!invoices.length && <tr><td colSpan={7} style={{ color: "var(--mut)" }}>No invoices yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
