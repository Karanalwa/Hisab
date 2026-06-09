import { createClient } from "@/lib/supabase/server";
import { getShop } from "@/lib/shop";
import { invoiceDue, money, fmtDate } from "@/lib/gst";
import type { Invoice, Product } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const shop = await getShop();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: invData }, { data: prodData }] = await Promise.all([
    supabase.from("invoices").select("*").order("date", { ascending: false }),
    supabase.from("products").select("*"),
  ]);
  const invoices = (invData || []) as Invoice[];
  const products = (prodData || []) as Product[];

  const todays = invoices.filter((i) => i.date === today);
  const todaySales = todays.reduce((s, i) => s + (i.total || 0), 0);
  const totalSales = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const outstanding = invoices.reduce((s, i) => s + Math.max(0, invoiceDue(i)), 0);
  const lowStock = products.filter((p) => p.stock <= p.low);

  const stats = [
    { label: "Today's Sales", value: money(todaySales), grad: "linear-gradient(135deg,#34d399,#10b981)", icon: "💵" },
    { label: "Today's Invoices", value: String(todays.length), grad: "linear-gradient(135deg,#22d3ee,#06b6d4)", icon: "🧾" },
    { label: "All-time Sales", value: money(totalSales), grad: "linear-gradient(135deg,#6366f1,#8b5cf6)", icon: "📈" },
    { label: "Outstanding Dues", value: money(outstanding), grad: "linear-gradient(135deg,#fb7185,#ef4444)", icon: "⏳" },
    { label: "Low-stock Items", value: String(lowStock.length), grad: "linear-gradient(135deg,#fbbf24,#f59e0b)", icon: "📦" },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 23, fontWeight: 800, marginBottom: 4 }}>Dashboard</h2>
      <p style={{ color: "var(--mut)", fontSize: 13, marginBottom: 20 }}>Welcome back to {shop?.name}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(205px,1fr))", gap: 16, marginBottom: 22 }}>
        {stats.map((s) => (
          <div key={s.label} className="card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 15 }}>
            <div style={{ width: 54, height: 54, borderRadius: 15, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 25, color: "#fff", background: s.grad }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 11, color: "var(--mut)", textTransform: "uppercase", letterSpacing: ".5px", fontWeight: 700 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 3 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card" style={{ padding: "20px 22px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
            <span>Recent Invoices</span>
            <Link href="/invoices" style={{ fontSize: 12, color: "var(--indigo)" }}>View all →</Link>
          </h3>
          <table className="tbl">
            <thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th className="r">Total</th></tr></thead>
            <tbody>
              {invoices.slice(0, 8).map((i) => (
                <tr key={i.id}>
                  <td style={{ fontWeight: 700 }}>{i.no}</td>
                  <td>{i.customer_name}</td>
                  <td>{fmtDate(i.date)}</td>
                  <td className="r">{money(i.total)}</td>
                </tr>
              ))}
              {!invoices.length && <tr><td colSpan={4} style={{ color: "var(--mut)" }}>No invoices yet. Create one from Billing.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: "20px 22px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>Low Stock Alerts</h3>
          <table className="tbl">
            <thead><tr><th>Product</th><th className="r">Stock</th><th className="r">Low at</th></tr></thead>
            <tbody>
              {lowStock.slice(0, 10).map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td className="r" style={{ color: "var(--red)", fontWeight: 700 }}>{p.stock}</td>
                  <td className="r">{p.low}</td>
                </tr>
              ))}
              {!lowStock.length && <tr><td colSpan={3} style={{ color: "var(--mut)" }}>All stock levels healthy 🎉</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
