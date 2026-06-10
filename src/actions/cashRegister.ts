"use server";

import { createClient } from "@/lib/supabase/server";
import { getShop } from "@/lib/shop";
import { revalidatePath } from "next/cache";

export async function saveCashRegister(formData: FormData) {
  const shop = await getShop();
  if (!shop) throw new Error("Not authorized");
  const supabase = await createClient();

  const date = String(formData.get("date") || new Date().toISOString().slice(0, 10));
  const opening = parseFloat(String(formData.get("opening") || "0")) || 0;
  const expenses = parseFloat(String(formData.get("expenses") || "0")) || 0;
  const closing = parseFloat(String(formData.get("closing") || "0")) || 0;
  const notes = String(formData.get("notes") || "");

  const { error } = await supabase
    .from("cash_register")
    .upsert(
      {
        shop_id: shop.id,
        date,
        opening,
        expenses,
        closing,
        notes,
      },
      { onConflict: "shop_id,date" }
    );

  if (error) throw new Error(error.message);

  revalidatePath("/register");
}
