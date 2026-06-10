"use client";
import { useState } from "react";
import { saveProduct, deleteProduct } from "@/actions/products";
import { saveStockAdjustment } from "@/actions/stockAdjustments";
import { money } from "@/lib/gst";
import { useHotkey, kbdHint } from "@/lib/hotkey";
import type { Product } from "@/lib/types";

const empty = { id: "", name: "", hsn: "", unit: "pcs", price: "", gst: "18", stock: "0", low: "5", cost: "" };

export default function ProductsClient({ products }: { products: Product[] }) {
  const [open, setOpen] = useState(false);
  const [adjOpen, setAdjOpen] = useState(false);
  const [adjProduct, setAdjProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<Record<string, string>>(empty);
  const [q, setQ] = useState("");

  function edit(p: Product) {
    setForm({ id: p.id, name: p.name, hsn: p.hsn, unit: p.unit, price: String(p.price), gst: String(p.gst), stock: String(p.stock), low: String(p.low), cost: String(p.cost) });
    setOpen(true);
  }
  function add() { setForm(empty); setOpen(true); }
  function adjust(p: Product) { setAdjProduct(p); setAdjOpen(true); }
  useHotkey("a", add, !open && !adjOpen);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.hsn.includes(q));

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, letterSpacing: -0.3 }}>Products &amp; Stock</h2>
          <p style={{ color: "var(--mut)", fontSize: 13.5 }}>{products.length} products</p>
        </div>
        <button className="btn btn-primary" onClick={add}>+ Add Product <kbd style={kbdHint}>A</kbd></button>
      </div>

      <div className="card" style={{ padding: "18px 22px" }}>
        <input className="inp" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 16, maxWidth: 340 }} />
        <table className="tbl">
          <thead><tr><th>Name</th><th>HSN</th><th>Unit</th><th className="r">Price</th><th className="r">GST%</th><th className="r">Stock</th><th></th></tr></thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 700, color: "var(--txt)" }}>{p.name}</td>
                <td style={{ color: "var(--mut)" }}>{p.hsn}</td>
                <td style={{ color: "var(--mut)" }}>{p.unit}</td>
                <td className="r" style={{ fontWeight: 600 }}>{money(p.price)}</td>
                <td className="r" style={{ color: "var(--mut)" }}>{p.gst}%</td>
                <td className="r" style={{ color: p.stock <= p.low ? "var(--red)" : "var(--green)", fontWeight: 700 }}>{p.stock}</td>
                <td className="r">
                  <button className="btn btn-sm" onClick={() => edit(p)}>Edit</button>{" "}
                  <button className="btn btn-sm btn-ghost" onClick={() => adjust(p)}>Adjust</button>{" "}
                  <form action={deleteProduct} style={{ display: "inline" }}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="btn btn-sm btn-red" type="submit">Del</button>
                  </form>
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={7} style={{ color: "var(--mut)", padding: "20px 12px" }}>No products.</td></tr>}
          </tbody>
        </table>
      </div>

      {open && (
        <div onClick={() => setOpen(false)} className="modal-bg">
          <div onClick={(e) => e.stopPropagation()} className="card modal-box">
            <h3 style={{ fontWeight: 800, marginBottom: 18, fontSize: 17 }}>{form.id ? "Edit" : "Add"} Product</h3>
            <form action={async (fd) => { await saveProduct(fd); setOpen(false); }}>
              <input type="hidden" name="id" value={form.id} />
              <Field label="Name" name="name" value={form.name} req autoFocus />
              <div className="row-2">
                <Field label="HSN code" name="hsn" value={form.hsn} />
                <Field label="Unit" name="unit" value={form.unit} />
              </div>
              <div className="row-2">
                <Field label="Sale price" name="price" value={form.price} type="number" req />
                <Field label="GST %" name="gst" value={form.gst} type="number" />
              </div>
              <div className="row-3">
                <Field label="Stock" name="stock" value={form.stock} type="number" />
                <Field label="Low at" name="low" value={form.low} type="number" />
                <Field label="Cost" name="cost" value={form.cost} type="number" />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
                <button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {adjOpen && adjProduct && (
        <div onClick={() => setAdjOpen(false)} className="modal-bg">
          <div onClick={(e) => e.stopPropagation()} className="card modal-box">
            <h3 style={{ fontWeight: 800, marginBottom: 6, fontSize: 17 }}>Adjust Stock</h3>
            <p style={{ fontSize: 13.5, color: "var(--mut)", marginBottom: 16 }}>
              <b style={{ color: "var(--txt)" }}>{adjProduct.name}</b> — Current stock: <b>{adjProduct.stock}</b>
            </p>
            <form action={async (fd) => { await saveStockAdjustment(fd); setAdjOpen(false); }}>
              <input type="hidden" name="product_id" value={adjProduct.id} />
              <div className="row-2" style={{ marginBottom: 14 }}>
                <div>
                  <label className="fld">Qty Change (+ / −)</label>
                  <input className="inp" name="qty_change" type="number" step="any" autoFocus placeholder="+10 or −5" required />
                </div>
                <div>
                  <label className="fld">Reason</label>
                  <select className="inp" name="reason" defaultValue="other">
                    <option value="damage">Damage</option>
                    <option value="theft">Theft</option>
                    <option value="counting">Stock Counting</option>
                    <option value="expiry">Expiry</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="fld">Note</label>
                <input className="inp" name="note" placeholder="Optional details…" />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn" onClick={() => setAdjOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, name, value, type = "text", req = false, autoFocus = false }: { label: string; name: string; value: string; type?: string; req?: boolean; autoFocus?: boolean }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="fld">{label}</label>
      <input className="inp" name={name} type={type} defaultValue={value} required={req} step="any" autoFocus={autoFocus} />
    </div>
  );
}
