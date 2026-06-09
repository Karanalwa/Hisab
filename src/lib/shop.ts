import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Shop } from "./types";

/**
 * Returns the signed-in user's shop, or null if not signed in / no profile yet.
 *
 * Wrapped in React `cache()` so that when both the layout and the page call it
 * during the same request, the work runs only once. Uses a single joined query
 * (profiles -> shops) instead of two sequential round-trips.
 */
export const getShop = cache(async (): Promise<Shop | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("shop:shops(*)")
    .eq("id", user.id)
    .single();

  const shop = (data as { shop: Shop | Shop[] } | null)?.shop;
  if (!shop) return null;
  return (Array.isArray(shop) ? shop[0] : shop) ?? null;
});
