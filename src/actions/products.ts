"use server";

import { createClient } from "@/lib/supabase/server";
import { getShop } from "@/lib/shop";
import { revalidatePath } from "next/cache";

function num(v: FormDataEntryValue | null) {
  return parseFloat(String(v ?? "0")) || 0;
}

export async function saveProduct(formData: FormData) {
  const shop = await getShop();
  if (!shop) throw new Error("Not authorized");
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const row = {
    shop_id: shop.id,
    name: String(formData.get("name") || "").trim(),
    hsn: String(formData.get("hsn") || ""),
    unit: String(formData.get("unit") || "pcs"),
    price: num(formData.get("price")),
    gst: num(formData.get("gst")),
    stock: num(formData.get("stock")),
    low: num(formData.get("low")),
    cost: num(formData.get("cost")),
  };
  if (id) await supabase.from("products").update(row).eq("id", id);
  else await supabase.from("products").insert(row);
  revalidatePath("/products");
  revalidatePath("/billing");
}

export async function deleteProduct(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("products").delete().eq("id", String(formData.get("id")));
  revalidatePath("/products");
}
