import { createClient } from "@/lib/supabase/server";
import { getShop } from "@/lib/shop";
import BillingClient from "./BillingClient";
import type { Product, Customer } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const shop = await getShop();
  const supabase = await createClient();
  const [{ data: prod }, { data: cust }] = await Promise.all([
    supabase.from("products").select("*").order("name"),
    supabase.from("customers").select("*").order("name"),
  ]);
  return (
    <BillingClient
      products={(prod || []) as Product[]}
      customers={(cust || []) as Customer[]}
      shopState={shop?.state || ""}
    />
  );
}
