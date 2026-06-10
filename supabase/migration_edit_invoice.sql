-- ============================================================
--  MIGRATION: edit invoice support
--  Run this once in Supabase SQL Editor (after schema.sql).
--  Adds an atomic update_invoice() that restores the old stock,
--  deducts the new lines, and rewrites the invoice in one step.
-- ============================================================

create or replace function public.update_invoice(
  p_id uuid,
  p_customer_id uuid,
  p_customer_name text,
  p_customer_gstin text,
  p_customer_state text,
  p_customer_phone text,
  p_customer_address text,
  p_items jsonb,
  p_inter_state boolean,
  p_no_tax boolean,
  p_taxable numeric,
  p_cgst numeric,
  p_sgst numeric,
  p_igst numeric,
  p_round numeric,
  p_total numeric,
  p_pay_mode text,
  p_paid numeric,
  p_payments jsonb
) returns public.invoices
language plpgsql security definer set search_path = public as $$
declare
  v_shop uuid := public.auth_shop_id();
  v_inv  public.invoices;
  old_it jsonb;
  it     jsonb;
begin
  if v_shop is null then raise exception 'No shop for current user'; end if;

  -- lock the existing invoice (and confirm it belongs to this shop)
  select * into v_inv from public.invoices where id = p_id and shop_id = v_shop for update;
  if not found then raise exception 'Invoice not found'; end if;

  -- put the old quantities back into stock (skip service/non-inventory lines)
  for old_it in select * from jsonb_array_elements(v_inv.items) loop
    if (old_it->>'productId') is not null and (old_it->>'productId') <> '' then
      update public.products
        set stock = stock + coalesce((old_it->>'qty')::numeric, 0)
        where id = (old_it->>'productId')::uuid and shop_id = v_shop;
    end if;
  end loop;

  -- deduct the new quantities (skip service/non-inventory lines)
  for it in select * from jsonb_array_elements(p_items) loop
    if (it->>'productId') is not null and (it->>'productId') <> '' then
      update public.products
        set stock = stock - coalesce((it->>'qty')::numeric, 0)
        where id = (it->>'productId')::uuid and shop_id = v_shop;
    end if;
  end loop;

  update public.invoices set
    customer_id = p_customer_id, customer_name = p_customer_name, customer_gstin = p_customer_gstin,
    customer_state = p_customer_state, customer_phone = p_customer_phone, customer_address = p_customer_address,
    items = p_items, inter_state = p_inter_state, no_tax = p_no_tax,
    taxable = p_taxable, cgst = p_cgst, sgst = p_sgst, igst = p_igst, round = p_round, total = p_total,
    pay_mode = p_pay_mode, paid = p_paid, payments = p_payments
    where id = p_id and shop_id = v_shop
    returning * into v_inv;

  return v_inv;
end $$;

grant execute on function public.update_invoice(uuid,uuid,text,text,text,text,text,jsonb,boolean,boolean,numeric,numeric,numeric,numeric,numeric,numeric,text,numeric,jsonb) to authenticated;
