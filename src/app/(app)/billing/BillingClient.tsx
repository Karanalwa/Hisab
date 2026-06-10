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
  const [hi, setHi] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const cust = customers.find((c) => c.id === custId);
  const inter = cust ? isInterState(cust.state, shopState) : false;
  const bill = useMemo(() => computeBill(cart, inter, noTax), [cart, inter, noTax]);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.hsn.includes(q));

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
    <div className="animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, letterSpacing: -0.3 }}>{edit ? `Edit Invoice ${edit.no}` : "Billing"}</h2>
        <p style={{ color: "var(--mut)", fontSize: 13.5 }}>{edit ? "Update invoice details and items" : "Search products and build your cart"}</p>
      </div>

      <div className="grid-2 bill">
        {/* product picker */}
        <div className="card" style={{ padding: "18px 22px" }}>
          <input
            ref={searchRef}
            className="inp"
            autoFocus
            placeholder="Search products — ↑↓ to move, Enter to add"
            value={q}
            onChange={(e) => { setQ(e.target.value); setHi(0); }}
            onKeyDown={onSearchKey}
            style={{ marginBottom: 14 }}
          />
          <div ref={listRef} role="listbox" style={{ maxHeight: 480, overflow: "auto", border: "1px solid var(--line)", borderRadius: 12, background: "#fff" }}>
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
                    padding: "11px 14px", border: "none", borderBottom: "1px solid #f1f5f9", cursor: out ? "not-allowed" : "pointer",
                    textAlign: "left", opacity: out ? 0.4 : 1,
                    background: active ? "var(--brand-soft)" : "transparent",
                    transition: "background .1s",
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: 13.5, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: out ? "var(--mut)" : "var(--txt)" }}>{p.name}</span>
                    <span style={{ fontSize: 11.5, color: p.stock <= p.low ? "var(--red)" : "var(--mut)", fontWeight: 500 }}>HSN {p.hsn || "—"} · Stock {p.stock}</span>
                  </span>
                  <span style={{ color: "var(--brand)", fontWeight: 800, fontSize: 14, whiteSpace: "nowrap" }}>{money(p.price)}</span>
                </button>
              );
            })}
            {!filtered.length && <div style={{ padding: 20, color: "var(--mut)", fontSize: 13 }}>No products match.</div>}
          </div>
        </div>

        {/* cart + bill */}
        <div className="card" style={{ padding: "18px 22px", display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: 14 }}>
            <label className="fld">Customer</label>
            <select className="inp" value={custId} onChange={(e) => setCustId(e.target.value)}>
              <option value="">Walk-in customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? " · " + c.phone : ""}</option>)}
            </select>
          </div>
          {!custId && (
            <div className="row-2" style={{ marginBottom: 14 }}>
              <input className="inp" placeholder="Walk-in name (optional)" value={walkName} onChange={(e) => setWalkName(e.target.value)} />
              <input className="inp" placeholder="Phone (optional)" value={walkPhone} onChange={(e) => setWalkPhone(e.target.value)} />
            </div>
          )}

          <div style={{ flex: 1, overflow: "auto", maxHeight: 260, marginBottom: 14 }}>
            <table className="tbl">
              <thead><tr><th>Item</th><th className="r">Qty</th><th className="r">Disc%</th><th className="r">Amt</th></tr></thead>
              <tbody>
                {cart.map((l) => {
                  const gross = l.qty * l.price;
                  const tax = gross * (1 - (l.disc || 0) / 100);
                  const amt = tax * (1 + (noTax ? 0 : l.gst) / 100);
                  return (
                    <tr key={l.productId}>
                      <td style={{ fontWeight: 600, fontSize: 12.5 }}>{l.name}</td>
                      <td className="r"><input type="number" value={l.qty} onChange={(e) => setQty(l.productId, parseFloat(e.target.value) || 0)} style={{ width: 56, fontSize: 12.5, padding: "6px 8px" }} className="inp" /></td>
                      <td className="r"><input type="number" value={l.disc || 0} onChange={(e) => setDisc(l.productId, parseFloat(e.target.value) || 0)} style={{ width: 56, fontSize: 12.5, padding: "6px 8px" }} className="inp" /></td>
                      <td className="r" style={{ fontWeight: 700 }}>{money(amt)}</td>
                    </tr>
                  );
                })}
                {!cart.length && <tr><td colSpan={4} style={{ color: "var(--mut)", padding: "16px 12px" }}>Tap a product to add it.</td></tr>}
              </tbody>
            </table>
          </div>

          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12, fontSize: 13 }}>
            <Row label="Taxable" value={money(bill.taxable)} />
            {!noTax && inter && <Row label="IGST" value={money(bill.igst)} />}
            {!noTax && !inter && <><Row label="CGST" value={money(bill.cgst)} /><Row label="SGST" value={money(bill.sgst)} /></>}
            <Row label="Round off" value={money(bill.round)} />
            <Row label="Total" value={money(bill.total)} big />
          </div>

          <div style={{ display: "flex", gap: 10, margin: "14px 0", alignItems: "center", flexWrap: "wrap" }}>
            <select className="inp" value={payMode} onChange={(e) => setPayMode(e.target.value)} style={{ width: 140 }}>
              <option>Cash</option><option>UPI</option><option>Card</option><option>Credit</option>
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", userSelect: "none" }}>
              <input type="checkbox" checked={noTax} onChange={(e) => setNoTax(e.target.checked)} style={{ width: 16, height: 16, accentColor: "var(--brand)" }} /> No-tax bill
            </label>
          </div>

          {err && <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 10, fontWeight: 600 }}>{err}</p>}
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
    <div style={{ display: "flex", justifyContent: "space-between", padding: big ? "10px 0 0" : "4px 0", fontWeight: big ? 800 : 500, fontSize: big ? 17 : 13, color: big ? "var(--txt)" : "var(--mut)" }}>
      <span>{label}</span><span style={{ color: big ? "var(--brand)" : undefined, fontWeight: big ? 800 : 600 }}>{value}</span>
    </div>
  );
}
