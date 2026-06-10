"use client";
import { useState } from "react";
import Link from "next/link";
import { saveCustomer, deleteCustomer } from "@/actions/customers";
import { money } from "@/lib/gst";
import { INDIAN_STATES } from "@/lib/states";
import { useHotkey, kbdHint } from "@/lib/hotkey";
import type { Customer } from "@/lib/types";

const empty = { id: "", name: "", phone: "", gstin: "", state: "", address: "" };

export default function CustomersClient({ customers, outstanding }: { customers: Customer[]; outstanding: Record<string, number> }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(empty);
  const [q, setQ] = useState("");

  function edit(c: Customer) {
    setForm({ id: c.id, name: c.name, phone: c.phone, gstin: c.gstin, state: c.state, address: c.address });
    setOpen(true);
  }
  function add() { setForm(empty); setOpen(true); }
  useHotkey("a", add, !open);

  const filtered = customers.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || (c.phone || "").includes(q));

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, letterSpacing: -0.3 }}>Customers</h2>
          <p style={{ color: "var(--mut)", fontSize: 13.5 }}>{customers.length} customers</p>
        </div>
        <button className="btn btn-primary" onClick={add}>+ Add Customer <kbd style={kbdHint}>A</kbd></button>
      </div>

      <div className="card" style={{ padding: "18px 22px" }}>
        <input className="inp" placeholder="Search customers…" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 16, maxWidth: 340 }} />
        <table className="tbl">
          <thead><tr><th>Name</th><th>Phone</th><th>State</th><th>GSTIN</th><th className="r">Outstanding</th><th></th></tr></thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 700, color: "var(--txt)" }}>{c.name}</td>
                <td style={{ color: "var(--mut)" }}>{c.phone}</td>
                <td style={{ color: "var(--mut)" }}>{c.state}</td>
                <td style={{ color: "var(--mut)", fontSize: 12 }}>{c.gstin}</td>
                <td className="r" style={{ color: (outstanding[c.id] || 0) > 0 ? "var(--red)" : "var(--green)", fontWeight: 700 }}>{money(outstanding[c.id] || 0)}</td>
                <td className="r" style={{ whiteSpace: "nowrap" }}>
                  <Link href={`/customers/${c.id}/ledger`} className="btn btn-sm" style={{ textDecoration: "none" }}>Ledger</Link>{" "}
                  <button className="btn btn-sm" onClick={() => edit(c)}>Edit</button>{" "}
                  <form action={deleteCustomer} style={{ display: "inline" }}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className="btn btn-sm btn-red" type="submit">Del</button>
                  </form>
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={6} style={{ color: "var(--mut)", padding: "20px 12px" }}>No customers.</td></tr>}
          </tbody>
        </table>
      </div>

      {open && (
        <div onClick={() => setOpen(false)} className="modal-bg">
          <div onClick={(e) => e.stopPropagation()} className="card modal-box">
            <h3 style={{ fontWeight: 800, marginBottom: 18, fontSize: 17 }}>{form.id ? "Edit" : "Add"} Customer</h3>
            <form action={async (fd) => { await saveCustomer(fd); setOpen(false); }}>
              <input type="hidden" name="id" value={form.id} />
              <div style={{ marginBottom: 14 }}><label className="fld">Name</label><input className="inp" name="name" defaultValue={form.name} required autoFocus /></div>
              <div className="row-2">
                <div style={{ marginBottom: 14 }}><label className="fld">Phone</label><input className="inp" name="phone" defaultValue={form.phone} /></div>
                <div style={{ marginBottom: 14 }}><label className="fld">GSTIN</label><input className="inp" name="gstin" defaultValue={form.gstin} /></div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="fld">State</label>
                <select className="inp" name="state" defaultValue={form.state}>
                  <option value="">—</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}><label className="fld">Address</label><input className="inp" name="address" defaultValue={form.address} /></div>
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
