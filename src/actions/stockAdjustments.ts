"use server";

import { createClient } from "@/lib/supabase/server";
import { getShop } from "@/lib/shop";
import { revalidatePath } from "next/cache";

export async function saveStockAdjustment(formData: FormData) {
  const shop = await getShop();
  if (!shop) throw new Error("Not authorized");
  const supabase = await createClient();

  const productId = String(formData.get("product_id"));
  const date = String(formData.get("date") || new Date().toISOString().slice(0, 10));
  const qtyChange = parseFloat(String(formData.get("qty_change") || "0")) || 0;
  const reason = String(formData.get("reason") || "other");
  const note = String(formData.get("note") || "");

  if (!productId) throw new Error("Select a product");
  if (qtyChange === 0) throw new Error("Quantity change cannot be zero");

  // get product name for the record
  const { data: prod } = await supabase
    .from("products")
    .select("name, stock")
    .eq("id", productId)
    .eq("shop_id", shop.id)
    .single();

  if (!prod) throw new Error("Product not found");
  if (prod.stock + qtyChange < 0) throw new Error("Adjustment would make stock negative");

  // create adjustment record
  const { error: adjError } = await supabase.from("stock_adjustments").insert({
    shop_id: shop.id,
    date,
    product_id: productId,
    product_name: prod.name,
    qty_change: qtyChange,
    reason,
    note,
  });

  if (adjError) throw new Error(adjError.message);

  // update product stock
  const { error: stockError } = await supabase
    .from("products")
    .update({ stock: prod.stock + qtyChange })
    .eq("id", productId)
    .eq("shop_id", shop.id);

  if (stockError) throw new Error(stockError.message);

  revalidatePath("/products");
  revalidatePath("/dashboard");
}
