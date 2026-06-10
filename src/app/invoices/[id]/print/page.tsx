import { createClient } from "@/lib/supabase/server";
import { getShop } from "@/lib/shop";
import type { Invoice, CreditNote } from "@/lib/types";
import { notFound } from "next/navigation";
import InvoiceDocument from "@/components/InvoiceDocument";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

export default async function PrintInvoice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shop = await getShop();
  const supabase = await createClient();
  const [{ data: invData }, { data: cnData }] = await Promise.all([
    supabase.from("invoices").select("*").eq("id", id).single(),
    supabase.from("credit_notes").select("*").eq("invoice_id", id),
  ]);
  if (!invData || !shop) notFound();
  const inv = invData as Invoice;
  const creditNotes = (cnData || []) as CreditNote[];

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", padding: "24px 0" }}>
      <PrintButton invoice={inv} />
      <InvoiceDocument inv={inv} shop={shop} creditNotes={creditNotes} />
    </div>
  );
}
