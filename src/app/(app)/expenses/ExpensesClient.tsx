"use client";
import { useState } from "react";
import { saveExpense, deleteExpense } from "@/actions/expenses";
import { money, fmtDate } from "@/lib/gst";
import { useHotkey, kbdHint } from "@/lib/hotkey";
import type { Expense } from "@/lib/types";

const CATS = ["Rent", "Salary", "Utilities", "Transport", "Supplies", "Marketing", "Other"];
const empty = { id: "", date: new Date().toISOString().slice(0, 10), category: "Other", amount: "", description: "" };

export default function ExpensesClient({ expenses, from, to, category }: { expenses: Expense[]; from: string; to: string; category: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [q, setQ] = useState("");

  function add() { setForm({ ...empty }); setOpen(true); }
  function edit(e: Expense) {
    setForm({ id: e.id, date: e.date, category: e.category, amount: String(e.amount), description: e.description });
    setOpen(true);
  }
  useHotkey("a", add, !open);

  const filtered = expenses.filter((e) =>
    e.description.toLowerCase().includes(q.toLowerCase()) || e.category.toLowerCase().includes(q.toLowerCase())
  );

  const byCat: Record<string, number> = {};
  expenses.forEach((e) => { byCat[e.category] = (byCat[e.category] || 0) + (e.amount || 0); });

  return (
    <div>
      <div className="card" style={{ padding: "18px 22px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <input className="inp" placeholder="Search expenses…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 320 }} />
          <button className="btn btn-primary" onClick={add}>+ Add Expense <kbd style={kbdHint}>A</kbd></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginBottom: 18 }}>
          {Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
            <div key={cat} className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 11.5, color: "var(--mut)", textTransform: "uppercase", fontWeight: 700, letterSpacing: ".5px" }}>{cat}</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 6, color: "var(--red)" }}>{money(amt)}</div>
            </div>
          ))}
        </div>

        <table className="tbl">
          <thead><tr><th>Date</th><th>Category</th><th>Description</th><th className="r">Amount</th><th></th></tr></thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id}>
                <td style={{ color: "var(--mut)" }}>{fmtDate(e.date)}</td>
                <td><span className="pill pill-info">{e.category}</span></td>
                <td style={{ fontWeight: 600, color: "var(--txt)" }}>{e.description || "—"}</td>
                <td className="r" style={{ fontWeight: 700, color: "var(--red)" }}>{money(e.amount)}</td>
                <td className="r">
                  <button className="btn btn-sm" onClick={() => edit(e)}>Edit</button>{" "}
                  <form action={deleteExpense} style={{ display: "inline" }}>
                    <input type="hidden" name="id" value={e.id} />
                    <button className="btn btn-sm btn-red" type="submit">Del</button>
                  </form>
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={5} style={{ color: "var(--mut)", padding: "20px 12px" }}>No expenses found.</td></tr>}
          </tbody>
        </table>
      </div>

      {open && (
        <div onClick={() => setOpen(false)} className="modal-bg">
          <div onClick={(e) => e.stopPropagation()} className="card modal-box">
            <h3 style={{ fontWeight: 800, marginBottom: 18, fontSize: 17 }}>{form.id ? "Edit" : "Add"} Expense</h3>
            <form action={async (fd) => { await saveExpense(fd); setOpen(false); }}>
              <input type="hidden" name="id" value={form.id} />
              <div className="row-2" style={{ marginBottom: 14 }}>
                <div><label className="fld">Date</label><input className="inp" name="date" type="date" defaultValue={form.date} required /></div>
                <div>
                  <label className="fld">Category</label>
                  <select className="inp" name="category" defaultValue={form.category}>
                    {CATS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="row-2" style={{ marginBottom: 14 }}>
                <div><label className="fld">Amount</label><input className="inp" name="amount" type="number" step="any" defaultValue={form.amount} required placeholder="0.00" /></div>
                <div><label className="fld">Description</label><input className="inp" name="description" defaultValue={form.description} placeholder="Optional…" /></div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
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
