import type { InvoiceItem, Invoice } from "./types";

/** GST bill calculation — ported 1:1 from the original Alwa Sales POS. */
export function computeBill(
  lines: InvoiceItem[],
  inter: boolean,
  noTax: boolean
) {
  let taxable = 0,
    cgst = 0,
    sgst = 0,
    igst = 0;
  const out = lines.map((l) => {
    const gross = l.qty * l.price;
    const tax = gross * (1 - (l.disc || 0) / 100);
    const rate = noTax ? 0 : l.gst || 0;
    const g = tax * (rate / 100);
    taxable += tax;
    if (inter) igst += g;
    else {
      cgst += g / 2;
      sgst += g / 2;
    }
    return { ...l, taxable: tax, gstAmt: g, amount: tax + g };
  });
  const pre = taxable + cgst + sgst + igst;
  const total = Math.round(pre);
  return { lines: out, taxable, cgst, sgst, igst, round: total - pre, total };
}

export function isInterState(custState: string, shopState: string) {
  if (!custState || !shopState) return false;
  return custState !== shopState;
}

export function invoiceDue(i: Pick<Invoice, "total" | "paid">) {
  return Math.round(((i.total || 0) - (i.paid || 0)) * 100) / 100;
}

export function invoiceStatus(i: Pick<Invoice, "total" | "paid">) {
  const d = invoiceDue(i);
  if (d <= 0.5) return "Paid";
  if ((i.paid || 0) > 0.5) return "Partial";
  return "Unpaid";
}

/** Indian-format number to words (rupees). */
export function numWords(n: number): string {
  n = Math.round(n);
  if (n === 0) return "Zero";
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (x: number) => (x < 20 ? a[x] : b[Math.floor(x / 10)] + (x % 10 ? " " + a[x % 10] : ""));
  const three = (x: number) =>
    (x > 99 ? a[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " : "") : "") + (x % 100 ? two(x % 100) : "");
  let s = "";
  const cr = Math.floor(n / 1e7); n %= 1e7;
  const la = Math.floor(n / 1e5); n %= 1e5;
  const th = Math.floor(n / 1e3); n %= 1e3;
  if (cr) s += three(cr) + " Crore ";
  if (la) s += three(la) + " Lakh ";
  if (th) s += three(th) + " Thousand ";
  if (n) s += three(n);
  return s.trim();
}

export const money = (n: number) =>
  "₹" + (Math.round((n || 0) * 100) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtDate = (d: string) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day} ${months[parseInt(m, 10) - 1]} ${y}`;
};

export const todayISO = () => new Date().toISOString().slice(0, 10);
