import { createClient } from "@/lib/supabase/server";
import { getShop } from "@/lib/shop";
import type { Invoice } from "@/lib/types";
import { notFound } from "next/navigation";
import InvoiceDocument from "@/components/InvoiceDocument";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

export default async function PrintInvoice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shop = await getShop();
  const supabase = await createClient();
  const { data } = await supabase.from("invoices").select("*").eq("id", id).single();
  if (!data || !shop) notFound();
  const inv = data as Invoice;

  return (
    <div style={{ background: "#fff", minHeight: "100vh", padding: "24px 0" }}>
      <PrintButton id={inv.id} customerPhone={inv.customer_phone} />
      <InvoiceDocument inv={inv} shop={shop} />
    </div>
  );
}
