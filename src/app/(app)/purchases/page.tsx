import { createClient } from "@/lib/supabase/server";
import StockInForm from "./StockInForm";
import { money, fmtDate } from "@/lib/gst";
import type { Product, Purchase } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const supabase = await createClient();
  const [{ data: prod }, { data: pur }] = await Promise.all([
    supabase.from("products").select("*").order("name"),
    supabase.from("purchases").select("*").order("date", { ascending: false }),
  ]);
  const purchases = (pur || []) as Purchase[];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, letterSpacing: -0.3 }}>Stock In</h2>
        <p style={{ color: "var(--mut)", fontSize: 13.5 }}>Record purchases — stock is added automatically</p>
      </div>

      <div className="card" style={{ padding: "22px 24px", marginBottom: 20 }}>
        <StockInForm products={(prod || []) as Product[]} />
      </div>

      <div className="card" style={{ padding: "18px 22px" }}>
        <h3 style={{ fontWeight: 800, marginBottom: 14, fontSize: 15 }}>Purchase History</h3>
        <table className="tbl">
          <thead><tr><th>Date</th><th>Product</th><th className="r">Qty</th><th className="r">Cost</th><th>Supplier</th><th>Note</th></tr></thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id}>
                <td style={{ color: "var(--mut)" }}>{fmtDate(p.date)}</td>
                <td style={{ fontWeight: 700, color: "var(--txt)" }}>{p.product_name}</td>
                <td className="r" style={{ fontWeight: 600 }}>{p.qty}</td>
                <td className="r" style={{ fontWeight: 600 }}>{money(p.cost)}</td>
                <td style={{ color: "var(--mut)" }}>{p.supplier}</td>
                <td style={{ color: "var(--mut)" }}>{p.note}</td>
              </tr>
            ))}
            {!purchases.length && <tr><td colSpan={6} style={{ color: "var(--mut)", padding: "20px 12px" }}>No purchases yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
