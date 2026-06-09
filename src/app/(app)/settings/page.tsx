import { getShop } from "@/lib/shop";
import { saveSettings } from "@/actions/settings";
import { INDIAN_STATES } from "@/lib/states";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const shop = await getShop();
  if (!shop) return null;

  return (
    <div>
      <h2 style={{ fontSize: 23, fontWeight: 800, marginBottom: 4 }}>Settings</h2>
      <p style={{ color: "var(--mut)", fontSize: 13, marginBottom: 18 }}>Shop details shown on every invoice</p>

      <form action={saveSettings} className="card" style={{ padding: 24, maxWidth: 640 }}>
        <div style={{ marginBottom: 14 }}><label className="fld">Shop name</label><input className="inp" name="name" defaultValue={shop.name} required /></div>
        <div style={{ marginBottom: 14 }}><label className="fld">Address</label><input className="inp" name="address" defaultValue={shop.address} /></div>
        <div className="row-2">
          <div style={{ marginBottom: 14 }}><label className="fld">PIN code</label><input className="inp" name="pin" defaultValue={shop.pin} /></div>
          <div style={{ marginBottom: 14 }}><label className="fld">Phone</label><input className="inp" name="phone" defaultValue={shop.phone} /></div>
        </div>
        <div className="row-2">
          <div style={{ marginBottom: 14 }}><label className="fld">GSTIN</label><input className="inp" name="gstin" defaultValue={shop.gstin} /></div>
          <div style={{ marginBottom: 14 }}>
            <label className="fld">State</label>
            <select className="inp" name="state" defaultValue={shop.state}>
              <option value="">—</option>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="row-2">
          <div style={{ marginBottom: 14 }}><label className="fld">Invoice prefix</label><input className="inp" name="invoice_prefix" defaultValue={shop.invoice_prefix} /></div>
          <div style={{ marginBottom: 14 }}><label className="fld">UPI ID</label><input className="inp" name="upi_id" defaultValue={shop.upi_id} /></div>
        </div>
        <div className="row-2">
          <div style={{ marginBottom: 14 }}>
            <label className="fld">Logo {shop.logo_url ? "(uploaded ✓)" : ""}</label>
            <input className="inp" name="logo" type="file" accept="image/*" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="fld">UPI QR {shop.upi_qr_url ? "(uploaded ✓)" : ""}</label>
            <input className="inp" name="upi_qr" type="file" accept="image/*" />
          </div>
        </div>
        <p style={{ fontSize: 12, color: "var(--mut)", marginBottom: 14 }}>
          Next invoice number: <b>{shop.invoice_prefix}{String(shop.next_invoice_no).padStart(4, "0")}</b>
        </p>
        <button className="btn btn-primary" type="submit">Save Settings</button>
      </form>
    </div>
  );
}
