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

type CartLine = InvoiceItem & { lineId: string };

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function toCart(items: InvoiceItem[]): CartLine[] {
  return items.map((it) => ({ ...it, lineId: it.productId || uid() }));
}

export default function BillingClient({ products, customers, shopState, edit, preselectCustomerId }: { products: Product[]; customers: Customer[]; shopState: string; edit?: EditInit; preselectCustomerId?: string }) {
  const router = useRouter();
  const [cart, setCart] = useState<CartLine[]>(toCart(edit?.items ?? []));
  const [custId, setCustId] = useState(edit?.customerId ?? preselectCustomerId ?? "");
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

  // custom item form
  const [showCustom, setShowCustom] = useState(false);
  const [cName, setCName] = useState("");
  const [cPrice, setCPrice] = useState<string>("");
  const [cGst, setCGst] = useState<string>("0");
  const cNameRef = useRef<HTMLInputElement>(null);

  // customer search
  const [custOpen, setCustOpen] = useState(false);
  const [custQ, setCustQ] = useState("");
  const custRef = useRef<HTMLDivElement>(null);

  const cust = customers.find((c) => c.id === custId);
  const inter = cust ? isInterState(cust.state, shopState) : false;
  const bill = useMemo(() => computeBill(cart, inter, noTax), [cart, inter, noTax]);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.hsn.includes(q));
  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(custQ.toLowerCase()) || (c.phone || "").includes(custQ)
  );

  useEffect(() => { if (hi >= filtered.length) setHi(0); }, [filtered.length, hi]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${hi}"]`)?.scrollIntoView({ block: "nearest" });
  }, [hi]);

  // close customer dropdown on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (custRef.current && !custRef.current.contains(e.target as Node)) setCustOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  function addProduct(p: Product) {
    if (p.stock <= 0) return;
    setCart((c) => {
      const ex = c.find((l) => l.productId === p.id);
      if (ex) return c.map((l) => (l.productId === p.id ? { ...l, qty: l.qty + 1 } : l));
      return [...c, { lineId: p.id, productId: p.id, name: p.name, hsn: p.hsn, price: p.price, gst: p.gst, qty: 1, disc: 0 }];
    });
  }
  function addAndReset(p: Product) {
    addProduct(p);
    setQ("");
    setHi(0);
    searchRef.current?.focus();
  }
  function addCustom(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const price = parseFloat(cPrice || "0");
    const gst = parseFloat(cGst || "0");
    const name = cName.trim();
    if (!name || price <= 0) return;
    setCart((c) => [...c, { lineId: uid(), name, hsn: "", price, gst, qty: 1, disc: 0 }]);
    setCName("");
    setCPrice("");
    setCGst("0");
    setShowCustom(false);
    searchRef.current?.focus();
  }
  function onSearchKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); save(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (filtered[hi]) addAndReset(filtered[hi]); }
  }
  function updateLine(lineId: string, patch: Partial<CartLine>) {
    setCart((c) => c.map((l) => (l.lineId === lineId ? { ...l, ...patch } : l)));
  }
  function setQty(lineId: string, qty: number) {
    setCart((c) => c.map((l) => (l.lineId === lineId ? { ...l, qty: Math.max(0, qty) } : l)).filter((l) => l.qty > 0));
  }
  function removeLine(lineId: string) {
    setCart((c) => c.filter((l) => l.lineId !== lineId));
  }

  async function save() {
    setErr("");
    if (!cart.length) { setErr("Cart is empty"); return; }
    setBusy(true);
    try {
      // strip lineId before sending
      const items: InvoiceItem[] = cart.map(({ lineId: _lineId, ...it }) => it);
      const args = { customerId: custId || null, walkInName: walkName, walkInPhone: walkPhone, items, payMode, noTax };
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
        <p style={{ color: "var(--mut)", fontSize: 13.5 }}>{edit ? "Update invoice details and items" : "Search products or add a custom service item"}</p>
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
          <div ref={listRef} role="listbox" style={{ maxHeight: 360, overflow: "auto", border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)" }}>
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
                    padding: "11px 14px", border: "none", borderBottom: "1px solid var(--line)", cursor: out ? "not-allowed" : "pointer",
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

          <div style={{ marginTop: 14 }}>
            {!showCustom ? (
              <button type="button" className="btn" onClick={() => { setShowCustom(true); setTimeout(() => cNameRef.current?.focus(), 0); }}>+ Add custom / service item</button>
            ) : (
              <form onSubmit={addCustom} className="card" style={{ padding: 14, border: "1px dashed var(--brand)", background: "var(--brand-soft)" }}>
                <div className="row-2" style={{ marginBottom: 10 }}>
                  <input ref={cNameRef} className="inp" placeholder="Item name" value={cName} onChange={(e) => setCName(e.target.value)} required />
                  <input className="inp" type="number" min={0} step="0.01" placeholder="Price" value={cPrice} onChange={(e) => setCPrice(e.target.value)} required />
                  <input className="inp" type="number" min={0} step="0.01" placeholder="GST %" value={cGst} onChange={(e) => setCGst(e.target.value)} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="submit" className="btn btn-primary">Add item</button>
                  <button type="button" className="btn" onClick={() => setShowCustom(false)}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* cart + bill */}
        <div className="card" style={{ padding: "18px 22px", display: "flex", flexDirection: "column" }}>
          {/* searchable customer picker */}
          <div style={{ marginBottom: 14 }} ref={custRef}>
            <label className="fld">Customer</label>
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setCustOpen((o) => !o)}
                className="inp"
                style={{ textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              >
                <span>{cust ? `${cust.name}${cust.phone ? " · " + cust.phone : ""}` : "Walk-in customer"}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--mut)", transition: "transform .15s", transform: custOpen ? "rotate(180deg)" : "none" }}><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {custOpen && (
                <div className="card" style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 20, padding: 8, maxHeight: 300, overflow: "auto" }}>
                  <input
                    className="inp"
                    placeholder="Search customers…"
                    value={custQ}
                    onChange={(e) => setCustQ(e.target.value)}
                    style={{ marginBottom: 6, fontSize: 13 }}
                    autoFocus
                  />
                  <button
                    onClick={() => { setCustId(""); setCustOpen(false); setCustQ(""); }}
                    style={{
                      width: "100%", textAlign: "left", padding: "9px 10px", borderRadius: 8, border: "none", background: !custId ? "var(--brand-soft)" : "transparent",
                      cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: "var(--txt)",
                    }}
                  >
                    Walk-in customer
                  </button>
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setCustId(c.id); setCustOpen(false); setCustQ(""); }}
                      style={{
                        width: "100%", textAlign: "left", padding: "9px 10px", borderRadius: 8, border: "none", background: custId === c.id ? "var(--brand-soft)" : "transparent",
                        cursor: "pointer", fontSize: 13.5, color: "var(--txt)",
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                      {c.phone && <span style={{ color: "var(--mut)", fontSize: 12, marginLeft: 6 }}>{c.phone}</span>}
                    </button>
                  ))}
                  {!filteredCustomers.length && <div style={{ padding: 10, color: "var(--mut)", fontSize: 13 }}>No customers match.</div>}
                </div>
              )}
            </div>
          </div>

          {!custId && (
            <div className="row-2" style={{ marginBottom: 14 }}>
              <input className="inp" placeholder="Walk-in name (optional)" value={walkName} onChange={(e) => setWalkName(e.target.value)} />
              <input className="inp" placeholder="Phone (optional)" value={walkPhone} onChange={(e) => setWalkPhone(e.target.value)} />
            </div>
          )}

          <div style={{ flex: 1, overflow: "auto", maxHeight: 260, marginBottom: 14 }}>
            <table className="tbl">
              <thead><tr><th>Item</th><th className="r">Qty</th><th className="r">Price</th><th className="r">Disc%</th><th className="r">Amt</th></tr></thead>
              <tbody>
                {cart.map((l) => {
                  const gross = l.qty * l.price;
                  const tax = gross * (1 - (l.disc || 0) / 100);
                  const amt = tax * (1 + (noTax ? 0 : l.gst) / 100);
                  const isCustom = !l.productId;
                  return (
                    <tr key={l.lineId}>
                      <td style={{ fontWeight: 600, fontSize: 12.5 }}>
                        {isCustom ? (
                          <input className="inp" value={l.name} onChange={(e) => updateLine(l.lineId, { name: e.target.value })} style={{ minWidth: 120, fontSize: 12.5, padding: "5px 8px" }} />
                        ) : l.name}
                      </td>
                      <td className="r"><input type="number" value={l.qty} onChange={(e) => setQty(l.lineId, parseFloat(e.target.value) || 0)} style={{ width: 56, fontSize: 12.5, padding: "6px 8px" }} className="inp" /></td>
                      <td className="r">
                        <input type="number" value={l.price} onChange={(e) => updateLine(l.lineId, { price: parseFloat(e.target.value) || 0 })} style={{ width: 72, fontSize: 12.5, padding: "6px 8px" }} className="inp" />
                      </td>
                      <td className="r"><input type="number" value={l.disc || 0} onChange={(e) => updateLine(l.lineId, { disc: parseFloat(e.target.value) || 0 })} style={{ width: 56, fontSize: 12.5, padding: "6px 8px" }} className="inp" /></td>
                      <td className="r" style={{ fontWeight: 700 }}>{money(amt)}</td>
                    </tr>
                  );
                })}
                {!cart.length && <tr><td colSpan={5} style={{ color: "var(--mut)", padding: "16px 12px" }}>Tap a product or add a custom item.</td></tr>}
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
