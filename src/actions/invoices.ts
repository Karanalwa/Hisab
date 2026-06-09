"use server";

import { createClient } from "@/lib/supabase/server";
import { getShop } from "@/lib/shop";
import { computeBill, isInterState, todayISO } from "@/lib/gst";
import type { InvoiceItem } from "@/lib/types";
import { revalidatePath } from "next/cache";

export type NewSalePayload = {
  customerId: string | null;
  walkInName?: string;
  walkInPhone?: string;
  items: InvoiceItem[];
  payMode: string; // Cash | UPI | Card | Credit
  noTax: boolean;
};

export async function createInvoice(payload: NewSalePayload) {
  const shop = await getShop();
  if (!shop) throw new Error("Not authorized");
  const supabase = await createClient();

  if (!payload.items.length) throw new Error("Cart is empty");

  // resolve customer (existing, or create walk-in if a name was given)
  let customer: {
    id: string | null;
    name: string;
    gstin: string;
    state: string;
    phone: string;
    address: string;
  } | null = null;

  if (payload.customerId) {
    const { data } = await supabase
      .from("customers")
      .select("id,name,gstin,state,phone,address")
      .eq("id", payload.customerId)
      .single();
    if (data) customer = data;
  } else if (payload.walkInName?.trim()) {
    const ins = {
      shop_id: shop.id,
      name: payload.walkInName.trim(),
      phone: payload.walkInPhone || "",
      gstin: "",
      state: shop.state,
      address: "",
    };
    const { data } = await supabase.from("customers").insert(ins).select("id,name,gstin,state,phone,address").single();
    if (data) customer = data;
  }

  if (payload.payMode === "Credit" && !customer) {
    throw new Error("Enter a customer name for a credit sale");
  }

  const inter = customer ? isInterState(customer.state, shop.state) : false;
  const bill = computeBill(payload.items, inter, payload.noTax);
  const paid = payload.payMode === "Credit" ? 0 : bill.total;
  const payments = paid ? [{ date: todayISO(), amount: paid, mode: payload.payMode }] : [];

  const { data, error } = await supabase.rpc("create_invoice", {
    p_date: todayISO(),
    p_customer_id: customer?.id ?? null,
    p_customer_name: customer?.name ?? "Walk-in Customer",
    p_customer_gstin: customer?.gstin ?? "",
    p_customer_state: customer?.state ?? shop.state,
    p_customer_phone: customer?.phone ?? "",
    p_customer_address: customer?.address ?? "",
    p_items: bill.lines,
    p_inter_state: inter,
    p_no_tax: payload.noTax,
    p_taxable: bill.taxable,
    p_cgst: bill.cgst,
    p_sgst: bill.sgst,
    p_igst: bill.igst,
    p_round: bill.round,
    p_total: bill.total,
    p_pay_mode: payload.payMode,
    p_paid: paid,
    p_payments: payments,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/invoices");
  revalidatePath("/products");
  revalidatePath("/dashboard");
  revalidatePath("/dues");
  return data; // the created invoice row
}

export async function addPayment(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_payment", {
    p_invoice_id: String(formData.get("invoice_id")),
    p_amount: parseFloat(String(formData.get("amount") || "0")) || 0,
    p_mode: String(formData.get("mode") || "Cash"),
    p_date: String(formData.get("date") || new Date().toISOString().slice(0, 10)),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dues");
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
}

export async function deleteInvoice(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("invoices").delete().eq("id", String(formData.get("id")));
  revalidatePath("/invoices");
  revalidatePath("/dues");
  revalidatePath("/dashboard");
}

export async function updateInvoice(payload: NewSalePayload & { id: string }) {
  const shop = await getShop();
  if (!shop) throw new Error("Not authorized");
  const supabase = await createClient();

  if (!payload.items.length) throw new Error("Cart is empty");

  // existing invoice (for date + current payment state on credit edits)
  const { data: existing } = await supabase
    .from("invoices")
    .select("date, paid, payments")
    .eq("id", payload.id)
    .single();
  if (!existing) throw new Error("Invoice not found");

  // resolve customer (existing, or create a walk-in if a name was typed)
  let customer:
    | { id: string | null; name: string; gstin: string; state: string; phone: string; address: string }
    | null = null;

  if (payload.customerId) {
    const { data } = await supabase
      .from("customers")
      .select("id,name,gstin,state,phone,address")
      .eq("id", payload.customerId)
      .single();
    if (data) customer = data;
  } else if (payload.walkInName?.trim()) {
    const ins = {
      shop_id: shop.id,
      name: payload.walkInName.trim(),
      phone: payload.walkInPhone || "",
      gstin: "",
      state: shop.state,
      address: "",
    };
    const { data } = await supabase.from("customers").insert(ins).select("id,name,gstin,state,phone,address").single();
    if (data) customer = data;
  }

  if (payload.payMode === "Credit" && !customer) {
    throw new Error("Enter a customer name for a credit sale");
  }

  const inter = customer ? isInterState(customer.state, shop.state) : false;
  const bill = computeBill(payload.items, inter, payload.noTax);

  // keep payments on a credit edit; otherwise mark fully paid
  let paid: number;
  let payments: { date: string; amount: number; mode: string }[];
  if (payload.payMode === "Credit") {
    paid = existing.paid ?? 0;
    payments = existing.payments ?? [];
  } else {
    paid = bill.total;
    payments = [{ date: existing.date, amount: bill.total, mode: payload.payMode }];
  }

  const { data, error } = await supabase.rpc("update_invoice", {
    p_id: payload.id,
    p_customer_id: customer?.id ?? null,
    p_customer_name: customer?.name ?? "Walk-in Customer",
    p_customer_gstin: customer?.gstin ?? "",
    p_customer_state: customer?.state ?? shop.state,
    p_customer_phone: customer?.phone ?? "",
    p_customer_address: customer?.address ?? "",
    p_items: bill.lines,
    p_inter_state: inter,
    p_no_tax: payload.noTax,
    p_taxable: bill.taxable,
    p_cgst: bill.cgst,
    p_sgst: bill.sgst,
    p_igst: bill.igst,
    p_round: bill.round,
    p_total: bill.total,
    p_pay_mode: payload.payMode,
    p_paid: paid,
    p_payments: payments,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/invoices");
  revalidatePath("/products");
  revalidatePath("/dashboard");
  revalidatePath("/dues");
  revalidatePath(`/invoices/${payload.id}/print`);
  return data;
}
