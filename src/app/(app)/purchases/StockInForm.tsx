"use client";
import { saveStockIn } from "@/actions/purchases";
import { todayISO } from "@/lib/gst";
import { useHotkey, kbdHint } from "@/lib/hotkey";
import type { Product } from "@/lib/types";
import { useRef } from "react";

export default function StockInForm({ products }: { products: Product[] }) {
  const ref = useRef<HTMLFormElement>(null);
  useHotkey("a", () => ref.current?.querySelector<HTMLSelectElement>("select")?.focus());
  return (
    <form ref={ref} action={async (fd) => { await saveStockIn(fd); ref.current?.reset(); }}>
      <div className="row-3">
        <div><label className="fld">Product</label>
          <select className="inp" name="product_id" required defaultValue="">
            <option value="" disabled>Select product…</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name} (stock {p.stock})</option>)}
          </select>
        </div>
        <div><label className="fld">Quantity</label><input className="inp" name="qty" type="number" step="any" required /></div>
        <div><label className="fld">Cost / unit</label><input className="inp" name="cost" type="number" step="any" /></div>
      </div>
      <div className="row-3" style={{ marginTop: 14 }}>
        <div><label className="fld">Date</label><input className="inp" name="date" type="date" defaultValue={todayISO()} /></div>
        <div><label className="fld">Supplier</label><input className="inp" name="supplier" /></div>
        <div><label className="fld">Note</label><input className="inp" name="note" /></div>
      </div>
      <button className="btn btn-green" type="submit" style={{ marginTop: 16 }}>Add Stock <kbd style={kbdHint}>A</kbd></button>
    </form>
  );
}
