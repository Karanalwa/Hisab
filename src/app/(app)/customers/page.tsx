import { createClient } from "@/lib/supabase/server";
import CustomersClient from "./CustomersClient";
import { invoiceDue } from "@/lib/gst";
import type { Customer, Invoice } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const supabase = await createClient();
  const [{ data: cust }, { data: inv }] = await Promise.all([
    supabase.from("customers").select("*").order("name"),
    supabase.from("invoices").select("customer_id,total,paid"),
  ]);
  const outstanding: Record<string, number> = {};
  ((inv || []) as Invoice[]).forEach((i) => {
    if (!i.customer_id) return;
    outstanding[i.customer_id] = (outstanding[i.customer_id] || 0) + Math.max(0, invoiceDue(i));
  });
  return <CustomersClient customers={(cust || []) as Customer[]} outstanding={outstanding} />;
}
