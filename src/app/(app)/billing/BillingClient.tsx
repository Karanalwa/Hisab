"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { computeBill, isInterState, money } from "@/lib/gst";
import { createInvoice } from "@/actions/invoices";
import type { Product, Customer, InvoiceItem } from "@/lib/types";

export default function BillingClient({ products, customers, shopState }: { products: Product[]; customers: Customer[]; shopState: string }) {
  const router = useRouter();
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [custId, setCustId] = useState("");
  const [walkName, setWalkName] = useState("");
  const [walkPhone, setWalkPhone] = useState("");
  const [payMode, setPayMode] = useState("Cash");
  const [noTax, setNoTax] = useState(false);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const cust = customers.find((c) => c.id === custId);
  const inter = cust ? isInterState(cust.state, shopState) : false;
  const bill = useMemo(() => computeBill(cart, inter, noTax), [cart, inter, noTax]);

  function addToCart(p: Product) {
    setCart((c) => {
      const ex = c.find((l) => l.productId === p.id);
      if (ex) return c.map((l) => (l.productId === p.id ? { ...l, qty: l.qty + 1 } : l));
      return [...c, { productId: p.id, name: p.name, hsn: p.hsn, price: p.price, gst: p.gst, qty: 1, disc: 0 }];
    });
  }
  function setQty(id: string, qty: number) {
    setCart((c) => c.map((l) => (l.productId === id ? { ...l, qty: Math.max(0, qty) } : l)).filter((l) => l.qty > 0));
  }
  function setDisc(id: string, disc: number) {
    setCart((c) => c.map((l) => (l.productId === id ? { ...l, disc } : l)));
  }

  const filtered = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.hsn.includes(q));

  async function save() {
    setErr("");
    if (!cart.length) { setErr("Cart is empty"); return; }
    setBusy(true);
    try {
      const inv = await createInvoice({ customerId: custId || null, walkInName: walkName, walkInPhone: walkPhone, items: cart, payMode, noTax });
      router.push(`/invoices/${(inv as { id: string }).id}/print`);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: 23, fontWeight: 800, marginBottom: 16 }}>Billing</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 18 }}>
        {/* product picker */}
        <div className="card" style={{ padding: "16px 20px" }}>
          <input className="inp" placeholder="Search products to add…" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 14 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10, maxHeight: 460, overflow: "auto" }}>
            {filtered.map((p) => (
              <button key={p.id} onClick={() => addToCart(p)} disabled={p.stock <= 0} className="card" style={{ padding: 12, textAlign: "left", cursor: p.stock <= 0 ? "not-allowed" : "pointer", opacity: p.stock <= 0 ? 0.45 : 1, border: "1px solid var(--line)" }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                <div style={{ color: "var(--indigo)", fontWeight: 800, marginTop: 4 }}>{money(p.price)}</div>
                <div style={{ fontSize: 11, color: p.stock <= p.low ? "var(--red)" : "var(--mut)" }}>Stock: {p.stock}</div>
              </button>
            ))}
          </div>
        </div>

        {/* cart + bill */}
        <div className="card" style={{ padding: "16px 20px", display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: 12 }}>
            <label className="fld">Customer</label>
            <select className="inp" value={custId} onChange={(e) => setCustId(e.target.value)}>
              <option value="">Walk-in customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? " · " + c.phone : ""}</option>)}
            </select>
          </div>
          {!custId && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <input className="inp" placeholder="Walk-in name (optional)" value={walkName} onChange={(e) => setWalkName(e.target.value)} />
              <input className="inp" placeholder="Phone (optional)" value={walkPhone} onChange={(e) => setWalkPhone(e.target.value)} />
            </div>
          )}

          <div style={{ flex: 1, overflow: "auto", maxHeight: 240, marginBottom: 12 }}>
            <table className="tbl">
              <thead><tr><th>Item</th><th className="r">Qty</th><th className="r">Disc%</th><th className="r">Amt</th></tr></thead>
              <tbody>
                {cart.map((l) => {
                  const gross = l.qty * l.price;
                  const tax = gross * (1 - (l.disc || 0) / 100);
                  const amt = tax * (1 + (noTax ? 0 : l.gst) / 100);
                  return (
                    <tr key={l.productId}>
                      <td>{l.name}</td>
                      <td className="r"><input type="number" value={l.qty} onChange={(e) => setQty(l.productId, parseFloat(e.target.value) || 0)} style={{ width: 52 }} className="inp" /></td>
                      <td className="r"><input type="number" value={l.disc || 0} onChange={(e) => setDisc(l.productId, parseFloat(e.target.value) || 0)} style={{ width: 52 }} className="inp" /></td>
                      <td className="r">{money(amt)}</td>
                    </tr>
                  );
                })}
                {!cart.length && <tr><td colSpan={4} style={{ color: "var(--mut)" }}>Tap a product to add it.</td></tr>}
              </tbody>
            </table>
          </div>

          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10, fontSize: 13 }}>
            <Row label="Taxable" value={money(bill.taxable)} />
            {!noTax && inter && <Row label="IGST" value={money(bill.igst)} />}
            {!noTax && !inter && <><Row label="CGST" value={money(bill.cgst)} /><Row label="SGST" value={money(bill.sgst)} /></>}
            <Row label="Round off" value={money(bill.round)} />
            <Row label="Total" value={money(bill.total)} big />
          </div>

          <div style={{ display: "flex", gap: 10, margin: "12px 0", alignItems: "center", flexWrap: "wrap" }}>
            <select className="inp" value={payMode} onChange={(e) => setPayMode(e.target.value)} style={{ width: 130 }}>
              <option>Cash</option><option>UPI</option><option>Card</option><option>Credit</option>
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
              <input type="checkbox" checked={noTax} onChange={(e) => setNoTax(e.target.checked)} /> No-tax bill
            </label>
          </div>

          {err && <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 8 }}>{err}</p>}
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn" onClick={() => setCart([])} disabled={busy}>Clear</button>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={save} disabled={busy}>
              {busy ? "Saving…" : `Save & Print · ${money(bill.total)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: big ? "8px 0 0" : "3px 0", fontWeight: big ? 800 : 500, fontSize: big ? 17 : 13, color: big ? "var(--ink)" : "var(--mut)" }}>
      <span>{label}</span><span style={{ color: big ? "var(--indigo)" : undefined }}>{value}</span>
    </div>
  );
}
