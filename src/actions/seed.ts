"use server";

import { createClient } from "@/lib/supabase/server";
import { getShop } from "@/lib/shop";
import { computeBill, isInterState } from "@/lib/gst";
import type { InvoiceItem } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function isoDaysAgo(d: number) {
  const x = new Date();
  x.setDate(x.getDate() - d);
  return x.toISOString().slice(0, 10);
}

export async function seedDemoData() {
  const shop = await getShop();
  if (!shop) throw new Error("Not authorized");
  const supabase = await createClient();

  // ---- Products ----
  const productSeed = [
    { name: "Copper Wire 1.5mm", hsn: "8544", unit: "roll", price: 850, gst: 18, stock: 40, low: 8, cost: 610 },
    { name: "Copper Wire 2.5mm", hsn: "8544", unit: "roll", price: 1320, gst: 18, stock: 27, low: 8, cost: 980 },
    { name: "Modular Switch 6A", hsn: "8536", unit: "pcs", price: 45, gst: 18, stock: 189, low: 25, cost: 28 },
    { name: "LED Bulb 9W", hsn: "8539", unit: "pcs", price: 75, gst: 12, stock: 142, low: 20, cost: 48 },
    { name: "MCB 16A Single Pole", hsn: "8536", unit: "pcs", price: 180, gst: 18, stock: 56, low: 10, cost: 120 },
    { name: "PVC Conduit Pipe 25mm", hsn: "3917", unit: "pcs", price: 60, gst: 18, stock: 120, low: 15, cost: 38 },
    { name: "Ceiling Fan 1200mm", hsn: "8414", unit: "pcs", price: 1650, gst: 18, stock: 16, low: 4, cost: 1180 },
    { name: "Extension Board 4-way", hsn: "8536", unit: "pcs", price: 320, gst: 18, stock: 34, low: 6, cost: 210 },
    { name: "Door Bell", hsn: "8531", unit: "pcs", price: 145, gst: 18, stock: 25, low: 5, cost: 95 },
  ].map((p) => ({ ...p, shop_id: shop.id }));

  const { data: products } = await supabase.from("products").insert(productSeed).select("id,name,hsn,price,gst");
  const P: Record<string, { id: string; name: string; hsn: string; price: number; gst: number }> = {};
  (products || []).forEach((p) => { P[p.name] = p; });

  // ---- Customers (mix of in-state and inter-state for CGST/SGST vs IGST) ----
  const otherState = shop.state === "Maharashtra" ? "Gujarat" : "Maharashtra";
  const customerSeed = [
    { name: "Bhilai Construction Co", phone: "9826055667", gstin: "22CDEFG3456H1Z7", state: shop.state, address: "Sector 6, Bhilai" },
    { name: "Sharma Electricals", phone: "9820011223", gstin: "27ABCDE1234F1Z5", state: otherState, address: "Shop 4, MIDC Road" },
    { name: "Gupta Hardware", phone: "9011223344", gstin: "", state: shop.state, address: "Main Market" },
    { name: "Ramesh Kumar", phone: "9098765432", gstin: "", state: shop.state, address: "Lane 3, Civil Lines" },
  ].map((c) => ({ ...c, shop_id: shop.id }));

  const { data: customers } = await supabase.from("customers").insert(customerSeed).select("id,name,state,gstin,phone,address");
  const C: Record<string, { id: string; name: string; state: string; gstin: string; phone: string; address: string }> = {};
  (customers || []).forEach((c) => { C[c.name] = c; });

  // ---- Purchases (stock-in history) ----
  await supabase.from("purchases").insert([
    { shop_id: shop.id, date: isoDaysAgo(12), product_id: P["Copper Wire 1.5mm"]?.id, product_name: "Copper Wire 1.5mm", qty: 20, cost: 610, supplier: "Polycab Distributor", note: "" },
    { shop_id: shop.id, date: isoDaysAgo(9), product_id: P["LED Bulb 9W"]?.id, product_name: "LED Bulb 9W", qty: 100, cost: 48, supplier: "Wipro Lighting", note: "festival stock" },
    { shop_id: shop.id, date: isoDaysAgo(4), product_id: P["Ceiling Fan 1200mm"]?.id, product_name: "Ceiling Fan 1200mm", qty: 10, cost: 1180, supplier: "Crompton", note: "" },
  ]);

  // ---- Invoices ----
  type Line = [string, number, number?]; // [productName, qty, disc%]
  async function makeInvoice(daysAgo: number, custName: string | null, payMode: string, lines: Line[]) {
    const customer = custName ? C[custName] : null;
    const items: InvoiceItem[] = lines.map(([n, qty, disc]) => {
      const p = P[n];
      return { productId: p.id, name: p.name, hsn: p.hsn, price: p.price, gst: p.gst, qty, disc: disc || 0 };
    });
    const inter = customer ? isInterState(customer.state, shop!.state) : false;
    const bill = computeBill(items, inter, false);
    const date = isoDaysAgo(daysAgo);
    const paid = payMode === "Credit" ? 0 : bill.total;
    const payments = paid ? [{ date, amount: paid, mode: payMode }] : [];
    const { data } = await supabase.rpc("create_invoice", {
      p_date: date,
      p_customer_id: customer?.id ?? null,
      p_customer_name: customer?.name ?? "Walk-in Customer",
      p_customer_gstin: customer?.gstin ?? "",
      p_customer_state: customer?.state ?? shop!.state,
      p_customer_phone: customer?.phone ?? "",
      p_customer_address: customer?.address ?? "",
      p_items: bill.lines,
      p_inter_state: inter,
      p_no_tax: false,
      p_taxable: bill.taxable,
      p_cgst: bill.cgst,
      p_sgst: bill.sgst,
      p_igst: bill.igst,
      p_round: bill.round,
      p_total: bill.total,
      p_pay_mode: payMode,
      p_paid: paid,
      p_payments: payments,
    });
    return data as { id: string } | null;
  }

  await makeInvoice(10, "Bhilai Construction Co", "UPI", [["Copper Wire 2.5mm", 5], ["MCB 16A Single Pole", 8]]);
  await makeInvoice(7, "Sharma Electricals", "Credit", [["Ceiling Fan 1200mm", 3], ["LED Bulb 9W", 20, 5]]); // inter-state IGST, unpaid
  await makeInvoice(5, null, "Cash", [["Modular Switch 6A", 6], ["Extension Board 4-way", 1]]); // walk-in
  await makeInvoice(3, "Gupta Hardware", "Cash", [["PVC Conduit Pipe 25mm", 15], ["Door Bell", 2]]);
  const partial = await makeInvoice(1, "Ramesh Kumar", "Credit", [["LED Bulb 9W", 10], ["Copper Wire 1.5mm", 2]]); // credit
  await makeInvoice(0, "Bhilai Construction Co", "UPI", [["Ceiling Fan 1200mm", 1], ["Modular Switch 6A", 4]]);

  // record a partial payment against the Ramesh Kumar credit invoice (for ledger/dues realism)
  if (partial?.id) {
    await supabase.rpc("add_payment", { p_invoice_id: partial.id, p_amount: 500, p_mode: "Cash", p_date: isoDaysAgo(0) });
  }

  revalidatePath("/dashboard");
  revalidatePath("/products");
  revalidatePath("/customers");
  revalidatePath("/invoices");
  revalidatePath("/dues");
  revalidatePath("/purchases");
  revalidatePath("/reports");
  redirect("/dashboard");
}
