"use client";
import { useState } from "react";
import { createCreditNote } from "@/actions/creditNotes";
import { money, todayISO } from "@/lib/gst";
import type { Invoice, InvoiceItem } from "@/lib/types";

export default function CreditNoteModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const [items, setItems] = useState(
    invoice.items.map((it) => ({ ...it, returnQty: 0, maxQty: it.qty }))
  );
  const [date, setDate] = useState(todayISO());
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const total = items.reduce((s, it) => s + it.returnQty * it.price * (1 + (invoice.no_tax ? 0 : it.gst) / 100), 0);

  function setReturnQty(productId: string, qty: number) {
    setItems((prev) =>
      prev.map((it) =>
        it.productId === productId ? { ...it, returnQty: Math.max(0, Math.min(qty, it.maxQty)) } : it
      )
    );
  }

  async function submit(fd: FormData) {
    setErr("");
    const toReturn = items.filter((it) => it.returnQty > 0).map((it) => ({
      productId: it.productId,
      name: it.name,
      price: it.price,
      gst: it.gst,
      qty: it.returnQty,
    }));
    if (!toReturn.length) { setErr("Select at least one item to return"); return; }
    setBusy(true);
    try {
      fd.append("items", JSON.stringify(toReturn));
      await createCreditNote(fd);
      onClose();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div onClick={onClose} className="modal-bg">
      <div onClick={(e) => e.stopPropagation()} className="card modal-box">
        <h3 style={{ fontWeight: 800, marginBottom: 6, fontSize: 17 }}>Record Sales Return</h3>
        <p style={{ fontSize: 13.5, color: "var(--mut)", marginBottom: 16 }}>
          <b style={{ color: "var(--txt)" }}>{invoice.no}</b> — {invoice.customer_name}
        </p>
        <form action={submit}>
          <input type="hidden" name="invoice_id" value={invoice.id} />
          <div style={{ marginBottom: 14 }}>
            <label className="fld">Date</label>
            <input className="inp" name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div style={{ maxHeight: 260, overflow: "auto", border: "1px solid var(--line)", borderRadius: 12, marginBottom: 14 }}>
            {items.map((it) => {
              const lineTotal = it.returnQty * it.price * (1 + (invoice.no_tax ? 0 : it.gst) / 100);
              return (
                <div key={it.productId} style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{it.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--mut)" }}>{money(it.price)} · Billed {it.qty} · GST {it.gst}%</div>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={it.maxQty}
                    value={it.returnQty}
                    onChange={(e) => setReturnQty(it.productId, parseFloat(e.target.value) || 0)}
                    className="inp"
                    style={{ width: 64, textAlign: "center", padding: "6px 8px" }}
                  />
                  <div style={{ width: 80, textAlign: "right", fontWeight: 700, fontSize: 13 }}>{money(lineTotal)}</div>
                </div>
              );
            })}
          </div>

          <div className="row-2" style={{ marginBottom: 14 }}>
            <div>
              <label className="fld">Reason</label>
              <select className="inp" name="reason" value={reason} onChange={(e) => setReason(e.target.value)}>
                <option value="">—</option>
                <option value="Defective">Defective</option>
                <option value="Wrong item">Wrong item</option>
                <option value="Customer changed mind">Customer changed mind</option>
                <option value="Expired">Expired</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="fld">Note</label>
              <input className="inp" name="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional…" />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: 12, marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: "var(--mut)", fontWeight: 600 }}>Refund amount</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: "var(--brand)" }}>{money(total)}</span>
          </div>

          {err && <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 10, fontWeight: 600 }}>{err}</p>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-red" disabled={busy}>{busy ? "Saving…" : "Confirm Return"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
