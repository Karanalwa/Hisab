import { createClient } from "@/lib/supabase/server";
import DuesClient from "./DuesClient";
import { invoiceDue } from "@/lib/gst";
import type { Invoice } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DuesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("invoices").select("*").order("date", { ascending: false });
  const due = ((data || []) as Invoice[]).filter((i) => invoiceDue(i) > 0.5);
  return <DuesClient invoices={due} />;
}
