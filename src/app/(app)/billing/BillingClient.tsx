"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { computeBill, isInterState, money } from "@/lib/gst";
import { createInvoice, updateInvoice } from "@/actions/invoices";
import type { Product, Customer, InvoiceItem } from "@/lib/types";

export type EditInit = {
  id: string;
  no: string;
  customerId: string;
  walkInName: string;
  walkInPhone: string;
  items: InvoiceItem[];
  payMode: string;
  noTax: boolean;
};

export default function BillingClient({ products, customers, shopState, edit }: { products: Product[]; customers: Customer[]; shopState: string; edit?: EditInit }) {
  const router = useRouter();
  const [cart, setCart] = useState<InvoiceItem[]>(edit?.items ?? []);
  const [custId, setCustId] = useState(edit?.customerId ?? "");
  const [walkName, setWalkName] = useState(edit?.walkInName ?? "");
  const [walkPhone, setWalkPhone] = useState(edit?.walkInPhone ?? "");
  const [payMode, setPayMode] = useState(edit?.payMode ?? "Cash");
  const [noTax, setNoTax] = useState(edit?.noTax ?? false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0); // highlighted row in the product list
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const cust = customers.find((c) => c.id === custId);
  const inter = cust ? isInterState(cust.state, shopState) : false;
  const bill = useMemo(() => computeBill(cart, inter, noTax), [cart, inter, noTax]);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.hsn.includes(q));

  // keep highlight in range and scrolled into view
  useEffect(() => { if (hi >= filtered.length) setHi(0); }, [filtered.length, hi]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${hi}"]`)?.scrollIntoView({ block: "nearest" });
  }, [hi]);

  function addToCart(p: Product) {
    if (p.stock <= 0) return;
    setCart((c) => {
      const ex = c.find((l) => l.productId === p.id);
      if (ex) return c.map((l) => (l.productId === p.id ? { ...l, qty: l.qty + 1 } : l));
      return [...c, { productId: p.id, name: p.name, hsn: p.hsn, price: p.price, gst: p.gst, qty: 1, disc: 0 }];
    });
  }
  function addAndReset(p: Product) {
    addToCart(p);
    setQ("");
    setHi(0);
    searchRef.current?.focus();
  }
  function onSearchKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); save(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (filtered[hi]) addAndReset(filtered[hi]); }
  }
  function setQty(id: string, qty: number) {
    setCart((c) => c.map((l) => (l.productId === id ? { ...l, qty: Math.max(0, qty) } : l)).filter((l) => l.qty > 0));
  }
  function setDisc(id: string, disc: number) {
    setCart((c) => c.map((l) => (l.productId === id ? { ...l, disc } : l)));
  }

  async function save() {
    setErr("");
    if (!cart.length) { setErr("Cart is empty"); return; }
    setBusy(true);
    try {
      const args = { customerId: custId || null, walkInName: walkName, walkInPhone: walkPhone, items: cart, payMode, noTax };
      const inv = edit
        ? await updateInvoice({ id: edit.id, ...args })
        : await createInvoice(args);
      router.push(`/invoices/${(inv as { id: string }).id}/print`);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: 23, fontWeight: 800, marginBottom: 16 }}>{edit ? `Edit Invoice ${edit.no}` : "Billing"}</h2>
      <div className="grid-2 bill">
        {/* product picker — keyboard-driven list */}
        <div className="card" style={{ padding: "16px 20px" }}>
          <input
            ref={searchRef}
            className="inp"
            autoFocus
            placeholder="Search products — ↑↓ to move, Enter to add"
            value={q}
            onChange={(e) => { setQ(e.target.value); setHi(0); }}
            onKeyDown={onSearchKey}
            style={{ marginBottom: 12 }}
          />
          <div ref={listRef} role="listbox" style={{ maxHeight: 460, overflow: "auto", border: "1px solid var(--line)", borderRadius: 12 }}>
            {filtered.map((p, idx) => {
              const out = p.stock <= 0;
              const active = idx === hi;
              return (
                <button
                  key={p.id}
                  data-idx={idx}
                  role="option"
                  aria-selected={active}
                  onClick={() => addAndReset(p)}
                  onMouseEnter={() => setHi(idx)}
                  disabled={out}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                    padding: "10px 12px", border: "none", borderBottom: "1px solid #f1f2fb", cursor: out ? "not-allowed" : "pointer",
                    textAlign: "left", opacity: out ? 0.45 : 1,
                    background: active ? "linear-gradient(135deg,rgba(99,102,241,.14),rgba(139,92,246,.10))" : "transparent",
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: 13.5, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
                    <span style={{ fontSize: 11, color: p.stock <= p.low ? "var(--red)" : "var(--mut)" }}>HSN {p.hsn || "—"} · Stock {p.stock}</span>
                  </span>
                  <span style={{ color: "var(--indigo)", fontWeight: 800, fontSize: 14, whiteSpace: "nowrap" }}>{money(p.price)}</span>
                </button>
              );
            })}
            {!filtered.length && <div style={{ padding: 16, color: "var(--mut)", fontSize: 13 }}>No products match.</div>}
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
            <div className="row-2" style={{ marginBottom: 12 }}>
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
            <button className="btn" onClick={() => (edit ? router.push(`/invoices/${edit.id}/print`) : setCart([]))} disabled={busy}>
              {edit ? "Cancel" : "Clear"}
            </button>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={save} disabled={busy}>
              {busy ? "Saving…" : `${edit ? "Update" : "Save"} & View · ${money(bill.total)}`}
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
