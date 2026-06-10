"use server";

import { createClient } from "@/lib/supabase/server";
import { getShop } from "@/lib/shop";
import { revalidatePath } from "next/cache";

export async function saveExpense(formData: FormData) {
  const shop = await getShop();
  if (!shop) throw new Error("Not authorized");
  const supabase = await createClient();

  const id = String(formData.get("id") || "");
  const payload = {
    shop_id: shop.id,
    date: String(formData.get("date") || new Date().toISOString().slice(0, 10)),
    category: String(formData.get("category") || "Other"),
    amount: parseFloat(String(formData.get("amount") || "0")) || 0,
    description: String(formData.get("description") || ""),
  };

  if (id) {
    const { error } = await supabase.from("expenses").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("expenses").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/expenses");
}

export async function deleteExpense(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", String(formData.get("id")));
  if (error) throw new Error(error.message);
  revalidatePath("/expenses");
}
