import { getShop } from "@/lib/shop";
import { saveSettings } from "@/actions/settings";
import { seedDemoData } from "@/actions/seed";
import { INDIAN_STATES } from "@/lib/states";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const shop = await getShop();
  if (!shop) return null;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, letterSpacing: -0.3 }}>Settings</h2>
        <p style={{ color: "var(--mut)", fontSize: 13.5 }}>Shop details shown on every invoice</p>
      </div>

      <form action={saveSettings} className="card" style={{ padding: 28, maxWidth: 680 }}>
        <div style={{ marginBottom: 16 }}><label className="fld">Shop name</label><input className="inp" name="name" defaultValue={shop.name} required /></div>
        <div style={{ marginBottom: 16 }}><label className="fld">Address</label><input className="inp" name="address" defaultValue={shop.address} /></div>
        <div className="row-2">
          <div style={{ marginBottom: 16 }}><label className="fld">PIN code</label><input className="inp" name="pin" defaultValue={shop.pin} /></div>
          <div style={{ marginBottom: 16 }}><label className="fld">Phone</label><input className="inp" name="phone" defaultValue={shop.phone} /></div>
        </div>
        <div className="row-2">
          <div style={{ marginBottom: 16 }}><label className="fld">GSTIN</label><input className="inp" name="gstin" defaultValue={shop.gstin} /></div>
          <div style={{ marginBottom: 16 }}>
            <label className="fld">State</label>
            <select className="inp" name="state" defaultValue={shop.state}>
              <option value="">—</option>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="row-2">
          <div style={{ marginBottom: 16 }}><label className="fld">Invoice prefix</label><input className="inp" name="invoice_prefix" defaultValue={shop.invoice_prefix} /></div>
          <div style={{ marginBottom: 16 }}><label className="fld">UPI ID</label><input className="inp" name="upi_id" defaultValue={shop.upi_id} /></div>
        </div>
        <div className="row-2">
          <div style={{ marginBottom: 16 }}>
            <label className="fld">Logo {shop.logo_url ? <span style={{ color: "var(--green)" }}>(uploaded ✓)</span> : ""}</label>
            <input className="inp" name="logo" type="file" accept="image/*" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="fld">UPI QR {shop.upi_qr_url ? <span style={{ color: "var(--green)" }}>(uploaded ✓)</span> : ""}</label>
            <input className="inp" name="upi_qr" type="file" accept="image/*" />
          </div>
        </div>
        <div className="row-2">
          <div style={{ marginBottom: 16 }}>
            <label className="fld">Signature {shop.signature_url ? <span style={{ color: "var(--green)" }}>(uploaded ✓)</span> : ""}</label>
            <input className="inp" name="signature" type="file" accept="image/*" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="fld">Terms &amp; Conditions (shown on invoice)</label>
            <input className="inp" name="terms" defaultValue={shop.terms || ""} placeholder="e.g. Goods once sold will not be taken back." />
          </div>
        </div>
        <p style={{ fontSize: 13, color: "var(--mut)", marginBottom: 18 }}>
          Next invoice number: <b style={{ color: "var(--txt)" }}>{shop.invoice_prefix}{String(shop.next_invoice_no).padStart(4, "0")}</b>
        </p>
        <button className="btn btn-primary" type="submit">Save Settings</button>
      </form>

      <div className="card" style={{ padding: 28, maxWidth: 680, marginTop: 20 }}>
        <h3 style={{ fontWeight: 800, marginBottom: 8, fontSize: 17 }}>Sample data</h3>
        <p style={{ fontSize: 13.5, color: "var(--mut)", marginBottom: 16 }}>
          Fills your shop with demo products, customers, purchases and a few invoices (a mix of paid and
          credit) so you can explore the Dashboard, Reports, Dues and Ledgers. You can edit or delete them
          anytime. Clicking again adds another batch.
        </p>
        <form action={seedDemoData}>
          <button className="btn btn-green" type="submit">✨ Load sample data</button>
        </form>
      </div>
    </div>
  );
}
