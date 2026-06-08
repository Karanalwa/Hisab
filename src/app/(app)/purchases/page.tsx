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
    <div>
      <h2 style={{ fontSize: 23, fontWeight: 800, marginBottom: 4 }}>Stock In</h2>
      <p style={{ color: "var(--mut)", fontSize: 13, marginBottom: 18 }}>Record purchases — stock is added automatically</p>

      <div className="card" style={{ padding: "20px 22px", marginBottom: 18 }}>
        <StockInForm products={(prod || []) as Product[]} />
      </div>

      <div className="card" style={{ padding: "16px 20px" }}>
        <h3 style={{ fontWeight: 800, marginBottom: 12 }}>Purchase History</h3>
        <table className="tbl">
          <thead><tr><th>Date</th><th>Product</th><th className="r">Qty</th><th className="r">Cost</th><th>Supplier</th><th>Note</th></tr></thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id}>
                <td>{fmtDate(p.date)}</td>
                <td style={{ fontWeight: 700 }}>{p.product_name}</td>
                <td className="r">{p.qty}</td>
                <td className="r">{money(p.cost)}</td>
                <td>{p.supplier}</td>
                <td>{p.note}</td>
              </tr>
            ))}
            {!purchases.length && <tr><td colSpan={6} style={{ color: "var(--mut)" }}>No purchases yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
