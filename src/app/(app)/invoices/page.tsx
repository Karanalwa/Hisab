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
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, letterSpacing: -0.3 }}>Invoices</h2>
          <p style={{ color: "var(--mut)", fontSize: 13.5 }}>{invoices.length} invoices total</p>
        </div>
        <Link href="/billing" className="btn btn-primary" style={{ textDecoration: "none" }}>
          + New Invoice
          <kbd style={{ fontSize: 10, fontWeight: 800, background: "rgba(255,255,255,.25)", borderRadius: 5, padding: "1px 6px" }}>N</kbd>
        </Link>
      </div>

      <div className="card" style={{ padding: "18px 22px" }}>
        <table className="tbl">
          <thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th className="r">Total</th><th className="r">Due</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {invoices.map((i) => {
              const st = invoiceStatus(i);
              return (
                <tr key={i.id}>
                  <td style={{ fontWeight: 700, color: "var(--txt)" }}>{i.no}</td>
                  <td style={{ color: "var(--mut)" }}>{fmtDate(i.date)}</td>
                  <td style={{ color: "var(--mut)" }}>{i.customer_name}</td>
                  <td className="r" style={{ fontWeight: 700 }}>{money(i.total)}</td>
                  <td className="r" style={{ color: (i.total || 0) - (i.paid || 0) > 0.01 ? "var(--red)" : "var(--mut)", fontWeight: 700 }}>{money(Math.max(0, (i.total || 0) - (i.paid || 0)))}</td>
                  <td><span className={pill(st)}>{st}</span></td>
                  <td className="r" style={{ whiteSpace: "nowrap" }}>
                    <Link href={`/invoices/${i.id}/print`} className="btn btn-sm" style={{ textDecoration: "none" }}>View</Link>{" "}
                    <Link href={`/invoices/${i.id}/edit`} className="btn btn-sm" style={{ textDecoration: "none" }}>Edit</Link>{" "}
                    <form action={deleteInvoice} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={i.id} />
                      <button className="btn btn-sm btn-red" type="submit">Del</button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {!invoices.length && <tr><td colSpan={7} style={{ color: "var(--mut)", padding: "20px 12px" }}>No invoices yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
