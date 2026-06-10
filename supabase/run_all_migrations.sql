-- ============================================================
--  ONE-FILE MIGRATION: apply everything in Supabase SQL Editor
--  Safe to re-run — all statements are idempotent (IF NOT EXISTS / OR REPLACE).
-- ============================================================

-- ---------- 1. SHOP TERMS & SIGNATURE ----------
alter table public.shops add column if not exists terms text default '';
alter table public.shops add column if not exists signature_url text;

-- ---------- 2. PUBLIC INVOICE (customer share link) ----------
create or replace function public.public_invoice(p_id uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'invoice', to_jsonb(i),
    'shop', jsonb_build_object(
      'name', s.name, 'address', s.address, 'pin', s.pin, 'gstin', s.gstin,
      'state', s.state, 'phone', s.phone, 'logo_url', s.logo_url,
      'upi_qr_url', s.upi_qr_url, 'upi_id', s.upi_id,
      'terms', coalesce(s.terms, ''), 'signature_url', s.signature_url
    )
  )
  from public.invoices i
  join public.shops s on s.id = i.shop_id
  where i.id = p_id
$$;
grant execute on function public.public_invoice(uuid) to anon, authenticated;

-- ---------- 3. CREATE INVOICE — skip stock for service lines ----------
create or replace function public.create_invoice(
  p_date date,
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
  v_shop   uuid := public.auth_shop_id();
  v_prefix text;
  v_no     int;
  v_inv    public.invoices;
  it       jsonb;
begin
  if v_shop is null then raise exception 'No shop for current user'; end if;

  select invoice_prefix, next_invoice_no
    into v_prefix, v_no
    from public.shops where id = v_shop for update;

  for it in select * from jsonb_array_elements(p_items) loop
    if (it->>'productId') is not null and (it->>'productId') <> '' then
      update public.products
        set stock = stock - coalesce((it->>'qty')::numeric, 0)
        where id = (it->>'productId')::uuid and shop_id = v_shop;
    end if;
  end loop;

  insert into public.invoices (
    shop_id, no, date, customer_id, customer_name, customer_gstin,
    customer_state, customer_phone, customer_address, items, inter_state,
    no_tax, taxable, cgst, sgst, igst, round, total, pay_mode, paid, payments
  ) values (
    v_shop, v_prefix || lpad(v_no::text, 4, '0'), p_date, p_customer_id, p_customer_name,
    p_customer_gstin, p_customer_state, p_customer_phone, p_customer_address, p_items,
    p_inter_state, p_no_tax, p_taxable, p_cgst, p_sgst, p_igst, p_round, p_total,
    p_pay_mode, p_paid, p_payments
  ) returning * into v_inv;

  update public.shops set next_invoice_no = next_invoice_no + 1 where id = v_shop;

  return v_inv;
end $$;
grant execute on function public.create_invoice(date,uuid,text,text,text,text,text,jsonb,boolean,boolean,numeric,numeric,numeric,numeric,numeric,numeric,text,numeric,jsonb) to authenticated;

-- ---------- 4. UPDATE INVOICE — skip stock for service lines ----------
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

  select * into v_inv from public.invoices where id = p_id and shop_id = v_shop for update;
  if not found then raise exception 'Invoice not found'; end if;

  for old_it in select * from jsonb_array_elements(v_inv.items) loop
    if (old_it->>'productId') is not null and (old_it->>'productId') <> '' then
      update public.products
        set stock = stock + coalesce((old_it->>'qty')::numeric, 0)
        where id = (old_it->>'productId')::uuid and shop_id = v_shop;
    end if;
  end loop;

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

-- ---------- 5. CREDIT NOTES (Sales Returns) ----------
create table if not exists public.credit_notes (
  id           uuid primary key default gen_random_uuid(),
  shop_id      uuid not null references public.shops(id) on delete cascade,
  invoice_id   uuid not null references public.invoices(id) on delete cascade,
  no           text not null,
  date         date not null default current_date,
  items        jsonb not null default '[]',
  total        numeric not null default 0,
  reason       text default '',
  note         text default '',
  created_at   timestamptz default now()
);
create index if not exists credit_notes_shop_idx on public.credit_notes(shop_id);
create index if not exists credit_notes_invoice_idx on public.credit_notes(invoice_id);
create index if not exists credit_notes_date_idx on public.credit_notes(shop_id, date);

alter table public.credit_notes enable row level security;
drop policy if exists credit_notes_rw on public.credit_notes;
create policy credit_notes_rw on public.credit_notes
  for all using (shop_id = public.auth_shop_id())
  with check (shop_id = public.auth_shop_id());

-- ---------- 6. CREATE CREDIT NOTE — skip stock for service lines ----------
create or replace function public.create_credit_note(
  p_invoice_id uuid,
  p_date date,
  p_items jsonb,
  p_total numeric,
  p_reason text,
  p_note text
) returns public.credit_notes
language plpgsql security definer set search_path = public as $$
declare
  v_shop   uuid := public.auth_shop_id();
  v_inv    public.invoices;
  v_prefix text;
  v_no     int;
  v_cn     public.credit_notes;
  it       jsonb;
begin
  if v_shop is null then raise exception 'No shop for current user'; end if;

  select * into v_inv from public.invoices where id = p_invoice_id and shop_id = v_shop;
  if not found then raise exception 'Invoice not found'; end if;

  for it in select * from jsonb_array_elements(p_items) loop
    if (it->>'productId') is not null and (it->>'productId') <> '' then
      update public.products
        set stock = stock + coalesce((it->>'qty')::numeric, 0)
        where id = (it->>'productId')::uuid and shop_id = v_shop;
    end if;
  end loop;

  select invoice_prefix, next_invoice_no into v_prefix, v_no
    from public.shops where id = v_shop for update;

  insert into public.credit_notes (
    shop_id, invoice_id, no, date, items, total, reason, note
  ) values (
    v_shop, p_invoice_id, v_prefix || 'CN-' || lpad(v_no::text, 4, '0'),
    p_date, p_items, p_total, p_reason, p_note
  ) returning * into v_cn;

  return v_cn;
end $$;
grant execute on function public.create_credit_note(uuid,date,jsonb,numeric,text,text) to authenticated;

-- ---------- 7. CASH REGISTER ----------
create table if not exists public.cash_register (
  id           uuid primary key default gen_random_uuid(),
  shop_id      uuid not null references public.shops(id) on delete cascade,
  date         date not null default current_date,
  opening      numeric not null default 0,
  expenses     numeric not null default 0,
  closing      numeric not null default 0,
  notes        text default '',
  created_at   timestamptz default now(),
  unique(shop_id, date)
);
create index if not exists cash_register_shop_idx on public.cash_register(shop_id);
create index if not exists cash_register_date_idx on public.cash_register(shop_id, date);

alter table public.cash_register enable row level security;
drop policy if exists cash_register_rw on public.cash_register;
create policy cash_register_rw on public.cash_register
  for all using (shop_id = public.auth_shop_id())
  with check (shop_id = public.auth_shop_id());

-- ---------- 8. STOCK ADJUSTMENTS ----------
create table if not exists public.stock_adjustments (
  id           uuid primary key default gen_random_uuid(),
  shop_id      uuid not null references public.shops(id) on delete cascade,
  date         date not null default current_date,
  product_id   uuid references public.products(id) on delete set null,
  product_name text default '',
  qty_change   numeric not null default 0,
  reason       text not null default 'other',
  note         text default '',
  created_at   timestamptz default now()
);
create index if not exists stock_adjustments_shop_idx on public.stock_adjustments(shop_id);
create index if not exists stock_adjustments_date_idx on public.stock_adjustments(shop_id, date);

alter table public.stock_adjustments enable row level security;
drop policy if exists stock_adjustments_rw on public.stock_adjustments;
create policy stock_adjustments_rw on public.stock_adjustments
  for all using (shop_id = public.auth_shop_id())
  with check (shop_id = public.auth_shop_id());
