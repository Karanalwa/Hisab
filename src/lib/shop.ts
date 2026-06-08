import { createClient } from "@/lib/supabase/server";
import type { Shop } from "./types";

/** Returns the signed-in user's shop, or null if not signed in / no profile yet. */
export async function getShop(): Promise<Shop | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("shop_id")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  const { data: shop } = await supabase
    .from("shops")
    .select("*")
    .eq("id", profile.shop_id)
    .single();
  return (shop as Shop) ?? null;
}
