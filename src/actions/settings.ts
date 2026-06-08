"use server";

import { createClient } from "@/lib/supabase/server";
import { getShop } from "@/lib/shop";
import { revalidatePath } from "next/cache";

export async function saveSettings(formData: FormData) {
  const shop = await getShop();
  if (!shop) throw new Error("Not authorized");
  const supabase = await createClient();

  const update: Record<string, unknown> = {
    name: String(formData.get("name") || ""),
    address: String(formData.get("address") || ""),
    pin: String(formData.get("pin") || ""),
    gstin: String(formData.get("gstin") || ""),
    state: String(formData.get("state") || ""),
    phone: String(formData.get("phone") || ""),
    invoice_prefix: String(formData.get("invoice_prefix") || "INV-"),
    upi_id: String(formData.get("upi_id") || ""),
  };

  // optional file uploads -> Supabase Storage (public bucket "shop-assets")
  const logo = formData.get("logo") as File | null;
  const qr = formData.get("upi_qr") as File | null;

  async function upload(file: File | null, key: string) {
    if (!file || file.size === 0) return null;
    const path = `${shop!.id}/${key}-${Date.now()}`;
    const { error } = await supabase.storage.from("shop-assets").upload(path, file, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from("shop-assets").getPublicUrl(path);
    return data.publicUrl;
  }

  const logoUrl = await upload(logo, "logo");
  const qrUrl = await upload(qr, "qr");
  if (logoUrl) update.logo_url = logoUrl;
  if (qrUrl) update.upi_qr_url = qrUrl;

  await supabase.from("shops").update(update).eq("id", shop.id);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}
