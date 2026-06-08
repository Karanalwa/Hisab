import { createClient } from "@/lib/supabase/server";
import ProductsClient from "./ProductsClient";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("*").order("name");
  return <ProductsClient products={(data || []) as Product[]} />;
}
