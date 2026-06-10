import { createClient } from "@/lib/supabase/server";
import { getShop } from "@/lib/shop";
import { money, fmtDate } from "@/lib/gst";
import { saveCashRegister } from "@/actions/cashRegister";
import DatePicker from "./_client/DatePicker";
import type { Invoice, CashRegister, CreditNote } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  const date = sp.date || new Date().toISOString().slice(0, 10);
  const shop = await getShop();
  const supabase = await createClient();

  // defensive fetches — if migration hasn't run, default to empty
  let invoices: Invoice[] = [];
  let reg: CashRegister | null = null;
  let creditNotes: CreditNote[] = [];
  let missingTable = false;

  try {
    const { data } = await supabase.from("invoices").select("*").eq("date", date);
    invoices = (data || []) as Invoice[];
  } catch {
    invoices = [];
  }

  try {
    const { data } = await supabase.from("cash_register").select("*").eq("date", date).limit(1);
    reg = (data && data[0] ? data[0] : null) as CashRegister | null;
  } catch (e: unknown) {
    const msg = String((e as { message?: string })?.message || "");
    if (msg.includes("relation") && msg.includes("does not exist")) missingTable = true;
    reg = null;
  }

  try {
    const { data } = await supabase.from("credit_notes").select("*").eq("date", date);
    creditNotes = (data || []) as CreditNote[];
  } catch {
    creditNotes = [];
  }

  const byMode: Record<string, number> = {};
  invoices.forEach((i) => {
    byMode[i.pay_mode] = (byMode[i.pay_mode] || 0) + (i.total || 0);
  });

  const cashSales = byMode["Cash"] || 0;
  const upiSales = byMode["UPI"] || 0;
  const cardSales = byMode["Card"] || 0;
  const creditSales = byMode["Credit"] || 0;
  const totalSales = cashSales + upiSales + cardSales + creditSales;
  const totalReturns = creditNotes.reduce((s, c) => s + (c.total || 0), 0);

  const opening = reg?.opening ?? 0;
  const expenses = reg?.expenses ?? 0;
  const closing = reg?.closing ?? 0;
  const expectedClosing = opening + cashSales - expenses - totalReturns;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, letterSpacing: -0.3 }}>Cash Register</h2>
        <p style={{ color: "var(--mut)", fontSize: 13.5 }}>Daily cash drawer closing</p>
      </div>

      {missingTable && (
        <div className="card" style={{ padding: 18, marginBottom: 20, background: "var(--red-soft)", borderColor: "#fecaca" }}>
          <div style={{ fontWeight: 700, color: "#b91c1c", marginBottom: 4 }}>Database migration required</div>
          <p style={{ fontSize: 13, color: "#7f1d1d" }}>
            The <code>cash_register</code> table does not exist yet. Open Supabase SQL Editor and run the migration file <code>supabase/migration_features.sql</code> to enable Cash Register, Returns, and Stock Adjustments.
          </p>
        </div>
      )}

      <form action={saveCashRegister} className="card" style={{ padding: "22px 24px", marginBottom: 20 }}>
        <input type="hidden" name="date" value={date} />
        <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 20 }}>
          <div>
            <label className="fld">Date</label>
            <DatePicker defaultValue={date} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 14, marginBottom: 20 }}>
          <SummaryCard label="Cash Sales" value={money(cashSales)} color="#10b981" />
          <SummaryCard label="UPI Sales" value={money(upiSales)} color="#0ea5e9" />
          <SummaryCard label="Card Sales" value={money(cardSales)} color="#6366f1" />
          <SummaryCard label="Credit Sales" value={money(creditSales)} color="#f59e0b" />
          <SummaryCard label="Total Sales" value={money(totalSales)} color="#0f172a" />
          <SummaryCard label="Returns" value={money(totalReturns)} color="#ef4444" />
        </div>

        <div className="row-3" style={{ marginBottom: 14 }}>
          <div>
            <label className="fld">Opening Cash</label>
            <input className="inp" name="opening" type="number" step="any" defaultValue={opening} placeholder="0.00" />
          </div>
          <div>
            <label className="fld">Expenses / Payouts</label>
            <input className="inp" name="expenses" type="number" step="any" defaultValue={expenses} placeholder="0.00" />
          </div>
          <div>
            <label className="fld">Closing Cash (actual)</label>
            <input className="inp" name="closing" type="number" step="any" defaultValue={closing} placeholder="0.00" />
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label className="fld">Notes</label>
          <input className="inp" name="notes" defaultValue={reg?.notes || ""} placeholder="Any remarks for the day…" />
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn btn-primary" type="submit" disabled={missingTable}>Save Register Entry</button>
          <div style={{ fontSize: 13, color: "var(--mut)" }}>
            Expected closing: <b style={{ color: expectedClosing === closing && closing > 0 ? "var(--green)" : "var(--txt)" }}>{money(expectedClosing)}</b>
            {closing > 0 && expectedClosing !== closing && (
              <span style={{ color: "var(--red)", marginLeft: 8 }}>Diff: {money(closing - expectedClosing)}</span>
            )}
          </div>
        </div>
      </form>

      <div className="card" style={{ padding: "18px 22px" }}>
        <h3 style={{ fontWeight: 800, marginBottom: 14, fontSize: 15 }}>Invoices — {fmtDate(date)}</h3>
        <table className="tbl">
          <thead><tr><th>Invoice</th><th>Customer</th><th className="r">Total</th><th>Mode</th></tr></thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id}>
                <td style={{ fontWeight: 700 }}>{i.no}</td>
                <td style={{ color: "var(--mut)" }}>{i.customer_name}</td>
                <td className="r" style={{ fontWeight: 700 }}>{money(i.total)}</td>
                <td><span className="pill pill-info">{i.pay_mode}</span></td>
              </tr>
            ))}
            {!invoices.length && <tr><td colSpan={4} style={{ color: "var(--mut)", padding: "16px 12px" }}>No invoices for this date.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 11.5, color: "var(--mut)", textTransform: "uppercase", fontWeight: 700, letterSpacing: ".5px" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, marginTop: 6, letterSpacing: -0.3, color }}>{value}</div>
    </div>
  );
}
