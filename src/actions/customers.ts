"use server";

import { createClient } from "@/lib/supabase/server";
import { getShop } from "@/lib/shop";
import { revalidatePath } from "next/cache";

export async function saveCustomer(formData: FormData) {
  const shop = await getShop();
  if (!shop) throw new Error("Not authorized");
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const row = {
    shop_id: shop.id,
    name: String(formData.get("name") || "").trim(),
    phone: String(formData.get("phone") || ""),
    gstin: String(formData.get("gstin") || ""),
    state: String(formData.get("state") || ""),
    address: String(formData.get("address") || ""),
  };
  if (id) await supabase.from("customers").update(row).eq("id", id);
  else await supabase.from("customers").insert(row);
  revalidatePath("/customers");
  revalidatePath("/billing");
}

export async function deleteCustomer(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("customers").delete().eq("id", String(formData.get("id")));
  revalidatePath("/customers");
}
