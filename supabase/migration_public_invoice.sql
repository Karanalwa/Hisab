-- ============================================================
--  MIGRATION: public (no-login) invoice link
--  Run once in Supabase SQL Editor (after schema.sql).
--  Lets a customer open ONE invoice by its unguessable UUID,
--  returning the invoice + the shop's public header fields only.
-- ============================================================

create or replace function public.public_invoice(p_id uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'invoice', to_jsonb(i),
    'shop', jsonb_build_object(
      'name', s.name, 'address', s.address, 'pin', s.pin, 'gstin', s.gstin,
      'state', s.state, 'phone', s.phone, 'logo_url', s.logo_url,
      'upi_qr_url', s.upi_qr_url, 'upi_id', s.upi_id
    )
  )
  from public.invoices i
  join public.shops s on s.id = i.shop_id
  where i.id = p_id
$$;

grant execute on function public.public_invoice(uuid) to anon, authenticated;
