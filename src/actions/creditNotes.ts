"use server";

import { createClient } from "@/lib/supabase/server";
import { getShop } from "@/lib/shop";
import { revalidatePath } from "next/cache";

export type ReturnItem = {
  productId: string;
  name: string;
  price: number;
  gst: number;
  qty: number;
};

export async function createCreditNote(formData: FormData) {
  const shop = await getShop();
  if (!shop) throw new Error("Not authorized");
  const supabase = await createClient();

  const invoiceId = String(formData.get("invoice_id"));
  const date = String(formData.get("date") || new Date().toISOString().slice(0, 10));
  const reason = String(formData.get("reason") || "");
  const note = String(formData.get("note") || "");
  const itemsRaw = String(formData.get("items") || "[]");
  const items = JSON.parse(itemsRaw) as ReturnItem[];
  const total = items.reduce((s, it) => s + it.qty * it.price * (1 + it.gst / 100), 0);

  if (!items.length) throw new Error("No items selected for return");

  const { data, error } = await supabase.rpc("create_credit_note", {
    p_invoice_id: invoiceId,
    p_date: date,
    p_items: items,
    p_total: total,
    p_reason: reason,
    p_note: note,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}/print`);
  revalidatePath("/dashboard");
  revalidatePath("/products");
  return data;
}
