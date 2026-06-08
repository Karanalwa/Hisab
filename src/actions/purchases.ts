"use server";

import { createClient } from "@/lib/supabase/server";
import { getShop } from "@/lib/shop";
import { revalidatePath } from "next/cache";

export async function saveStockIn(formData: FormData) {
  const shop = await getShop();
  if (!shop) throw new Error("Not authorized");
  const supabase = await createClient();

  const productId = String(formData.get("product_id") || "");
  const qty = parseFloat(String(formData.get("qty") || "0")) || 0;
  const cost = parseFloat(String(formData.get("cost") || "0")) || 0;

  const { data: product } = await supabase
    .from("products")
    .select("id,name,stock")
    .eq("id", productId)
    .single();
  if (!product) throw new Error("Product not found");

  await supabase.from("purchases").insert({
    shop_id: shop.id,
    date: String(formData.get("date") || new Date().toISOString().slice(0, 10)),
    product_id: product.id,
    product_name: product.name,
    qty,
    cost,
    supplier: String(formData.get("supplier") || ""),
    note: String(formData.get("note") || ""),
  });

  // increase stock; also refresh latest cost
  await supabase
    .from("products")
    .update({ stock: (product.stock || 0) + qty, cost })
    .eq("id", product.id);

  revalidatePath("/purchases");
  revalidatePath("/products");
}
