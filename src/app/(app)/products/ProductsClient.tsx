"use client";
import { useState } from "react";
import { saveProduct, deleteProduct } from "@/actions/products";
import { money } from "@/lib/gst";
import type { Product } from "@/lib/types";

const empty = { id: "", name: "", hsn: "", unit: "pcs", price: "", gst: "18", stock: "0", low: "5", cost: "" };

export default function ProductsClient({ products }: { products: Product[] }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(empty);
  const [q, setQ] = useState("");

  function edit(p: Product) {
    setForm({ id: p.id, name: p.name, hsn: p.hsn, unit: p.unit, price: String(p.price), gst: String(p.gst), stock: String(p.stock), low: String(p.low), cost: String(p.cost) });
    setOpen(true);
  }
  function add() { setForm(empty); setOpen(true); }

  const filtered = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.hsn.includes(q));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h2 style={{ fontSize: 23, fontWeight: 800 }}>Products &amp; Stock</h2>
          <p style={{ color: "var(--mut)", fontSize: 13 }}>{products.length} products</p>
        </div>
        <button className="btn btn-primary" onClick={add}>+ Add Product</button>
      </div>

      <div className="card" style={{ padding: "16px 20px" }}>
        <input className="inp" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 14, maxWidth: 320 }} />
        <table className="tbl">
          <thead><tr><th>Name</th><th>HSN</th><th>Unit</th><th className="r">Price</th><th className="r">GST%</th><th className="r">Stock</th><th></th></tr></thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 700 }}>{p.name}</td>
                <td>{p.hsn}</td>
                <td>{p.unit}</td>
                <td className="r">{money(p.price)}</td>
                <td className="r">{p.gst}%</td>
                <td className="r" style={{ color: p.stock <= p.low ? "var(--red)" : undefined, fontWeight: 700 }}>{p.stock}</td>
                <td className="r">
                  <button className="btn btn-sm" onClick={() => edit(p)}>Edit</button>{" "}
                  <form action={deleteProduct} style={{ display: "inline" }}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="btn btn-sm btn-red" type="submit">Del</button>
                  </form>
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={7} style={{ color: "var(--mut)" }}>No products.</td></tr>}
          </tbody>
        </table>
      </div>

      {open && (
        <div onClick={() => setOpen(false)} style={modalBg}>
          <div onClick={(e) => e.stopPropagation()} className="card modal-box" style={modalBox}>
            <h3 style={{ fontWeight: 800, marginBottom: 16 }}>{form.id ? "Edit" : "Add"} Product</h3>
            <form action={async (fd) => { await saveProduct(fd); setOpen(false); }}>
              <input type="hidden" name="id" value={form.id} />
              <Field label="Name" name="name" value={form.name} req />
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
              <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
                <button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, name, value, type = "text", req = false }: { label: string; name: string; value: string; type?: string; req?: boolean }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label className="fld">{label}</label>
      <input className="inp" name={name} type={type} defaultValue={value} required={req} step="any" />
    </div>
  );
}

const modalBg: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(28,26,58,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 };
const modalBox: React.CSSProperties = { width: 460, padding: 26, maxHeight: "90vh", overflow: "auto" };
