import { createClient } from "@/lib/supabase/server";
import { getShop } from "@/lib/shop";
import BillingClient, { type EditInit } from "../../../billing/BillingClient";
import type { Product, Customer, Invoice, InvoiceItem } from "@/lib/types";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shop = await getShop();
  const supabase = await createClient();

  const [{ data: invData }, { data: prod }, { data: cust }] = await Promise.all([
    supabase.from("invoices").select("*").eq("id", id).single(),
    supabase.from("products").select("*").order("name"),
    supabase.from("customers").select("*").order("name"),
  ]);
  if (!invData) notFound();
  const inv = invData as Invoice;

  const edit: EditInit = {
    id: inv.id,
    no: inv.no,
    customerId: inv.customer_id ?? "",
    walkInName: inv.customer_id ? "" : (inv.customer_name && inv.customer_name !== "Walk-in Customer" ? inv.customer_name : ""),
    walkInPhone: inv.customer_id ? "" : (inv.customer_phone ?? ""),
    items: inv.items.map((l: InvoiceItem) => ({
      productId: l.productId,
      name: l.name,
      hsn: l.hsn,
      price: l.price,
      gst: l.gst,
      qty: l.qty,
      disc: l.disc ?? 0,
    })),
    payMode: inv.pay_mode,
    noTax: inv.no_tax,
  };

  return (
    <BillingClient
      products={(prod || []) as Product[]}
      customers={(cust || []) as Customer[]}
      shopState={shop?.state || ""}
      edit={edit}
    />
  );
}
