import { createClient } from "@/lib/supabase/server";
import type { Invoice } from "@/lib/types";
import { notFound } from "next/navigation";
import InvoiceDocument, { type InvoiceShop } from "@/components/InvoiceDocument";
import PublicBar from "./PublicBar";

export const dynamic = "force-dynamic";

export default async function PublicInvoice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_invoice", { p_id: id });
  if (error || !data) notFound();

  const payload = data as { invoice: Invoice; shop: InvoiceShop };
  if (!payload.invoice) notFound();

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", padding: "24px 0" }}>
      <PublicBar />
      <InvoiceDocument inv={payload.invoice} shop={payload.shop} />
      <div style={{ textAlign: "center", fontSize: 11, color: "var(--mut)", marginTop: 20 }}>Powered by Hisab</div>
    </div>
  );
}
