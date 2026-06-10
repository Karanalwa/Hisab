import { createClient } from "@/lib/supabase/server";
import { getShop } from "@/lib/shop";
import { invoiceDue, money, fmtDate } from "@/lib/gst";
import type { Invoice, Product, InvoiceItem } from "@/lib/types";
import Link from "next/link";
import DashboardCharts from "./DashboardCharts";

export const dynamic = "force-dynamic";

function last30Dates() {
  const dates: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

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
    { label: "Today's Sales", value: money(todaySales), color: "#10b981", icon: "💵", soft: "#d1fae5" },
    { label: "Today's Invoices", value: String(todays.length), color: "#0ea5e9", icon: "🧾", soft: "#e0f2fe" },
    { label: "All-time Sales", value: money(totalSales), color: "#6366f1", icon: "📈", soft: "#e0e7ff" },
    { label: "Outstanding Dues", value: money(outstanding), color: "#ef4444", icon: "⏳", soft: "#fee2e2" },
    { label: "Low-stock Items", value: String(lowStock.length), color: "#f59e0b", icon: "📦", soft: "#fef3c7" },
  ];

  // ---- chart data ----
  const dates30 = last30Dates();
  const byDate: Record<string, number> = {};
  invoices.forEach((i) => { byDate[i.date] = (byDate[i.date] || 0) + (i.total || 0); });
  const trend = dates30.map((d) => ({ date: d.slice(5), total: byDate[d] || 0 }));

  const prodRevenue: Record<string, number> = {};
  invoices.forEach((inv) => {
    inv.items.forEach((it: InvoiceItem) => {
      const rev = (it.qty || 0) * (it.price || 0) * (1 - (it.disc || 0) / 100);
      prodRevenue[it.name] = (prodRevenue[it.name] || 0) + rev;
    });
  });
  const topProducts = Object.entries(prodRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, revenue]) => ({ name: name.length > 18 ? name.slice(0, 18) + "…" : name, revenue }));

  const byMode: Record<string, number> = {};
  invoices.forEach((i) => { byMode[i.pay_mode] = (byMode[i.pay_mode] || 0) + (i.total || 0); });
  const payModes = Object.entries(byMode).map(([name, value]) => ({ name, value }));

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, letterSpacing: -0.3 }}>Dashboard</h2>
        <p style={{ color: "var(--mut)", fontSize: 13.5 }}>Welcome back to {shop?.name}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 16, marginBottom: 24 }}>
        {stats.map((s) => (
          <div key={s.label} className="card card-hover" style={{ padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, color: s.color, background: s.soft, flexShrink: 0
            }}>{s.icon}</div>
            <div style={{ minWidth: 0, overflow: "hidden" }}>
              <div style={{ fontSize: 11.5, color: "var(--mut)", textTransform: "uppercase", letterSpacing: ".6px", fontWeight: 700 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4, letterSpacing: -0.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <DashboardCharts trend={trend} topProducts={topProducts} payModes={payModes} />

      <div className="grid-2" style={{ marginTop: 24 }}>
        <div className="card" style={{ padding: "22px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--txt)" }}>Recent Invoices</h3>
            <Link href="/invoices" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--brand)", textDecoration: "none" }}>View all →</Link>
          </div>
          <table className="tbl">
            <thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th className="r">Total</th></tr></thead>
            <tbody>
              {invoices.slice(0, 8).map((i) => (
                <tr key={i.id}>
                  <td style={{ fontWeight: 700, color: "var(--txt)" }}>{i.no}</td>
                  <td style={{ color: "var(--mut)" }}>{i.customer_name}</td>
                  <td style={{ color: "var(--mut)" }}>{fmtDate(i.date)}</td>
                  <td className="r" style={{ fontWeight: 700 }}>{money(i.total)}</td>
                </tr>
              ))}
              {!invoices.length && <tr><td colSpan={4} style={{ color: "var(--mut)", padding: "20px 12px" }}>No invoices yet. Create one from Billing.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: "22px 24px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--txt)", marginBottom: 16 }}>Low Stock Alerts</h3>
          <table className="tbl">
            <thead><tr><th>Product</th><th className="r">Stock</th><th className="r">Low at</th></tr></thead>
            <tbody>
              {lowStock.slice(0, 10).map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, color: "var(--txt)" }}>{p.name}</td>
                  <td className="r" style={{ color: "var(--red)", fontWeight: 700 }}>{p.stock}</td>
                  <td className="r" style={{ color: "var(--mut)" }}>{p.low}</td>
                </tr>
              ))}
              {!lowStock.length && <tr><td colSpan={3} style={{ color: "var(--mut)", padding: "20px 12px" }}>All stock levels healthy 🎉</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
