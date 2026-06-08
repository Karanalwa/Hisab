"use client";
import { useState } from "react";
import { saveCustomer, deleteCustomer } from "@/actions/customers";
import { money } from "@/lib/gst";
import { INDIAN_STATES } from "@/lib/states";
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

  const filtered = customers.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || (c.phone || "").includes(q));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h2 style={{ fontSize: 23, fontWeight: 800 }}>Customers</h2>
          <p style={{ color: "var(--mut)", fontSize: 13 }}>{customers.length} customers</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(empty); setOpen(true); }}>+ Add Customer</button>
      </div>

      <div className="card" style={{ padding: "16px 20px" }}>
        <input className="inp" placeholder="Search customers…" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 14, maxWidth: 320 }} />
        <table className="tbl">
          <thead><tr><th>Name</th><th>Phone</th><th>State</th><th>GSTIN</th><th className="r">Outstanding</th><th></th></tr></thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 700 }}>{c.name}</td>
                <td>{c.phone}</td>
                <td>{c.state}</td>
                <td>{c.gstin}</td>
                <td className="r" style={{ color: (outstanding[c.id] || 0) > 0 ? "var(--red)" : undefined, fontWeight: 700 }}>{money(outstanding[c.id] || 0)}</td>
                <td className="r">
                  <button className="btn btn-sm" onClick={() => edit(c)}>Edit</button>{" "}
                  <form action={deleteCustomer} style={{ display: "inline" }}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className="btn btn-sm btn-red" type="submit">Del</button>
                  </form>
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={6} style={{ color: "var(--mut)" }}>No customers.</td></tr>}
          </tbody>
        </table>
      </div>

      {open && (
        <div onClick={() => setOpen(false)} style={modalBg}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={modalBox}>
            <h3 style={{ fontWeight: 800, marginBottom: 16 }}>{form.id ? "Edit" : "Add"} Customer</h3>
            <form action={async (fd) => { await saveCustomer(fd); setOpen(false); }}>
              <input type="hidden" name="id" value={form.id} />
              <div style={{ marginBottom: 12 }}><label className="fld">Name</label><input className="inp" name="name" defaultValue={form.name} required /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ marginBottom: 12 }}><label className="fld">Phone</label><input className="inp" name="phone" defaultValue={form.phone} /></div>
                <div style={{ marginBottom: 12 }}><label className="fld">GSTIN</label><input className="inp" name="gstin" defaultValue={form.gstin} /></div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="fld">State</label>
                <select className="inp" name="state" defaultValue={form.state}>
                  <option value="">—</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}><label className="fld">Address</label><input className="inp" name="address" defaultValue={form.address} /></div>
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

const modalBg: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(28,26,58,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 };
const modalBox: React.CSSProperties = { width: 460, padding: 26, maxHeight: "90vh", overflow: "auto" };
